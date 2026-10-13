import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'answered',
    },
    citations: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['book', 'shop'],
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null,
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      default: null,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true },
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
