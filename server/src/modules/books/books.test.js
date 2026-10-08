import request from 'supertest';
import mongoose from 'mongoose';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';

import { createApp } from '../../app.js';
import Inventory from '../inventory/model.js';
import Book from './model.js';
import CatalogSource from '../catalogSources/model.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';

const app = createApp();

beforeAll(startTestDB);
afterAll(stopTestDB);

describe('Books API', () => {
  it('lists approved books', async () => {
    const source = await CatalogSource.create({
      name: 'Test Source',
      type: 'store',
      permission: 'approved',
    });

    await Book.create({
      title: 'Test Book',
      authors: ['Test Author'],
      approvedSource: true,
      sourceId: source._id,
    });

    const response = await request(app).get('/api/books');

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBeGreaterThan(0);
    expect(response.body.data.items[0].embedding).toBeUndefined();
  });

  it('returns 404 for an unknown book', async () => {
    const id = new mongoose.Types.ObjectId();

    const response = await request(app).get(`/api/books/${id}`);

    expect(response.status).toBe(404);
  });

  it('returns 400 for a bad book id', async () => {
    const response = await request(app).get('/api/books/not-a-valid-id');

    expect(response.status).toBe(400);
  });

  it("hides books from sources that aren't approved", async () => {
    const book = await Book.create({ title: 'Hidden Book', approvedSource: false });

    const list = await request(app).get('/api/books');
    expect(list.body.data.items.map((b) => b.title)).not.toContain('Hidden Book');

    const detail = await request(app).get(`/api/books/${book._id}`);
    expect(detail.status).toBe(404);
  });

  it('returns a book with its inventory', async () => {
    const book = await Book.create({ title: 'Stocked Book', approvedSource: true });
    await Inventory.create({ bookId: book._id, condition: 'new', total: 3, available: 2, held: 1 });

    const res = await request(app).get(`/api/books/${book._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.inventory).toHaveLength(1);
    expect(res.body.data.embedding).toBeUndefined();
  });

  it('available=true only returns books with copies, available=false returns all', async () => {
    const out = await Book.create({ title: 'Sold Out Book', approvedSource: true });
    await Inventory.create({ bookId: out._id, condition: 'new', total: 1, available: 0 });

    const onlyAvailable = await request(app).get('/api/books?available=true');
    expect(onlyAvailable.body.data.items.map((b) => b.title)).not.toContain('Sold Out Book');

    const all = await request(app).get('/api/books?available=false');
    expect(all.body.data.items.map((b) => b.title)).toContain('Sold Out Book');
  });

  it('adds an availability label to each book', async () => {
    const plenty = await Book.create({ title: 'Plenty Copies', approvedSource: true });
    const few = await Book.create({ title: 'Two Copies', approvedSource: true });
    const off = await Book.create({ title: 'Marked Off', approvedSource: true });

    await Inventory.create([
      { bookId: plenty._id, condition: 'new', total: 5, available: 5 },
      { bookId: few._id, condition: 'used', total: 2, available: 2 },
      { bookId: off._id, condition: 'new', total: 4, available: 4, status: 'unavailable' },
    ]);

    const res = await request(app).get('/api/books?limit=50');
    const byTitle = Object.fromEntries(res.body.data.items.map((b) => [b.title, b.availability]));

    expect(byTitle['Plenty Copies']).toMatchObject({
      new: 5,
      used: 0,
      label: 'Available',
      reservable: true,
    });
    expect(byTitle['Two Copies']).toMatchObject({ used: 2, label: 'Few left' });
    expect(byTitle['Marked Off']).toMatchObject({ label: 'Unavailable', reservable: false });

    const detail = await request(app).get(`/api/books/${few._id}`);
    expect(detail.body.data.availability.label).toBe('Few left');
  });
});
