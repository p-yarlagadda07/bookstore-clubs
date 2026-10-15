import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';

import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import { ReadingList } from './model.js';
import Book from '../books/model.js';

const app = createApp();

beforeAll(startTestDB);
afterAll(stopTestDB);

async function makeShelf(visibility) {
  const { user } = await loginAs(app);
  const book = await Book.create({
    title: 'Shelf Test Book',
    authors: ['Test Author'],
    synopsis: 'A short test book.',
    pageCount: 120,
    approvedSource: true,
  });

  return ReadingList.create({
    ownerId: user._id,
    name: 'Rainy day reads',
    visibility,
    items: [{ bookId: book._id }],
  });
}

describe('Public shelves', () => {
  it('opens a public shelf without logging in', async () => {
    const shelf = await makeShelf('public');
    const response = await request(app).get(`/api/reading-lists/${shelf._id}/public`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      name: 'Rainy day reads',
      owner: 'Test',
      items: [{ title: 'Shelf Test Book', authors: ['Test Author'] }],
    });
  });

  it('gives 404 for a private shelf', async () => {
    const shelf = await makeShelf('private');
    const response = await request(app).get(`/api/reading-lists/${shelf._id}/public`);

    expect(response.status).toBe(404);
  });

  it('does not send the email or owner id', async () => {
    const shelf = await makeShelf('public');
    const response = await request(app).get(`/api/reading-lists/${shelf._id}/public`);
    const text = JSON.stringify(response.body);

    expect(text).not.toContain('@test.local');
    expect(response.body.data.ownerId).toBeUndefined();
  });
});
