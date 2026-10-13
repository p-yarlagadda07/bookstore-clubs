import { Club, Meeting } from '../clubs/model.js';
import { isMember } from '../clubs/service.js';
import Book from '../books/model.js';
import { AppError } from '../../lib/AppError.js';
import { buildIcs } from './ics.js';

export async function meetingIcs(user, clubId, meetingId) {
  const meeting = await Meeting.findOne({ _id: meetingId, clubId }).lean();
  if (!meeting) throw new AppError('NOT_FOUND', 404, 'Meeting not found');

  const moderates = (user.moderatorOf ?? []).map(String).includes(String(clubId));
  const admin = user.roles?.includes('admin');
  if (!moderates && !admin && !(await isMember(clubId, user._id))) {
    throw new AppError('FORBIDDEN', 403, 'Only club members can save this meeting');
  }

  const club = await Club.findById(clubId).lean();
  const bookId = meeting.bookId ?? club.currentBookId;
  const book = bookId ? await Book.findById(bookId).select('title').lean() : null;

  const [h, m] = (meeting.time || '18:00').split(':').map(Number);
  const start = new Date(meeting.date);
  start.setHours(h || 0, m || 0, 0, 0);
  const end = new Date(start.getTime() + 90 * 60 * 1000);

  let description = meeting.agenda || '';
  const range = meeting.chapterRange;
  if (range?.from && range?.to) description += ` Chapters ${range.from} to ${range.to}.`;

  return buildIcs({
    uid: String(meeting._id),
    start,
    end,
    title: book ? `${club.name}: ${book.title}` : club.name,
    location: meeting.location,
    description: description.trim(),
  });
}
