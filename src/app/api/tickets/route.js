import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Ticket from '@/models/Ticket';
import Author from '@/models/Author';
import { getSessionUser } from '@/lib/auth';
import { classifyAndScoreTicket, generateDraftResponse } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const query = {};

    // Role-based access control: Authors only see their own tickets
    if (session.role === 'author') {
      if (!session.author_id) {
        return NextResponse.json({ success: true, tickets: [], count: 0 });
      }
      query.author_id = session.author_id;
    } else {
      // Admin filters
      const authorIdParam = searchParams.get('author_id');
      if (authorIdParam && authorIdParam !== 'all') {
        query.author_id = authorIdParam;
      }

      const statusParam = searchParams.get('status');
      if (statusParam && statusParam !== 'all') {
        query.status = statusParam;
      }

      const categoryParam = searchParams.get('category');
      if (categoryParam && categoryParam !== 'all') {
        query.category = categoryParam;
      }

      const priorityParam = searchParams.get('priority');
      if (priorityParam && priorityParam !== 'all') {
        query.priority = priorityParam;
      }

      const searchParam = searchParams.get('search');
      if (searchParam && searchParam.trim()) {
        const regex = new RegExp(searchParam.trim(), 'i');
        query.$or = [
          { ticket_number: regex },
          { subject: regex },
          { author_name: regex },
          { author_email: regex },
          { book_title: regex },
          { description: regex },
        ];
      }
    }

    // Sort order
    const sortBy = searchParams.get('sort') || 'urgent';
    let sortOptions = { created_at: -1 };

    if (sortBy === 'urgent') {
      // Critical / High priority first, oldest unresolved first
      // In Mongo, we can fetch and apply our urgent weighting
      sortOptions = { created_at: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { created_at: 1 };
    } else if (sortBy === 'newest') {
      sortOptions = { created_at: -1 };
    }

    let tickets = await Ticket.find(query).sort(sortOptions).lean();

    // Custom multi-tier urgent sorting if requested
    if (sortBy === 'urgent') {
      const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const statusWeight = { Open: 3, 'In Progress': 2, Resolved: 1, Closed: 0 };

      tickets = tickets.sort((a, b) => {
        // Unresolved tickets come before resolved/closed
        const aStatusScore = statusWeight[a.status] ?? 0;
        const bStatusScore = statusWeight[b.status] ?? 0;
        if (aStatusScore !== bStatusScore) {
          return bStatusScore - aStatusScore;
        }

        // Higher priority first
        const aPri = priorityWeight[a.priority] || 1;
        const bPri = priorityWeight[b.priority] || 1;
        if (aPri !== bPri) {
          return bPri - aPri;
        }

        // Oldest first for urgent backlog resolution
        return new Date(a.created_at) - new Date(b.created_at);
      });
    }

    // Filter out internal notes for authors
    if (session.role === 'author') {
      tickets = tickets.map((t) => {
        const { internal_notes, ...rest } = t;
        return rest;
      });
    }

    // Calculate queue health metrics for admin
    const metrics = {
      total: tickets.length,
      openCount: tickets.filter((t) => t.status === 'Open').length,
      inProgressCount: tickets.filter((t) => t.status === 'In Progress').length,
      resolvedCount: tickets.filter((t) => t.status === 'Resolved').length,
      criticalCount: tickets.filter((t) => t.priority === 'Critical').length,
      highCount: tickets.filter((t) => t.priority === 'High').length,
    };

    return NextResponse.json({
      success: true,
      count: tickets.length,
      metrics,
      tickets,
    });
  } catch (error) {
    console.error('Tickets fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { subject, description, book_id, attachment_name } = body;

    // Strict Input Validation
    if (!subject || subject.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Subject is required (minimum 3 characters)' },
        { status: 400 }
      );
    }

    if (!description || description.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: 'Description is required (minimum 8 characters)' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Determine target author
    let authorId = session.author_id;
    let authorName = session.name;
    let authorEmail = session.email;

    // If admin is creating a ticket on behalf of an author
    if (session.role === 'admin' && body.author_id) {
      authorId = body.author_id;
    }

    const author = await Author.findOne({ author_id: authorId }).lean();
    if (author) {
      authorName = author.name;
      authorEmail = author.email;
    }

    // Find specific book if provided
    let bookTitle = 'General / Account Level';
    let selectedBookData = null;

    if (book_id && book_id !== 'GENERAL' && author?.books) {
      const found = author.books.find((b) => b.book_id === book_id);
      if (found) {
        bookTitle = found.title;
        selectedBookData = found;
      }
    }

    // Generate unique sequential ticket number
    const count = await Ticket.countDocuments();
    const ticketNumber = `BLP-${1000 + count + 1}`;

    // 1. Run AI Auto-Classification and Priority Scoring (with fallback)
    const triage = await classifyAndScoreTicket({
      subject: subject.trim(),
      description: description.trim(),
      bookTitle,
      authorName,
    });

    // 2. Pre-generate AI Drafted Response based on Knowledge Base & Book Data
    const aiDraft = await generateDraftResponse({
      subject: subject.trim(),
      description: description.trim(),
      category: triage.category,
      authorName,
      bookData: selectedBookData,
    });

    const newTicket = await Ticket.create({
      ticket_number: ticketNumber,
      author_id: authorId || 'AUTH_GUEST',
      author_name: authorName,
      author_email: authorEmail,
      book_id: book_id || 'GENERAL',
      book_title: bookTitle,
      subject: subject.trim(),
      description: description.trim(),
      attachment_name: attachment_name || null,
      category: triage.category,
      ai_category: triage.category,
      priority: triage.priority,
      ai_priority: triage.priority,
      ai_confidence_reasoning: triage.reasoning,
      ai_draft_response: aiDraft,
      status: 'Open',
      assigned_to: 'Unassigned',
      messages: [
        {
          sender_role: 'author',
          sender_name: authorName,
          message: description.trim(),
          created_at: new Date(),
        },
      ],
      internal_notes: [],
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Ticket created and analyzed successfully',
        ticket: newTicket,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ticket creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
