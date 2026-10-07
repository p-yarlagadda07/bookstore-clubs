import mongoose from 'mongoose';
import Progress from './model.js';

export async function setProgress(user, { bookId, clubId, chapter, page, visibility }) {
  const update = { chapter };
  if (clubId !== undefined) update.clubId = clubId;
  if (page !== undefined) update.page = page;
  if (visibility !== undefined) update.visibility = visibility;

  return Progress.findOneAndUpdate(
    { userId: user._id, bookId },
    { $set: update },
    { new: true, upsert: true, runValidators: true },
  ).lean();
}

export async function listMyProgress(user) {
  return Progress.find({ userId: user._id }).sort({ updatedAt: -1 }).lean();
}

export async function getMyProgress(user, bookId) {
  return Progress.findOne({ userId: user._id, bookId }).lean();
}

// How far the assistant is allowed to talk about this book for this reader.
// Progress is per book, so clubId isn't used yet.
// eslint-disable-next-line no-unused-vars
export async function getBoundary(userId, bookId, clubId) {
  const progress = await Progress.findOne({ userId, bookId }).lean();
  // User model is Yasaswi's, so read the settings straight from the collection
  const user = await mongoose.connection
    .collection('users')
    .findOne(
      { _id: new mongoose.Types.ObjectId(String(userId)) },
      { projection: { spoilerSettings: 1 } },
    );

  const declared = progress?.chapter ?? 0;
  const settings = user?.spoilerSettings;
  const limit = settings?.strict && settings.maxChapter != null ? settings.maxChapter : declared;

  return {
    chapter: Math.min(declared, limit),
    page: progress?.page ?? 0,
    declared: !!progress,
  };
}
