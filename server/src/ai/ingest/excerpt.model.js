import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const excerptSchema = new mongoose.Schema(
  {
    bookId: { type: ObjectId, ref: 'Book', required: true },
    sourceId: { type: ObjectId, ref: 'CatalogSource' },
    text: { type: String, required: true, maxlength: 2000 },
    chapter: { type: Number, required: true, min: 1 },
    pageStart: Number,
    pageEnd: Number,
    approved: { type: Boolean, default: false },
    approvedBy: { type: ObjectId, ref: 'User' },
    embedding: { type: [Number], select: false },
  },
  { timestamps: true, collection: 'excerpts' }
);

excerptSchema.index({ bookId: 1, approved: 1, chapter: 1 });

export default mongoose.model('Excerpt', excerptSchema);
