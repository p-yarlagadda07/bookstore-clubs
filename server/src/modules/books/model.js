import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    authors: [String],

    isbn: String,

    themes: [String],

    moods: [String],

    synopsis: String,

    pageCount: Number,

    chapterCount: Number,

    readingHours: Number,

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CatalogSource',
    },

    approvedSource: {
      type: Boolean,
      default: false,
    },

    contentLevel: {
      type: String,
      enum: ['synopsis', 'excerpts'],
      default: 'synopsis',
    },

    embedding: {
      type: [Number],
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

bookSchema.index({
  title: 'text',
  authors: 'text',
});

export default mongoose.model('Book', bookSchema);
