import { createApp } from '../../app.js';
import { loginAs } from '../../../test/helpers/auth.js';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { Club } from './model.js';
import Book from '../books/model.js';
import Excerpt from '../../ai/ingest/excerpt.model.js';
import { AuditLog } from '../audit/model.js';

const app = createApp();

beforeAll(async () => {
  await startTestDB();
}, 120000);

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

async function setupClub() {
  const book = await Book.create({
    title: 'Test Book',
    authors: ['Test Author'],
    approvedSource: true,
  });

  const club = await Club.create({
    name: 'Test Club',
    description: 'A test club',
    published: true,
    currentBookId: book._id,
  });

  return { book, club };
}

async function createExcerpt(bookId, approved = false) {
  return Excerpt.create({
    bookId,
    text: 'A sample excerpt for testing.',
    chapter: 1,
    pageStart: 1,
    pageEnd: 2,
    approved,
  });
}

describe('Club excerpt approval', () => {
  it('moderator lists pending excerpts by default', async () => {
    const { book, club } = await setupClub();
    const pending = await createExcerpt(book._id, false);
    await createExcerpt(book._id, true);

    const { agent } = await loginAs(app, {
      moderatorOf: [club._id],
    });

    const response = await agent.get(`/api/clubs/${club._id}/excerpts`);

    expect(response.status).toBe(200);
    expect(response.body.data.book.title).toBe('Test Book');
    expect(response.body.data.items).toHaveLength(1);
    expect(String(response.body.data.items[0].id)).toBe(String(pending._id));
    expect(response.body.data.items[0].approved).toBe(false);
  });

  it('approves an excerpt and lists it under approved', async () => {
    const { book, club } = await setupClub();
    const excerpt = await createExcerpt(book._id);

    const { agent, csrf, user } = await loginAs(app, {
      moderatorOf: [club._id],
    });

    const patchResponse = await agent
      .patch(`/api/clubs/${club._id}/excerpts/${excerpt._id}`)
      .set('x-csrf-token', csrf)
      .send({ approved: true });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.data.approved).toBe(true);

    const savedExcerpt = await Excerpt.findById(excerpt._id);
    expect(savedExcerpt.approved).toBe(true);
    expect(String(savedExcerpt.approvedBy)).toBe(String(user._id));

    const audit = await AuditLog.findOne({
      action: 'excerpt.approve',
      targetId: excerpt._id,
    });
    expect(audit).not.toBeNull();
    expect(audit.details.approved).toBe(true);

    const listResponse = await agent.get(`/api/clubs/${club._id}/excerpts?status=approved`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.items).toHaveLength(1);
    expect(String(listResponse.body.data.items[0].id)).toBe(String(excerpt._id));
  });

  it('rejects a regular reader with 403', async () => {
    const { book, club } = await setupClub();
    const excerpt = await createExcerpt(book._id);
    const { agent, csrf } = await loginAs(app);

    const listResponse = await agent.get(`/api/clubs/${club._id}/excerpts`);
    expect(listResponse.status).toBe(403);

    const patchResponse = await agent
      .patch(`/api/clubs/${club._id}/excerpts/${excerpt._id}`)
      .set('x-csrf-token', csrf)
      .send({ approved: true });

    expect(patchResponse.status).toBe(403);
  });

  it('returns 404 when the excerpt belongs to another book', async () => {
    const { club } = await setupClub();
    const otherBook = await Book.create({
      title: 'Another Book',
      authors: ['Another Author'],
      approvedSource: true,
    });
    const excerpt = await createExcerpt(otherBook._id);

    const { agent, csrf } = await loginAs(app, {
      moderatorOf: [club._id],
    });

    const response = await agent
      .patch(`/api/clubs/${club._id}/excerpts/${excerpt._id}`)
      .set('x-csrf-token', csrf)
      .send({ approved: true });

    expect(response.status).toBe(404);
  });
});
