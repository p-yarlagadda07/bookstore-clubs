import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';

import { Club, Meeting } from '../../modules/clubs/model.js';
import Book from '../../modules/books/model.js';

vi.mock('../ollama.js', () => ({
  chat: { invoke: vi.fn() },
  isOllamaUp: vi.fn().mockResolvedValue(false),
}));

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
    themes: ['mystery'],
    moods: ['suspenseful'],
    synopsis: 'A mystery for testing.',
    chapterCount: 10,
    approvedSource: true,
  });

  const club = await Club.create({
    name: 'Test Talking Points Club',
    published: true,
    currentBookId: book._id,
  });

  return { book, club };
}

describe('Talking Points', () => {
  it('returns five template questions for a moderator when Ollama is off', async () => {
    const { book, club } = await setupClub();

    const { agent, csrf } = await loginAs(app, {
      moderatorOf: [club._id],
    });

    const meeting = await Meeting.create({
      clubId: club._id,
      date: new Date(),
      createdBy: (await loginAs(app)).user._id,
      chapterRange: { from: 1, to: 5 },
    });

    const response = await agent
      .post(`/api/clubs/${club._id}/talking-points`)
      .set('x-csrf-token', csrf)
      .send({ meetingId: String(meeting._id) });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.chapterLimit).toBe(5);
    expect(response.body.data.questions).toHaveLength(5);
    expect(response.body.data.source).toBe('template');

    expect(book).toBeTruthy();
  });

  it('rejects a non-moderator with 403', async () => {
    const { club } = await setupClub();

    const { agent, csrf } = await loginAs(app);

    const response = await agent
      .post(`/api/clubs/${club._id}/talking-points`)
      .set('x-csrf-token', csrf)
      .send({});

    expect(response.status).toBe(403);
  });

  it('returns 404 when the meeting belongs to another club', async () => {
    const { club: clubOne } = await setupClub();

    const bookTwo = await Book.create({
      title: 'Another Test Book',
      approvedSource: true,
    });

    const clubTwo = await Club.create({
      name: 'Another Test Club',
      published: true,
      currentBookId: bookTwo._id,
    });

    const { agent, csrf } = await loginAs(app, {
      moderatorOf: [clubOne._id],
    });

    const meeting = await Meeting.create({
      clubId: clubTwo._id,
      date: new Date(),
      createdBy: (await loginAs(app)).user._id,
      chapterRange: { from: 1, to: 3 },
    });

    const response = await agent
      .post(`/api/clubs/${clubOne._id}/talking-points`)
      .set('x-csrf-token', csrf)
      .send({ meetingId: String(meeting._id) });

    expect(response.status).toBe(404);
  });
});
