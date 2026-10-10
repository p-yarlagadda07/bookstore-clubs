import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { createApp } from '../../app.js';
import { AppError } from '../../lib/AppError.js';
import { vectorSearchBooks } from './service.js';
const app = createApp();
vi.mock('./service.js', () => ({ vectorSearchBooks: vi.fn() }));

beforeAll(startTestDB);
afterAll(stopTestDB);

describe('GET /api/books/discover', () => {
  it('returns matching books', async () => {
    vectorSearchBooks.mockResolvedValue([
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Book One',
        authors: ['A'],
        themes: ['mystery'],
        moods: ['tense'],
        pageCount: 200,
        synopsis: 'Short text',
        score: 0.9,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Book Two',
        authors: ['B'],
        themes: ['sea'],
        moods: ['calm'],
        pageCount: 300,
        synopsis: 'More text',
        score: 0.8,
      },
    ]);

    const res = await request(app).get('/api/books/discover?q=lighthouse keeper');

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items[0].title).toBe('Book One');
    expect(res.body.data.items[0].score).toBe(0.9);
  });

  it('rejects a query that is too short', async () => {
    const res = await request(app).get('/api/books/discover?q=ab');
    expect(res.status).toBe(400);
  });

  it('returns 503 when Ollama is off', async () => {
    vectorSearchBooks.mockRejectedValue(new AppError('AI_UNAVAILABLE', 503, 'Ollama is off'));

    const res = await request(app).get('/api/books/discover?q=lighthouse keeper');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_UNAVAILABLE');
  });
});
