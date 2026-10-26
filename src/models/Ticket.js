import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender_role: {
    type: String,
    enum: ['author', 'admin', 'system'],
    required: true,
  },
  sender_name: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const InternalNoteSchema = new mongoose.Schema({
  admin_name: {
    type: String,
    required: true,
  },
  admin_email: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const TicketSchema = new mongoose.Schema(
  {
    ticket_number: {
      type: String,
      required: true,
      unique: true,
    },
    author_id: {
      type: String,
      required: true,
      index: true,
    },
    author_name: {
      type: String,
      required: true,
    },
    author_email: {
      type: String,
      required: true,
    },
    book_id: {
      type: String,
      default: 'GENERAL',
    },
    book_title: {
      type: String,
      default: 'General / Account Level',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    attachment_name: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: [
        'Royalty & Payments',
        'ISBN & Metadata Issues',
        'Printing & Quality',
        'Distribution & Availability',
        'Book Status & Production Updates',
        'General Inquiry',
      ],
      default: 'General Inquiry',
      index: true,
    },
    ai_category: {
      type: String,
      default: 'General Inquiry',
    },
    category_overridden: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium',
      index: true,
    },
    ai_priority: {
      type: String,
      default: 'Medium',
    },
    priority_overridden: {
      type: Boolean,
      default: false,
    },
    ai_confidence_reasoning: {
      type: String,
      default: '',
    },
    ai_draft_response: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
      index: true,
    },
    assigned_to: {
      type: String,
      default: 'Unassigned',
      index: true,
    },
    assigned_name: {
      type: String,
      default: '',
    },
    messages: [MessageSchema],
    internal_notes: [InternalNoteSchema],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'blp_tickets', // Explicit collection namespace to isolate from other projects
  }
);

export default mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
