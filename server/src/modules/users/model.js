import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    emailVerifiedAt: { type: Date, default: null },
    roles: { type: [String], enum: ['reader', 'bookseller', 'admin'], default: ['reader'] },
    moderatorOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
    preferences: {
      genres: { type: [String], default: [] },
      moods: { type: [String], default: [] },
      maxPages: { type: Number, default: null },
    },
    spoilerSettings: {
      strict: { type: Boolean, default: false },
      maxChapter: { type: Number, default: null },
    },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);