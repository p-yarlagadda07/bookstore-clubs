import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';

vi.mock('../../modules/progress/service.js', () => ({
  getBoundary: vi.fn(),
}));

vi.mock('../ollama.js', () => ({
  chat: {
    invoke: vi.fn().mockResolvedValue({
      content: 'Here is an answer [1]',
    }),
  },
  isOllamaUp: vi.fn().mockResolvedValue(true),
}));

import { getBoundary } from '../../modules/progress/service.js';
import { chat, isOllamaUp } from '../ollama.js';
import { bookChat } from './bookChat.js';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import StoreDoc from '../ingest/storeDoc.model.js';
import Excerpt from '../ingest/excerpt.model.js';

beforeAll(startTestDB);
afterAll(stopTestDB);

const bookId = new mongoose.Types.ObjectId();

beforeEach(async () => {
  await StoreDoc.deleteMany({});
  await Excerpt.deleteMany({});
  vi.clearAllMocks();

  chat.invoke.mockResolvedValue({
    content: 'Here is an answer [1]',
  });
  isOllamaUp.mockResolvedValue(true);
});

async function addExcerpt({
  text,
  chapter = 1,
  approved = true,
  pageStart = 1,
  pageEnd = 2,
}) {
  return Excerpt.create({
    bookId,
    text,
    chapter,
    approved,
    pageStart,
    pageEnd,
  });
}

