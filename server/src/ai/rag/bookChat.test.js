import { describe, expect, it } from 'vitest';
import { bookChat } from './bookChat.js';

describe('bookChat', () => {
  it('returns an answered response with citations', async () => {
    const result = await bookChat(
      { _id: 'user-1' },
      {
        message: 'What is the book about?',
      },
    );

    expect(result.answer).toContain('[1]');
    expect(result.status).toBe('answered');

    expect(Array.isArray(result.citations)).toBe(true);
    expect(result.citations[0]).toMatchObject({
      n: 1,
      kind: 'excerpt',
      title: expect.any(String),
      chapter: expect.any(Number),
      pageStart: expect.any(Number),
      pageEnd: expect.any(Number),
    });
  });
});