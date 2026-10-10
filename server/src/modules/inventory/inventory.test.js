import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import Inventory from './model.js';
import Book from '../books/model.js';
import { AuditLog } from '../audit/model.js';

const app = createApp();
let row;

beforeAll(startTestDB);
afterAll(stopTestDB);

beforeEach(async () => {
  await Inventory.deleteMany({});
  await AuditLog.deleteMany({});
  await Book.deleteMany({});
  const book = await Book.create({
    title: 'Murder at Platform Nine',
    authors: ['A. Writer'],
    approvedSource: true,
  });
  row = await Inventory.create({
    bookId: book._id,
    condition: 'new',
    total: 5,
    available: 3,
    held: 2,
  });
});

describe('GET /api/inventory', () => {
  it('bookseller sees stock rows with the book title', async () => {
    const { agent } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent.get('/api/inventory?q=platform');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].title).toBe('Murder at Platform Nine');
    expect(res.body.data.items[0].held).toBe(2);
  });

  it('reader gets 403', async () => {
    const { agent } = await loginAs(app);
    const res = await agent.get('/api/inventory');
    expect(res.status).toBe(403);
  });

  it('not logged in gets 401', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/inventory/:id', () => {
  it('bookseller adds 2 copies', async () => {
    const { agent, csrf } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent
      .patch(`/api/inventory/${row._id}`)
      .set('x-csrf-token', csrf)
      .send({ delta: 2, reason: 'new delivery' });
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(7);
    expect(res.body.data.available).toBe(5);
  });

  it('reader gets 403', async () => {
    const { agent, csrf } = await loginAs(app);
    const res = await agent
      .patch(`/api/inventory/${row._id}`)
      .set('x-csrf-token', csrf)
      .send({ delta: 2, reason: 'new delivery' });
    expect(res.status).toBe(403);
  });

  it("can't go below copies on hold", async () => {
    const { agent, csrf } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent
      .patch(`/api/inventory/${row._id}`)
      .set('x-csrf-token', csrf)
      .send({ delta: -4, reason: 'damaged copies' });
    expect(res.status).toBe(400);
    const saved = await Inventory.findById(row._id).lean();
    expect(saved.total).toBe(5);
  });

  it('marks a row unavailable', async () => {
    const { agent, csrf } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent
      .patch(`/api/inventory/${row._id}`)
      .set('x-csrf-token', csrf)
      .send({ status: 'unavailable', reason: 'out of print' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('unavailable');
  });

  it('saves an audit row', async () => {
    const { agent, csrf } = await loginAs(app, { roles: ['bookseller'] });
    await agent
      .patch(`/api/inventory/${row._id}`)
      .set('x-csrf-token', csrf)
      .send({ delta: 1, reason: 'found a copy' });
    const log = await AuditLog.findOne({ action: 'stock.adjust' }).lean();
    expect(log.details.reason).toBe('found a copy');
    expect(log.details.after.total).toBe(6);
  });

  it('needs a reason', async () => {
    const { agent, csrf } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent
      .patch(`/api/inventory/${row._id}`)
      .set('x-csrf-token', csrf)
      .send({ delta: 1 });
    expect(res.status).toBe(400);
  });
});
