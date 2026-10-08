import mongoose from 'mongoose';

const storeDocSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['policy', 'event', 'faq'], required: true },
    text: { type: String, required: true },
    chunkIndex: { type: Number, default: 0 },
    embedding: { type: [Number], select: false },
  },
  { timestamps: true, collection: 'storedocs' }
);

export default mongoose.model('StoreDoc', storeDocSchema);
