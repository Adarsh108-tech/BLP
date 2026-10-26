import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema({
  book_id: { type: String, required: true },
  title: { type: String, required: true },
  isbn: { type: String, default: null },
  genre: { type: String, default: 'General' },
  publication_date: { type: String, default: null },
  status: { type: String, default: 'In Production' },
  mrp: { type: Number, default: null },
  author_royalty_per_copy: { type: Number, default: null },
  total_copies_sold: { type: Number, default: 0 },
  total_royalty_earned: { type: Number, default: 0 },
  royalty_paid: { type: Number, default: 0 },
  royalty_pending: { type: Number, default: 0 },
  last_royalty_payout_date: { type: String, default: null },
  print_partner: { type: String, default: null },
  available_on: { type: [String], default: [] },
});

const AuthorSchema = new mongoose.Schema(
  {
    author_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    joined_date: { type: String, default: '' },
    books: [BookSchema],
  },
  {
    timestamps: true,
    collection: 'blp_authors', // Explicit collection namespace to isolate from other projects
  }
);

export default mongoose.models.Author || mongoose.model('Author', AuthorSchema);
