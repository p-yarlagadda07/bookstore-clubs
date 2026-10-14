
import { beforeAll, afterAll, describe, it, expect } from 'vitest';

import { createApp } from '../../app.js';
import Reservation from '../reservations/model.js';
import Inventory from '../inventory/model.js';
import Book from '../books/model.js';
import StockAlert from '../alerts/model.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';

const app = createApp();

beforeAll(startTestDB);
afterAll(stopTestDB);

describe('GET /api/staff/shop-floor', () => {
  it('returns 403 for a reader', async () => {
    const { agent } = await loginAs(app, { roles: ['reader'] });
    const res = await agent.get('/api/staff/shop-floor');

    expect(res.status).toBe(403);
  });

  it('returns dashboard numbers for a bookseller', async () => {
    const { agent } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent.get('/api/staff/shop-floor');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      activeHolds: expect.any(Number),
      pickupsToday: expect.any(Number),
      alertsWaiting: expect.any(Number),
      soldOut: expect.any(Number),
      lowStock: expect.any(Array),
      mostHeld: expect.any(Array),
    });
  });

  it('includes low stock rows and excludes rows with more than one available', async () => {
    const lowBook = await Book.create({ title: 'Low Stock Test' });
    const plentyBook = await Book.create({ title: 'Plenty Stock Test' });

    await Inventory.create([
      {
        bookId: lowBook._id,
        condition: 'new',
        total: 3,
        available: 1,
        status: 'active',
      },
      {
        bookId: plentyBook._id,
        condition: 'new',
        total: 6,
        available: 5,
        status: 'active',
      },
    ]);

    const { agent } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent.get('/api/staff/shop-floor');

    expect(res.status).toBe(200);
    expect(res.body.data.lowStock.map((row) => row.title)).toContain(
      'Low Stock Test',
    );
    expect(res.body.data.lowStock.map((row) => row.title)).not.toContain(
      'Plenty Stock Test',
    );
  });

  it('ranks books by holds created in the last 30 days', async () => {
    const book = await Book.create({ title: 'Most Held Test' });
    const { user } = await loginAs(app, { roles: ['reader'] });

    const inventory = await Inventory.create({
      bookId: book._id,
      condition: 'new',
      total: 3,
      available: 1,
      held: 2,
      pickupWindows: [
        {
          start: new Date(),
          end: new Date(Date.now() + 86400000),
        },
      ],
    });

    const windowId = inventory.pickupWindows[0]._id;

    await Reservation.create([
      {
        userId: user._id,
        bookId: book._id,
        inventoryId: inventory._id,
        condition: 'new',
        pickupWindowId: windowId,
        status: 'held',
        expiresAt: new Date(Date.now() + 86400000),
      },
      {
        userId: user._id,
        bookId: book._id,
        inventoryId: inventory._id,
        condition: 'new',
        pickupWindowId: windowId,
        status: 'collected',
        expiresAt: new Date(Date.now() + 86400000),
      },
    ]);

    const { agent } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent.get('/api/staff/shop-floor');

    expect(res.status).toBe(200);
    expect(res.body.data.mostHeld[0]).toMatchObject({
      title: 'Most Held Test',
      holds: 2,
    });
  });

  it('counts a held reservation expiring today as a pickup today', async () => {
    const book = await Book.create({ title: 'Pickup Today Test' });
    const { user } = await loginAs(app, { roles: ['reader'] });

    const inventory = await Inventory.create({
      bookId: book._id,
      condition: 'used',
      total: 1,
      available: 0,
      held: 1,
      pickupWindows: [
        {
          start: new Date(),
          end: new Date(Date.now() + 86400000),
        },
      ],
    });

    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    await Reservation.create({
      userId: user._id,
      bookId: book._id,
      inventoryId: inventory._id,
      condition: 'used',
      pickupWindowId: inventory.pickupWindows[0]._id,
      status: 'held',
      expiresAt: endOfToday,
    });

    const { agent } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent.get('/api/staff/shop-floor');

    expect(res.status).toBe(200);
    expect(res.body.data.pickupsToday).toBeGreaterThan(0);
  });

  it('counts only waiting stock alerts', async () => {
    const book = await Book.create({ title: 'Alert Count Test' });
    const { user } = await loginAs(app, { roles: ['reader'] });

    await StockAlert.create([
      {
        userId: user._id,
        bookId: book._id,
        status: 'waiting',
      },
      {
        userId: user._id,
        bookId: book._id,
        status: 'sent',
      },
    ]);

    const { agent } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent.get('/api/staff/shop-floor');

    expect(res.status).toBe(200);
    expect(res.body.data.alertsWaiting).toBe(1);
  });
});