describe('bookChat with approved excerpts', () => {
  it('answers with citations when approved material matches', async () => {
    await addExcerpt({
      text: 'The main characters discover an old lighthouse.',
    });
    getBoundary.mockResolvedValue({ declared: true, chapter: 2 });

    const result = await bookChat(
      { _id: new mongoose.Types.ObjectId() },
      {
        message: 'Tell me about the lighthouse characters',
        bookId: bookId.toString(),
      },
    );

    expect(result.status).toBe('answered');
    expect(result.answer).toContain('[1]');
    expect(result.citations[0]).toMatchObject({
      n: 1,
      kind: 'excerpt',
      chapter: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    expect(chat.invoke).toHaveBeenCalledOnce();
  });

  it('does not use unapproved excerpts', async () => {
    await addExcerpt({
      text: 'The lighthouse characters discover a secret.',
      approved: false,
    });
    getBoundary.mockResolvedValue({ declared: true, chapter: 2 });

    const result = await bookChat(
      { _id: new mongoose.Types.ObjectId() },
      {
        message: 'Tell me about the lighthouse characters',
        bookId: bookId.toString(),
      },
    );

    expect(result.status).toBe('not_in_sources');
    expect(result.citations).toEqual([]);
    expect(chat.invoke).not.toHaveBeenCalled();
  });

  it('never sends excerpts beyond the reader boundary to the model', async () => {
    await addExcerpt({
      text: 'The lighthouse appears in the early story.',
      chapter: 1,
    });
    await addExcerpt({
      text: 'The lighthouse reveals the final secret.',
      chapter: 4,
    });
    getBoundary.mockResolvedValue({ declared: true, chapter: 2 });

    const result = await bookChat(
      { _id: new mongoose.Types.ObjectId() },
      {
        message: 'Tell me about the lighthouse secret',
        bookId: bookId.toString(),
      },
    );

    expect(result.status).toBe('answered');

    const messages = chat.invoke.mock.calls[0][0];
    const humanMessage = messages.find(([role]) => role === 'human')[1];

    expect(humanMessage).toContain('early story');
    expect(humanMessage).not.toContain('final secret');
    expect(
      result.citations.every((citation) => citation.chapter <= 2),
    ).toBe(true);
  });

  it('returns not_in_sources when no approved excerpt matches', async () => {
    await addExcerpt({
      text: 'The lighthouse stands near the ocean.',
    });
    getBoundary.mockResolvedValue({ declared: true, chapter: 2 });

    const result = await bookChat(
      { _id: new mongoose.Types.ObjectId() },
      {
        message: 'Explain quantum mechanics',
        bookId: bookId.toString(),
      },
    );

    expect(result.status).toBe('not_in_sources');
    expect(result.citations).toEqual([]);
  });

  it('returns needs_progress when the reader has not declared progress', async () => {
    getBoundary.mockResolvedValue({ declared: false, chapter: 0 });

    const result = await bookChat(
      { _id: new mongoose.Types.ObjectId() },
      {
        message: 'Tell me about the lighthouse',
        bookId: bookId.toString(),
      },
    );

    expect(result.status).toBe('needs_progress');
    expect(result.citations).toEqual([]);
    expect(chat.invoke).not.toHaveBeenCalled();
  });

  it('uses quoted excerpts when Ollama is unavailable', async () => {
    await addExcerpt({
      text: 'The lighthouse guides ships along the coast.',
    });
    getBoundary.mockResolvedValue({ declared: true, chapter: 2 });
    isOllamaUp.mockResolvedValue(false);

    const result = await bookChat(
      { _id: new mongoose.Types.ObjectId() },
      {
        message: 'Tell me about the lighthouse ships',
        bookId: bookId.toString(),
      },
    );

    expect(result.status).toBe('answered');
    expect(result.answer).toContain(
      'The lighthouse guides ships along the coast.',
    );
    expect(result.answer).toContain('[1]');
    expect(chat.invoke).not.toHaveBeenCalled();
  });

  it('falls back to quoted excerpts if the model call fails', async () => {
    await addExcerpt({
      text: 'The lighthouse guides ships along the coast.',
    });
    getBoundary.mockResolvedValue({ declared: true, chapter: 2 });
    chat.invoke.mockRejectedValue(new Error('Ollama unavailable'));

    const result = await bookChat(
      { _id: new mongoose.Types.ObjectId() },
      {
        message: 'Tell me about the lighthouse ships',
        bookId: bookId.toString(),
      },
    );

    expect(result.status).toBe('answered');
    expect(result.answer).toContain('[1]');
    expect(result.answer).toContain(
      'The lighthouse guides ships along the coast.',
    );
  });
});

describe('bookChat store policy questions', () => {
  it('answers store policy questions with document citations', async () => {
    await StoreDoc.create([
      {
        title: 'How long we hold a reserved book',
        type: 'policy',
        text: 'We hold a reserved book for three days. Please collect it within that period.',
      },
      {
        title: 'Store pickup hours',
        type: 'faq',
        text: 'The store is open from nine in the morning until five in the evening.',
      },
    ]);

    const result = await bookChat(
      { _id: new mongoose.Types.ObjectId() },
      { message: 'How long do you hold a reserved book?' },
    );

    expect(result.status).toBe('answered');
    expect(result.answer).toContain('[1]');
    expect(result.citations).toContainEqual({
      n: 1,
      kind: 'policy',
      title: 'How long we hold a reserved book',
    });
  });

  it('returns not_in_sources for an unrelated policy question', async () => {
    await StoreDoc.create({
      title: 'How long we hold a reserved book',
      type: 'policy',
      text: 'We hold a reserved book for three days.',
    });

    const result = await bookChat(
      { _id: new mongoose.Types.ObjectId() },
      { message: 'How do volcanoes erupt?' },
    );

    expect(result.status).toBe('not_in_sources');
    expect(result.citations).toEqual([]);
  });
});

describe('POST /api/book-chat', () => {
  const app = createApp();

  it('needs login', async () => {
    const res = await request(app).get('/api/auth/csrf');
    expect(res.status).toBe(200);

    const result = await request(app)
      .post('/api/book-chat')
      .send({ message: 'hi' });

    expect([401, 403]).toContain(result.status);
  });

  it('returns the response in the standard shape', async () => {
    await StoreDoc.create({
      title: 'Book discussion guide',
      type: 'faq',
      text: 'The central conflict concerns the main characters and their challenges.',
    });

    const { agent, csrf } = await loginAs(app);

    const result = await agent
      .post('/api/book-chat')
      .set('x-csrf-token', csrf)
      .send({ message: 'Tell me about the central conflict' });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.data.status).toBe('answered');
  });

  it('rejects an empty message', async () => {
    const { agent, csrf } = await loginAs(app);

    const result = await agent
      .post('/api/book-chat')
      .set('x-csrf-token', csrf)
      .send({ message: '' });

    expect(result.status).toBe(400);
  });
});
