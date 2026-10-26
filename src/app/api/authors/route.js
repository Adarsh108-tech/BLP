import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Author from '@/models/Author';
import Ticket from '@/models/Ticket';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getSessionUser(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin authorization required' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const authors = await Author.find({}).lean();
    const tickets = await Ticket.find({}).lean();

    const authorsWithStats = authors.map((author) => {
      const authorTickets = tickets.filter((t) => t.author_id === author.author_id);
      const books = author.books || [];
      const totalEarned = books.reduce((sum, b) => sum + (b.total_royalty_earned || 0), 0);
      const totalPaid = books.reduce((sum, b) => sum + (b.royalty_paid || 0), 0);
      const totalPending = books.reduce((sum, b) => sum + (b.royalty_pending || 0), 0);
      const totalCopies = books.reduce((sum, b) => sum + (b.total_copies_sold || 0), 0);

      return {
        ...author,
        stats: {
          booksCount: books.length,
          totalCopiesSold: totalCopies,
          totalRoyaltyEarned: totalEarned,
          totalRoyaltyPaid: totalPaid,
          totalRoyaltyPending: totalPending,
          ticketCount: authorTickets.length,
          openTicketCount: authorTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      count: authorsWithStats.length,
      authors: authorsWithStats,
    });
  } catch (error) {
    console.error('Authors fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch authors' },
      { status: 500 }
    );
  }
}
