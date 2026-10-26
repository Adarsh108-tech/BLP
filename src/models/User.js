import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['author', 'admin'],
      default: 'author',
    },
    author_id: {
      type: String,
      default: null,
      ref: 'Author',
    },
    phone: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'blp_users', // Explicit collection namespace to isolate from other projects
  }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
