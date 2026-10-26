import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Ticket from '@/models/Ticket';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json().catch(() => null);
    if (!body || !body.message || !body.message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      );
    }

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

    // RBAC check
    if (session.role === 'author' && ticket.author_id !== session.author_id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const newMessage = {
      sender_role: session.role,
      sender_name: session.name,
      message: body.message.trim(),
      created_at: new Date(),
    };

    ticket.messages.push(newMessage);

    // Automatic status transitions
    if (session.role === 'admin') {
      if (body.resolve) {
        ticket.status = 'Resolved';
      } else if (ticket.status === 'Open') {
        ticket.status = 'In Progress';
      }
      // If unassigned, assign to current replying admin
      if (ticket.assigned_to === 'Unassigned') {
        ticket.assigned_to = session.email;
        ticket.assigned_name = session.name;
      }
    } else if (session.role === 'author') {
      // Re-open if resolved
      if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        ticket.status = 'In Progress';
      }
    }

    ticket.updated_at = new Date();
    await ticket.save();

    return NextResponse.json({
      success: true,
      message: 'Message delivered successfully',
      newMessage,
      ticketStatus: ticket.status,
      ticket,
    });
  } catch (error) {
    console.error('Message post error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post message' },
      { status: 500 }
    );
  }
}
