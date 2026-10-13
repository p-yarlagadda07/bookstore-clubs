import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import Book from '../books/model.js';
import Inventory from '../inventory/model.js';
import StockAlert from './model.js';

const app = createApp();

beforeAll(startTestDB);
afterAll(stopTestDB);

async function bookWithStock(available) {
  const book = await Book.create({
    title: 'Stock Alert Test Book',
    approvedSource: true,
  });

  await Inventory.create({
    bookId: book._id,
    condition: 'new',
    total: available,
    available,
    held: 0,
    status: 'active',
  });

  return book;
}

function createAlert(agent, csrf, bookId) {
  return agent.post(`/api/books/${bookId}/alerts`).set('x-csrf-token', csrf).send();
}

describe('Stock alerts', () => {
  it('returns 409 when the book is in stock', async () => {
    const book = await bookWithStock(2);
    const { agent, csrf } = await loginAs(app);

    const response = await createAlert(agent, csrf, book._id);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('IN_STOCK');
  });

  it('creates an alert when the book is out of stock', async () => {
    const book = await bookWithStock(0);
    const { agent, csrf } = await loginAs(app);

    const response = await createAlert(agent, csrf, book._id);

    expect(response.status).toBe(201);
    expect(response.body.bookId).toBe(String(book._id));
    expect(response.body.status).toBe('waiting');
  });

  it('reuses an existing waiting alert', async () => {
    const book = await bookWithStock(0);
    const { agent, csrf } = await loginAs(app);

    const first = await createAlert(agent, csrf, book._id);
    const second = await createAlert(agent, csrf, book._id);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);

    expect(
      await StockAlert.countDocuments({
        bookId: book._id,
        status: 'waiting',
      }),
    ).toBe(1);
  });
  it('marks a waiting alert as sent when stock is added', async () => {
    const book = await bookWithStock(0);
    const { agent, csrf } = await loginAs(app);

    const response = await createAlert(agent, csrf, book._id);
    expect(response.status).toBe(201);

    const inventory = await Inventory.findOne({ bookId: book._id });
    const { adjustStock } = await import('../inventory/service.js');

    await adjustStock({ _id: inventory._id, roles: ['bookseller'] }, String(inventory._id), {
      delta: 1,
    });

    const alert = await StockAlert.findById(response.body.id).lean();

    expect(alert.status).toBe('sent');
    expect(alert.sentAt).toBeTruthy();
  });

  it('does not allow one user to delete another user’s alert', async () => {
    const book = await bookWithStock(0);
    const owner = await loginAs(app);
    const otherUser = await loginAs(app);

    const created = await createAlert(owner.agent, owner.csrf, book._id);
    expect(created.status).toBe(201);

    const response = await otherUser.agent
      .delete(`/api/alerts/${created.body.id}`)
      .set('x-csrf-token', otherUser.csrf);

    expect(response.status).toBe(404);
  });
});
