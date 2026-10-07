import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bookChat } from './bookChat.js';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';

describe('bookChat (mock)', () => {
  it('answers with citations when the material matches', async () => {
    const result = await bookChat({ _id: 'u1' }, { message: 'Who are the main characters?' });

    expect(result.status).toBe('answered');
    expect(result.answer).toContain('[1]');
    expect(result.citations[0]).toMatchObject({
      n: 1,
      kind: 'excerpt',
      title: expect.any(String),
      chapter: expect.any(Number),
      pageStart: expect.any(Number),
      pageEnd: expect.any(Number),
    });
  });

  it('says not_in_sources when nothing matches', async () => {
    const result = await bookChat({ _id: 'u1' }, { message: 'Recipe for biryani?' });

    expect(result.status).toBe('not_in_sources');
    expect(result.citations).toEqual([]);
  });
});

describe('POST /api/book-chat', () => {
  const app = createApp();
  beforeAll(startTestDB);
  afterAll(stopTestDB);

  it('needs login', async () => {
    const res = await request(app).get('/api/auth/csrf');
    expect(res.status).toBe(200);
    const chat = await request(app).post('/api/book-chat').send({ message: 'hi' });
    expect([401, 403]).toContain(chat.status);
  });

  it('returns the response in the standard shape', async () => {
    const { agent, csrf } = await loginAs(app);
    const res = await agent
      .post('/api/book-chat')
      .set('x-csrf-token', csrf)
      .send({ message: 'Tell me about the central conflict' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.status).toBe('answered');
  });

  it('rejects an empty message', async () => {
    const { agent, csrf } = await loginAs(app);
    const res = await agent.post('/api/book-chat').set('x-csrf-token', csrf).send({ message: '' });
    expect(res.status).toBe(400);
  });
});
