import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Ticket from '@/models/Ticket';
import Author from '@/models/Author';
import { getSessionUser } from '@/lib/auth';
import { generateDraftResponse } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin authorization required' },
        { status: 403 }
      );
    }

    const { id } = params;
    await connectToDatabase();
    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const query = isMongoId ? { _id: id } : { ticket_number: id };

    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Lookup author & book details
    let bookData = null;
    if (ticket.author_id && ticket.book_id !== 'GENERAL') {
      const author = await Author.findOne({ author_id: ticket.author_id }).lean();
      if (author?.books) {
        bookData = author.books.find((b) => b.book_id === ticket.book_id);
      }
    }

    const newDraft = await generateDraftResponse({
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      authorName: ticket.author_name,
      bookData,
      previousMessages: ticket.messages,
    });

    ticket.ai_draft_response = newDraft;
    await ticket.save();

    return NextResponse.json({
      success: true,
      message: 'AI draft generated successfully',
      draft: newDraft,
    });
  } catch (error) {
    console.error('AI draft generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate AI draft' },
      { status: 500 }
    );
  }
}
