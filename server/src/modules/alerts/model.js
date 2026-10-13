
import mongoose from 'mongoose';

const stockAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'sent'],
      default: 'waiting',
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

stockAlertSchema.index({ userId: 1, bookId: 1, status: 1 });

export default mongoose.model('StockAlert', stockAlertSchema);
