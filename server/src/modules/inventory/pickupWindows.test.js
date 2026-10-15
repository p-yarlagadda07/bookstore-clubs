import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import Inventory from './model.js';
import Book from '../books/model.js';
import Reservation from '../reservations/model.js';
import { AuditLog } from '../audit/model.js';

const app = createApp();
let row;

beforeAll(startTestDB);
afterAll(stopTestDB);

beforeEach(async () => {
  await Reservation.deleteMany({});
  await Inventory.deleteMany({});
  await AuditLog.deleteMany({});
  await Book.deleteMany({});

  const book = await Book.create({
    title: 'Pickup Window Test Book',
    authors: ['A. Writer'],
    approvedSource: true,
  });

  row = await Inventory.create({
    bookId: book._id,
    condition: 'new',
    total: 5,
    available: 5,
    held: 0,
    pickupWindows: [],
  });
});

describe('Pickup windows API', () => {
  it('bookseller adds a pickup window', async () => {
    const { agent, csrf } = await loginAs(app, {
      roles: ['bookseller'],
    });

    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const res = await agent
      .post(`/api/inventory/${row._id}/pickup-windows`)
      .set('x-csrf-token', csrf)
      .send({ start: start.toISOString(), end: end.toISOString() });

    expect(res.status).toBe(201);
    expect(res.body.data.pickupWindows).toHaveLength(1);

    const log = await AuditLog.findOne({ action: 'pickup.add' }).lean();
    expect(log).toBeTruthy();
  });

  it('rejects an end time before the start time', async () => {
    const { agent, csrf } = await loginAs(app, {
      roles: ['bookseller'],
    });

    const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() - 60 * 60 * 1000);

    const res = await agent
      .post(`/api/inventory/${row._id}/pickup-windows`)
      .set('x-csrf-token', csrf)
      .send({ start: start.toISOString(), end: end.toISOString() });

    expect(res.status).toBe(400);
  });

  it('bookseller removes an unused pickup window', async () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    row.pickupWindows.push({ start, end });
    await row.save();

    const pickupWindowId = String(row.pickupWindows[0]._id);
    const { agent, csrf } = await loginAs(app, {
      roles: ['bookseller'],
    });

    const res = await agent
      .delete(`/api/inventory/${row._id}/pickup-windows/${pickupWindowId}`)
      .set('x-csrf-token', csrf);

    expect(res.status).toBe(200);
    expect(res.body.data.pickupWindows).toHaveLength(0);

    const log = await AuditLog.findOne({ action: 'pickup.remove' }).lean();
    expect(log).toBeTruthy();
  });

  it('does not remove a pickup window with a held reservation', async () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    row.pickupWindows.push({ start, end });
    await row.save();

    const pickupWindowId = row.pickupWindows[0]._id;
    const { agent, csrf } = await loginAs(app, {
      roles: ['bookseller'],
    });
    const { user: reader } = await loginAs(app);

    await Reservation.create({
      inventoryId: row._id,
      pickupWindowId,
      bookId: row.bookId,
      userId: reader._id,
      condition: row.condition,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      status: 'held',
    });

    const res = await agent
      .delete(`/api/inventory/${row._id}/pickup-windows/${pickupWindowId}`)
      .set('x-csrf-token', csrf);

    expect(res.status).toBe(409);
    expect(JSON.stringify(res.body)).toContain('Someone has a hold for this time');

    const saved = await Inventory.findById(row._id).lean();
    expect(saved.pickupWindows).toHaveLength(1);
  });

  it('reader cannot add a pickup window', async () => {
    const { agent, csrf } = await loginAs(app);

    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const res = await agent
      .post(`/api/inventory/${row._id}/pickup-windows`)
      .set('x-csrf-token', csrf)
      .send({ start: start.toISOString(), end: end.toISOString() });

    expect(res.status).toBe(403);
  });
});
