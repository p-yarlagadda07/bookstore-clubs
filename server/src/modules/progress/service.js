import Progress from './model.js';

export async function setProgress(user, { bookId, clubId, chapter, page, visibility }) {
  const update = { chapter };
  if (clubId !== undefined) update.clubId = clubId;
  if (page !== undefined) update.page = page;
  if (visibility !== undefined) update.visibility = visibility;

  const progress = await Progress.findOneAndUpdate(
    { userId: user._id, bookId },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  return progress;
}

export async function getMyProgress(user, bookId) {
  return Progress.findOne({ userId: user._id, bookId }).lean();
}

export async function getBoundary(user, bookId) {
  const progress = await Progress.findOne({ userId: user._id, bookId }).lean();
  if (!progress) return null;
  return { chapter: progress.chapter, page: progress.page ?? null };
}