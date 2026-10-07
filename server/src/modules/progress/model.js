import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    chapter: { type: Number, required: true, min: 0 },
    page: { type: Number, min: 0 },
    visibility: { type: String, enum: ['private', 'club', 'public'], default: 'private' },
  },
  { timestamps: true },
);

// one progress record per reader per book
progressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export default mongoose.model('Progress', progressSchema);
