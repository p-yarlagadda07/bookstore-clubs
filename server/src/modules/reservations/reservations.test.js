import { expireHolds } from '../../jobs/expireHolds.js';
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

describe('my reservations and cancel', () => {
  async function holdOne() {
    const { book, windowId } = await bookWithCopies(2);
    const me = await loginAs(app);
    const res = await reserve(me.agent, me.csrf, book._id, {
      condition: 'new',
      pickupWindowId: String(windowId),
    });
    return { book, me, reservationId: res.body.data._id ?? res.body.data.id };
  }

  it('lists only my own reservations with the book title', async () => {
    const { me } = await holdOne();
    await holdOne();

    const res = await me.agent.get('/api/reservations/mine');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toBe('Test Book');
    expect(res.body.data.items[0].pickupWindow.start).toBeTruthy();
  });

  it('cancel puts the copy back', async () => {
    const { book, me, reservationId } = await holdOne();

    const res = await me.agent
      .delete(`/api/reservations/${reservationId}`)
      .set('x-csrf-token', me.csrf);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');

    const inv = await Inventory.findOne({ bookId: book._id }).lean();
    expect(inv.available).toBe(2);
    expect(inv.held).toBe(0);
  });

  it('cancelling twice gives 409', async () => {
    const { me, reservationId } = await holdOne();
    await me.agent.delete(`/api/reservations/${reservationId}`).set('x-csrf-token', me.csrf);

    const res = await me.agent
      .delete(`/api/reservations/${reservationId}`)
      .set('x-csrf-token', me.csrf);
    expect(res.status).toBe(409);
  });

  it("someone else's reservation gives 404", async () => {
    const { reservationId } = await holdOne();
    const other = await loginAs(app);

    const res = await other.agent
      .delete(`/api/reservations/${reservationId}`)
      .set('x-csrf-token', other.csrf);
    expect(res.status).toBe(404);
  });
});

describe('collect reservations', () => {
  async function makeHold() {
    const { book, windowId } = await bookWithCopies(2);
    const reader = await loginAs(app);

    const created = await reserve(reader.agent, reader.csrf, book._id, {
      condition: 'new',
      pickupWindowId: String(windowId),
    });

    expect(created.status).toBe(201);

    return {
      book,
      reservationId: created.body.data._id ?? created.body.data.id,
    };
  }

  it('allows a bookseller to collect a held reservation', async () => {
    const { book, reservationId } = await makeHold();
    const seller = await loginAs(app, { roles: ['bookseller'] });

    const res = await seller.agent
      .patch(`/api/reservations/${reservationId}/collect`)
      .set('x-csrf-token', seller.csrf);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('collected');

    const inv = await Inventory.findOne({ bookId: book._id }).lean();
    expect(inv.total).toBe(1);
    expect(inv.available).toBe(1);
    expect(inv.held).toBe(0);
  });

  it('rejects collection by a reader with 403', async () => {
    const { reservationId } = await makeHold();
    const reader = await loginAs(app);

    const res = await reader.agent
      .patch(`/api/reservations/${reservationId}/collect`)
      .set('x-csrf-token', reader.csrf);

    expect(res.status).toBe(403);
  });

  it('rejects collecting the same reservation twice with 409', async () => {
    const { reservationId } = await makeHold();
    const seller = await loginAs(app, { roles: ['bookseller'] });

    const first = await seller.agent
      .patch(`/api/reservations/${reservationId}/collect`)
      .set('x-csrf-token', seller.csrf);

    expect(first.status).toBe(200);

    const second = await seller.agent
      .patch(`/api/reservations/${reservationId}/collect`)
      .set('x-csrf-token', seller.csrf);

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('NOT_COLLECTABLE');
  });
});

describe('expire reservation holds', () => {
  async function makeHold() {
    const { book, windowId } = await bookWithCopies(2);
    const reader = await loginAs(app);

    const created = await reserve(reader.agent, reader.csrf, book._id, {
      condition: 'new',
      pickupWindowId: String(windowId),
    });

    expect(created.status).toBe(201);

    return {
      book,
      reservationId: created.body.data._id ?? created.body.data.id,
    };
  }

  it('expires an overdue hold and restores inventory', async () => {
    const { book, reservationId } = await makeHold();

    await Reservation.updateOne(
      { _id: reservationId },
      { $set: { expiresAt: new Date(Date.now() - 60_000) } },
    );

    const count = await expireHolds(new Date());

    expect(count).toBe(1);

    const reservation = await Reservation.findById(reservationId).lean();
    expect(reservation.status).toBe('expired');

    const inv = await Inventory.findOne({ bookId: book._id }).lean();
    expect(inv.available).toBe(2);
    expect(inv.held).toBe(0);
  });

  it('keeps a hold that has not expired', async () => {
    const { book, reservationId } = await makeHold();

    const count = await expireHolds(new Date());

    expect(count).toBe(0);

    const reservation = await Reservation.findById(reservationId).lean();
    expect(reservation.status).toBe('held');

    const inv = await Inventory.findOne({ bookId: book._id }).lean();
    expect(inv.available).toBe(1);
    expect(inv.held).toBe(1);
  });
});
