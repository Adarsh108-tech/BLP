import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Ticket from '@/models/Ticket';
import { getSessionUser } from '@/lib/auth';

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
    const body = await request.json().catch(() => null);
    if (!body || !body.note || !body.note.trim()) {
      return NextResponse.json(
        { success: false, error: 'Internal note text is required' },
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

    const newNote = {
      admin_name: session.name,
      admin_email: session.email,
      note: body.note.trim(),
      created_at: new Date(),
    };

    ticket.internal_notes.push(newNote);
    ticket.updated_at = new Date();
    await ticket.save();

    return NextResponse.json({
      success: true,
      message: 'Internal note recorded',
      note: newNote,
      internal_notes: ticket.internal_notes,
    });
  } catch (error) {
    console.error('Note add error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add internal note' },
      { status: 500 }
    );
  }
}
