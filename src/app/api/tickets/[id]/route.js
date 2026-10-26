import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Ticket from '@/models/Ticket';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    await connectToDatabase();

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const query = isMongoId ? { _id: id } : { ticket_number: id };

    let ticket = await Ticket.findOne(query).lean();
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // RBAC: Authors only see their own tickets
    if (session.role === 'author') {
      if (ticket.author_id !== session.author_id) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this ticket' },
          { status: 403 }
        );
      }
      // Hide internal notes from author view
      const { internal_notes, ...sanitized } = ticket;
      ticket = sanitized;
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('Ticket fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
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
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid update body' },
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

    // Role verification
    if (session.role === 'author') {
      // Authors can only close their own ticket
      if (ticket.author_id !== session.author_id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
      if (body.status === 'Closed') {
        ticket.status = 'Closed';
      } else {
        return NextResponse.json(
          { success: false, error: 'Authors can only close their own tickets' },
          { status: 403 }
        );
      }
    } else {
      // Admin updates: status, category, priority, assigned_to
      if (body.status && ['Open', 'In Progress', 'Resolved', 'Closed'].includes(body.status)) {
        ticket.status = body.status;
      }

      if (body.category && body.category !== ticket.category) {
        ticket.category = body.category;
        ticket.category_overridden = true;
      }

      if (body.priority && body.priority !== ticket.priority) {
        ticket.priority = body.priority;
        ticket.priority_overridden = true;
      }

      if (body.assigned_to !== undefined) {
        ticket.assigned_to = body.assigned_to;
        ticket.assigned_name = body.assigned_name || (body.assigned_to === 'Unassigned' ? '' : session.name);
      }

      if (body.ai_draft_response !== undefined) {
        ticket.ai_draft_response = body.ai_draft_response;
      }
    }

    ticket.updated_at = new Date();
    await ticket.save();

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket,
    });
  } catch (error) {
    console.error('Ticket update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
