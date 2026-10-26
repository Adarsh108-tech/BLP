import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Author from '@/models/Author';
import { getSessionUser } from '@/lib/auth';

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

    let targetAuthorId = session.author_id;

    // Admin can specify any authorId
    if (session.role === 'admin') {
      const requestedAuthor = searchParams.get('author_id');
      if (requestedAuthor) {
        targetAuthorId = requestedAuthor;
      } else {
        // Return all books across all authors
        const allAuthors = await Author.find({}).lean();
        const allBooks = [];
        for (const auth of allAuthors) {
          for (const bk of auth.books || []) {
            allBooks.push({
              ...bk,
              author_id: auth.author_id,
              author_name: auth.name,
              author_email: auth.email,
            });
          }
        }
        return NextResponse.json({
          success: true,
          count: allBooks.length,
          books: allBooks,
        });
      }
    }

    if (!targetAuthorId) {
      return NextResponse.json(
        { success: false, error: 'No author profile associated with this account' },
        { status: 400 }
      );
    }

    const author = await Author.findOne({ author_id: targetAuthorId }).lean();
    if (!author) {
      return NextResponse.json(
        { success: false, error: 'Author record not found' },
        { status: 404 }
      );
    }

    // Calculate aggregated metrics for the author
    const books = author.books || [];
    const totalEarnings = books.reduce((sum, b) => sum + (b.total_royalty_earned || 0), 0);
    const totalPaid = books.reduce((sum, b) => sum + (b.royalty_paid || 0), 0);
    const totalPending = books.reduce((sum, b) => sum + (b.royalty_pending || 0), 0);
    const totalCopies = books.reduce((sum, b) => sum + (b.total_copies_sold || 0), 0);
    const thresholdMet = totalPending >= 1000;

    return NextResponse.json({
      success: true,
      author: {
        author_id: author.author_id,
        name: author.name,
        email: author.email,
        phone: author.phone,
        city: author.city,
        joined_date: author.joined_date,
      },
      summary: {
        totalBooks: books.length,
        totalCopiesSold: totalCopies,
        totalRoyaltyEarned: totalEarnings,
        totalRoyaltyPaid: totalPaid,
        totalRoyaltyPending: totalPending,
        minimumThreshold: 1000,
        thresholdMet,
        rolloverNotice: !thresholdMet && totalPending > 0 ? `Pending balance (₹${totalPending}) is below the ₹1,000 threshold and will roll over to the next quarterly cycle.` : null,
      },
      books,
    });
  } catch (error) {
    console.error('Books fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
