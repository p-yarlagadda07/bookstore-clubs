import mongoose from 'mongoose';
import { Club, Membership, Meeting } from './model.js';

// Sowmya's Book model isn't merged yet, so read the books collection directly for now
async function getBooksById(ids) {
  const realIds = ids.filter(Boolean);
  if (!realIds.length) return new Map();
  const books = await mongoose.connection
    .collection('books')
    .find({ _id: { $in: realIds } }, { projection: { title: 1, authors: 1 } })
    .toArray();
  return new Map(books.map((b) => [String(b._id), b]));
}

function toBook(book) {
  if (!book) return null;
  return { title: book.title, author: (book.authors || []).join(', ') };
}

function toMeeting(m) {
  return { id: m._id, date: m.date, time: m.time, location: m.location, agenda: m.agenda };
}

export const getPublishedClubs = async () => {
  const clubs = await Club.find({ published: true }).lean();
  const books = await getBooksById(clubs.map((c) => c.currentBookId));

  const items = await Promise.all(
    clubs.map(async (club) => {
      const memberCount = await Membership.countDocuments({ clubId: club._id, status: 'active' });
      const nextMeeting = await Meeting.findOne({ clubId: club._id, date: { $gte: new Date() } })
        .sort({ date: 1 })
        .lean();

      return {
        id: club._id,
        name: club.name,
        description: club.description,
        rules: club.rules,
        memberCount,
        nextMeeting: nextMeeting ? toMeeting(nextMeeting) : null,
        currentBook: toBook(books.get(String(club.currentBookId))),
      };
    }),
  );

  return { items };
};

export const getPublishedClubById = async (id) => {
  const club = await Club.findOne({ _id: id, published: true }).lean();
  if (!club) return null;

  const books = await getBooksById([club.currentBookId]);
  const meetings = await Meeting.find({ clubId: club._id, date: { $gte: new Date() } })
    .sort({ date: 1 })
    .lean();

  return {
    id: club._id,
    name: club.name,
    description: club.description,
    rules: club.rules,
    currentBook: toBook(books.get(String(club.currentBookId))),
    meetings: meetings.map(toMeeting),
  };
};

export const joinClub = async (clubId, user) => {
  const club = await Club.findOne({ _id: clubId, published: true });
  if (!club) return { error: 'NOT_FOUND' };

  const existing = await Membership.findOne({ clubId, userId: user._id });
  if (existing?.status === 'active') return { error: 'ALREADY_MEMBER' };
  if (existing?.status === 'removed') return { error: 'REMOVED' };

  try {
    const membership = await Membership.create({ clubId, userId: user._id });
    return { membership };
  } catch (err) {
    // two join requests at the same time
    if (err.code === 11000) return { error: 'ALREADY_MEMBER' };
    throw err;
  }
};
