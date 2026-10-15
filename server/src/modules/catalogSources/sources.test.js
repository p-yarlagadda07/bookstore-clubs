import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';

import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import CatalogSource from './model.js';
import Book from '../books/model.js';
import { AuditLog } from '../audit/model.js';

const app = createApp();

beforeAll(startTestDB);
afterAll(stopTestDB);

async function makeSource() {
  const source = await CatalogSource.create({
    name: 'Test Press',
    type: 'publisher',
    license: 'Test license',
    permission: 'approved',
  });
  await Book.create({
    title: 'Test Press Book',
    authors: ['Test Author'],
    themes: ['test'],
    moods: ['calm'],
    synopsis: 'A short test book.',
    pageCount: 100,
    chapterCount: 10,
    readingHours: 3,
    contentLevel: 'synopsis',
    sourceId: source._id,
    approvedSource: true,
  });
  return source;
}

describe('Catalog sources API', () => {
  it('lists sources with book counts', async () => {
    const source = await makeSource();
    const { agent } = await loginAs(app, { roles: ['admin'] });
    const response = await agent.get('/api/admin/sources');

    expect(response.status).toBe(200);
    const item = response.body.data.items.find((i) => i.id === String(source._id));
    expect(item.bookCount).toBe(1);
    expect(item.permission).toBe('approved');
  });

  it('revoke hides the books and approve brings them back', async () => {
    const source = await makeSource();
    const { agent, csrf } = await loginAs(app, { roles: ['admin'] });

    const revoke = await agent
      .patch(`/api/admin/sources/${source._id}`)
      .set('x-csrf-token', csrf)
      .send({ permission: 'revoked' });
    expect(revoke.status).toBe(200);
    expect(revoke.body.data.permission).toBe('revoked');

    const hidden = await request(app).get('/api/books?limit=100');
    const hiddenIds = hidden.body.data.items.map((b) => b.sourceId);
    expect(hiddenIds).not.toContain(String(source._id));

    const approve = await agent
      .patch(`/api/admin/sources/${source._id}`)
      .set('x-csrf-token', csrf)
      .send({ permission: 'approved' });
    expect(approve.status).toBe(200);

    const back = await request(app).get('/api/books?limit=100');
    const backIds = back.body.data.items.map((b) => b.sourceId);
    expect(backIds).toContain(String(source._id));
  });

  it('saves a source.permission audit row', async () => {
    const source = await makeSource();
    const { agent, csrf } = await loginAs(app, { roles: ['admin'] });

    await agent
      .patch(`/api/admin/sources/${source._id}`)
      .set('x-csrf-token', csrf)
      .send({ permission: 'revoked' });

    const row = await AuditLog.findOne({
      action: 'source.permission',
      targetId: String(source._id),
    });
    expect(row).toBeTruthy();
    expect(row.details).toMatchObject({ before: 'approved', after: 'revoked' });
  });

  it('rejects a bad permission value', async () => {
    const source = await makeSource();
    const { agent, csrf } = await loginAs(app, { roles: ['admin'] });
    const response = await agent
      .patch(`/api/admin/sources/${source._id}`)
      .set('x-csrf-token', csrf)
      .send({ permission: 'banana' });

    expect(response.status).toBe(400);
  });

  it('gives a reader 403', async () => {
    const { agent, csrf } = await loginAs(app);

    const list = await agent.get('/api/admin/sources');
    expect(list.status).toBe(403);

    const patch = await agent
      .patch('/api/admin/sources/6ad104e1908054f4cc7d9e64')
      .set('x-csrf-token', csrf)
      .send({ permission: 'revoked' });
    expect(patch.status).toBe(403);
  });
});
