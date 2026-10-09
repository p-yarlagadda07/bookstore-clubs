import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import Reservation from './model.js';
import Inventory from '../inventory/model.js';
import Book from '../books/model.js';

const app = createApp();

beforeAll(startTestDB);
afterAll(stopTestDB);

async function bookWithCopies(available) {
  const book = await Book.create({ title: 'Test Book', approvedSource: true });
  const windowId = new mongoose.Types.ObjectId();
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 9 * 60 * 60 * 1000);

  await Inventory.create({
    bookId: book._id,
    condition: 'new',
    total: available,
    available,
    held: 0,
    pickupWindows: [{ _id: windowId, start, end }],
  });

  return { book, windowId, end };
}

function reserve(agent, csrf, bookId, body) {
  return agent.post(`/api/books/${bookId}/reservations`).set('x-csrf-token', csrf).send(body);
}

describe('POST /api/books/:id/reservations', () => {
  it('reserves a copy and moves it from available to held', async () => {
    const { book, windowId, end } = await bookWithCopies(2);
    const { agent, csrf } = await loginAs(app);

    const res = await reserve(agent, csrf, book._id, {
      condition: 'new',
      pickupWindowId: String(windowId),
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('held');
    expect(new Date(res.body.data.expiresAt).getTime()).toBe(end.getTime());

    const inv = await Inventory.findOne({ bookId: book._id }).lean();
    expect(inv.available).toBe(1);
    expect(inv.held).toBe(1);
  });

  it('only one of two people gets the last copy', async () => {
    const { book, windowId } = await bookWithCopies(1);
    const a = await loginAs(app);
    const b = await loginAs(app);
    const body = { condition: 'new', pickupWindowId: String(windowId) };

    const results = await Promise.all([
      reserve(a.agent, a.csrf, book._id, body),
      reserve(b.agent, b.csrf, book._id, body),
    ]);

    const codes = results.map((r) => r.status).sort();
    expect(codes).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409).body.error.code).toBe('OUT_OF_STOCK');

    const inv = await Inventory.findOne({ bookId: book._id }).lean();
    expect(inv.available).toBe(0);
    expect(await Reservation.countDocuments({ bookId: book._id })).toBe(1);
  });

  it('a pickup window that does not exist gives 409 and changes nothing', async () => {
    const { book } = await bookWithCopies(3);
    const { agent, csrf } = await loginAs(app);

    const res = await reserve(agent, csrf, book._id, {
      condition: 'new',
      pickupWindowId: String(new mongoose.Types.ObjectId()),
    });

    expect(res.status).toBe(409);
    const inv = await Inventory.findOne({ bookId: book._id }).lean();
    expect(inv.available).toBe(3);
  });

  it('stops at 5 active reservations', async () => {
    const { book, windowId } = await bookWithCopies(10);
    const { agent, csrf } = await loginAs(app);
    const body = { condition: 'new', pickupWindowId: String(windowId) };

    for (let i = 0; i < 5; i++) {
      expect((await reserve(agent, csrf, book._id, body)).status).toBe(201);
    }

    const sixth = await reserve(agent, csrf, book._id, body);
    expect(sixth.status).toBe(409);
    expect(sixth.body.error.code).toBe('LIMIT_REACHED');
  });

  it('needs a verified email', async () => {
    const { book, windowId } = await bookWithCopies(2);
    const { agent, csrf } = await loginAs(app, { verified: false });

    const res = await reserve(agent, csrf, book._id, {
      condition: 'new',
      pickupWindowId: String(windowId),
    });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('bad body gives 400', async () => {
    const { book } = await bookWithCopies(2);
    const { agent, csrf } = await loginAs(app);

    const res = await reserve(agent, csrf, book._id, { condition: 'mint', pickupWindowId: 'x' });
    expect(res.status).toBe(400);
  });
});
