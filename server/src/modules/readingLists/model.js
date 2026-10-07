import mongoose from "mongoose";

const readingListItemSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },

    note: {
      type: String,
      maxlength: 300,
    },
  },
  { _id: false }
);

const readingListSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 80,
    },

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    items: {
      type: [readingListItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

readingListSchema.index({ ownerId: 1 });

export const ReadingList = mongoose.model(
  "ReadingList",
  readingListSchema
);