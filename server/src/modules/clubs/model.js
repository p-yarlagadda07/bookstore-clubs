import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
    rules: {
      type: [String],
      default: [],
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    currentBookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null,
    },
    readingPace: {
      pagesPerWeek: {
        type: Number,
        default: 100,
      },
    },
  },
  { timestamps: true }
);

const membershipSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'removed'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

membershipSchema.index({ clubId: 1, userId: 1 }, { unique: true });

const meetingSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null,
    },
    agenda: {
      type: String,
      default: '',
      trim: true,
    },
    chapterRange: {
      from: {
        type: Number,
      },
      to: {
        type: Number,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

meetingSchema.index({ clubId: 1 });

export const Club = mongoose.model('Club', clubSchema);
export const Membership = mongoose.model('Membership', membershipSchema);
export const Meeting = mongoose.model('Meeting', meetingSchema);