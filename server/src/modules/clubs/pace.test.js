import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { createApp } from '../../app.js';
import { loginAs } from '../../../test/helpers/auth.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { Club, Membership } from './model.js';
import Progress from '../progress/model.js';

const app = createApp();
const DAY = 24 * 60 * 60 * 1000;

async function createBook({ pageCount = 300, chapterCount = 15 } = {}) {
  const bookId = new mongoose.Types.ObjectId();

  await mongoose.connection.collection('books').insertOne({
    _id: bookId,
    title: 'Test Reading Book',
    pageCount,
    chapterCount,
  });

  return bookId;
}

beforeAll(async () => {
  await startTestDB();
}, 120000);

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe('Club Pace API', () => {
  it('allows a member to view pace and calculates the target page', async () => {
    const bookId = await createBook({ pageCount: 300, chapterCount: 15 });
    const club = await Club.create({
      name: 'Pace Test Club',
      published: true,
      currentBookId: bookId,
      bookStartedAt: new Date(Date.now() - 14 * DAY),
      readingPace: { pagesPerWeek: 100 },
    });

    const member = await loginAs(app);
    await Membership.create({
      clubId: club._id,
      userId: member.user._id,
      status: 'active',
    });

    const response = await member.agent.get(`/api/clubs/${club._id}/pace`);

    expect(response.status).toBe(200);
    expect(response.body.data.book.pageCount).toBe(300);
    expect(response.body.data.pagesPerWeek).toBe(100);
    expect(response.body.data.weeksIn).toBe(3);
    expect(response.body.data.targetPage).toBe(300);
    expect(response.body.data.totalWeeks).toBe(3);
  });

  it('returns 403 to a nonmember', async () => {
    const bookId = await createBook();
    const club = await Club.create({
      name: 'Members Only Pace Club',
      published: true,
      currentBookId: bookId,
      readingPace: { pagesPerWeek: 100 },
    });

    const stranger = await loginAs(app);
    const response = await stranger.agent.get(`/api/clubs/${club._id}/pace`);

    expect(response.status).toBe(403);
  });

  it('does not expose private progress and counts private or missing progress', async () => {
    const bookId = await createBook();
    const club = await Club.create({
      name: 'Private Progress Club',
      published: true,
      currentBookId: bookId,
      bookStartedAt: new Date(),
      readingPace: { pagesPerWeek: 100 },
    });

    const visibleMemberId = new mongoose.Types.ObjectId();
    const privateMemberId = new mongoose.Types.ObjectId();
    const noProgressMemberId = new mongoose.Types.ObjectId();

    await Membership.create([
      { clubId: club._id, userId: visibleMemberId, status: 'active' },
      { clubId: club._id, userId: privateMemberId, status: 'active' },
      { clubId: club._id, userId: noProgressMemberId, status: 'active' },
    ]);

    await mongoose.connection.collection('users').insertMany([
      { _id: visibleMemberId, name: 'Visible Reader' },
      { _id: privateMemberId, name: 'Private Reader' },
      { _id: noProgressMemberId, name: 'No Progress Reader' },
    ]);

    await Progress.create([
      {
        userId: visibleMemberId,
        bookId,
        clubId: club._id,
        chapter: 5,
        page: 100,
        visibility: 'club',
      },
      {
        userId: privateMemberId,
        bookId,
        clubId: club._id,
        chapter: 8,
        page: 180,
        visibility: 'private',
      },
    ]);

    const member = await loginAs(app);
    await Membership.create({
      clubId: club._id,
      userId: member.user._id,
      status: 'active',
    });

    const response = await member.agent.get(`/api/clubs/${club._id}/pace`);

    expect(response.status).toBe(200);
    expect(response.body.data.members.map((item) => item.name)).not.toContain('Private Reader');
    expect(response.body.data.members.map((item) => item.name)).not.toContain('No Progress Reader');
    expect(response.body.data.privateCount).toBe(3);
  });

  it('never sets the target page above the book page count', async () => {
    const bookId = await createBook({ pageCount: 250, chapterCount: 10 });
    const club = await Club.create({
      name: 'Target Cap Club',
      published: true,
      currentBookId: bookId,
      bookStartedAt: new Date(Date.now() - 70 * DAY),
      readingPace: { pagesPerWeek: 100 },
    });

    const member = await loginAs(app);
    await Membership.create({
      clubId: club._id,
      userId: member.user._id,
      status: 'active',
    });

    const response = await member.agent.get(`/api/clubs/${club._id}/pace`);

    expect(response.status).toBe(200);
    expect(response.body.data.targetPage).toBe(250);
    expect(response.body.data.targetPage).toBeLessThanOrEqual(250);
  });
});
