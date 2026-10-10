import mongoose from 'mongoose';
import { Club, Membership, Meeting } from './model.js';
import Progress from '../progress/model.js';
import { AppError } from '../../lib/AppError.js';
import Excerpt from '../../ai/ingest/excerpt.model.js';
import { logAudit } from '../audit/service.js';

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

export async function getClub(id) {
  return Club.findById(id).lean();
}

export async function isMember(clubId, userId) {
  const membership = await Membership.findOne({
    clubId,
    userId,
    status: 'active',
  }).lean();

  return !!membership;
}

// used by the reading agent (Srilekha) - only members can ask about a club
export async function getConstraints(clubId, user) {
  const club = await getClub(clubId);
  if (!club) throw new AppError('NOT_FOUND', 404, 'Club not found');
  if (!user || !(await isMember(clubId, user._id))) {
    throw new AppError('FORBIDDEN', 403, 'Only club members can do this');
  }

  const [memberCount, nextMeeting] = await Promise.all([
    Membership.countDocuments({ clubId, status: 'active' }),
    Meeting.findOne({ clubId, date: { $gte: new Date() } })
      .sort({ date: 1 })
      .lean(),
  ]);

  const pagesPerWeek = club.readingPace?.pagesPerWeek ?? 100;
  let daysUntilMeeting = null;
  let pagesPossible = 0;

  if (nextMeeting) {
    const msPerDay = 24 * 60 * 60 * 1000;
    daysUntilMeeting = Math.max(0, Math.ceil((nextMeeting.date - Date.now()) / msPerDay));
    pagesPossible = Math.floor((pagesPerWeek * daysUntilMeeting) / 7);
  }

  return {
    clubId: String(club._id),
    memberCount,
    nextMeeting: nextMeeting?.date ?? null,
    daysUntilMeeting,
    pagesPerWeek,
    pagesPossible,
    rules: club.rules ?? [],
  };
}

// club/public progress of active members, only for members
export async function getClubProgress(clubId, user) {
  if (!(await isMember(clubId, user._id))) {
    throw new AppError('FORBIDDEN', 403, 'Only club members can see club progress');
  }

  const memberIds = await Membership.find({ clubId, status: 'active' }).distinct('userId');

  return Progress.find({
    clubId,
    userId: { $in: memberIds },
    visibility: { $in: ['club', 'public'] },
  })
    .sort({ updatedAt: -1 })
    .lean();
}
export async function createMeeting(clubId, data, user) {
  if (data.date < new Date()) {
    throw new AppError('VALIDATION_ERROR', 400, 'Meeting date cannot be in the past');
  }

  const meeting = await Meeting.create({
    clubId,
    date: data.date,
    time: data.time,
    location: data.location,
    agenda: data.agenda ?? '',
    bookId: data.bookId ?? null,
    chapterRange: data.chapterRange ?? undefined,
    createdBy: user._id,
  });

  return toMeeting(meeting);
}

export async function getClubMembers(clubId) {
  const memberships = await Membership.find({
    clubId,
    status: 'active',
  })
    .sort({ joinedAt: 1 })
    .lean();

  const userIds = memberships.map((membership) => membership.userId);

  const users = await mongoose.connection
    .collection('users')
    .find({ _id: { $in: userIds } }, { projection: { name: 1, email: 1 } })
    .toArray();

  const userMap = new Map(users.map((user) => [String(user._id), user]));

  return {
    items: memberships.map((membership) => {
      const user = userMap.get(String(membership.userId));

      return {
        id: membership.userId,
        name: user?.name,
        email: user?.email,
        joinedAt: membership.joinedAt,
      };
    }),
  };
}
export async function updateClub(clubId, data) {
  const club = await Club.findById(clubId);
  if (!club) throw new AppError('NOT_FOUND', 404, 'Club not found');

  if (data.currentBookId !== undefined) {
    const book = await mongoose.connection
      .collection('books')
      .findOne({ _id: new mongoose.Types.ObjectId(data.currentBookId) });

    if (!book) {
      throw new AppError('VALIDATION_ERROR', 400, 'Book not found');
    }

    club.currentBookId = data.currentBookId;
  }

  if (data.description !== undefined) club.description = data.description;
  if (data.rules !== undefined) club.rules = data.rules;

  if (data.pagesPerWeek !== undefined) {
    club.readingPace = club.readingPace || {};
    club.readingPace.pagesPerWeek = data.pagesPerWeek;
  }

  await club.save();

  return getPublishedClubById(clubId);
}

export async function removeClubMember(clubId, userId, moderatorId) {
  if (String(userId) === String(moderatorId)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Moderator cannot remove themselves');
  }

  const membership = await Membership.findOne({
    clubId,
    userId,
    status: 'active',
  });

  if (!membership) {
    throw new AppError('NOT_FOUND', 404, 'Active membership not found');
  }

  membership.status = 'removed';
  await membership.save();

  return {};
}

export async function listClubExcerpts(clubId, status = 'pending') {
  const club = await Club.findById(clubId).lean();

  if (!club) {
    throw new AppError('NOT_FOUND', 404, 'Club not found');
  }

  if (!club.currentBookId) {
    return { book: null, items: [] };
  }

  const book = await mongoose.connection
    .collection('books')
    .findOne(
      { _id: new mongoose.Types.ObjectId(String(club.currentBookId)) },
      { projection: { title: 1 } },
    );

  if (!book) {
    return { book: null, items: [] };
  }

  const filter = { bookId: club.currentBookId };

  if (status === 'pending') filter.approved = false;
  if (status === 'approved') filter.approved = true;

  const excerpts = await Excerpt.find(filter).sort({ chapter: 1, pageStart: 1, _id: 1 }).lean();

  return {
    book: { id: book._id, title: book.title },
    items: excerpts.map((excerpt) => ({
      id: excerpt._id,
      chapter: excerpt.chapter,
      pageStart: excerpt.pageStart ?? null,
      pageEnd: excerpt.pageEnd ?? null,
      text: excerpt.text,
      approved: excerpt.approved,
    })),
  };
}

export async function updateExcerptApproval(clubId, excerptId, approved, user) {
  const club = await Club.findById(clubId).lean();

  if (!club) {
    throw new AppError('NOT_FOUND', 404, 'Club not found');
  }

  if (!club.currentBookId) {
    throw new AppError('NOT_FOUND', 404, 'Excerpt not found for this club');
  }

  const excerpt = await Excerpt.findOne({
    _id: excerptId,
    bookId: club.currentBookId,
  });

  if (!excerpt) {
    throw new AppError('NOT_FOUND', 404, 'Excerpt not found for this club');
  }

  excerpt.approved = approved;
  excerpt.approvedBy = approved ? user._id : null;
  await excerpt.save();

  await logAudit(user, 'excerpt.approve', { type: 'excerpt', id: excerpt._id }, { approved });

  return {
    id: excerpt._id,
    chapter: excerpt.chapter,
    pageStart: excerpt.pageStart ?? null,
    pageEnd: excerpt.pageEnd ?? null,
    text: excerpt.text,
    approved: excerpt.approved,
  };
}
