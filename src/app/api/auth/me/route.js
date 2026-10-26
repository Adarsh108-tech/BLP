import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Author from '@/models/Author';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getSessionUser(request);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select('-password').lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      );
    }

    let authorDetails = null;
    if (user.role === 'author' && user.author_id) {
      authorDetails = await Author.findOne({ author_id: user.author_id }).lean();
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        authorDetails,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
