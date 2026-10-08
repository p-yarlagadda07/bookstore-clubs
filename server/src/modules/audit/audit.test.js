import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import { logAudit, listAudit } from './service.js';
import { AuditLog } from './model.js';

const app = createApp();
const actor = { _id: new mongoose.Types.ObjectId() };

beforeAll(startTestDB);
afterAll(stopTestDB);

describe('logAudit', () => {
  it('saves a row', async () => {
    const targetId = new mongoose.Types.ObjectId();
    await logAudit(actor, 'stock.adjust', { type: 'inventory', id: targetId }, { before: 3, after: 5 });
    const row = await AuditLog.findOne({ action: 'stock.adjust' }).lean();
    expect(String(row.actorId)).toBe(String(actor._id));
    expect(row.targetType).toBe('inventory');
    expect(row.details.after).toBe(5);
  });

  it('never throws, even with bad input', async () => {
    await expect(logAudit(null, 'role.change')).resolves.toBeNull();
  });

  it('lists newest first with paging', async () => {
    await logAudit(actor, 'first.action');
    await logAudit(actor, 'second.action');
    const res = await listAudit({ page: 1, limit: 1 });
    expect(res.items).toHaveLength(1);
    expect(res.items[0].action).toBe('second.action');
    expect(res.total).toBeGreaterThanOrEqual(2);
  });
});

describe('GET /api/admin/audit', () => {
  it('admin sees the list', async () => {
    const { agent } = await loginAs(app, { roles: ['admin'] });
    const res = await agent.get('/api/admin/audit');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty('total');
  });

  it('reader gets 403', async () => {
    const { agent } = await loginAs(app);
    const res = await agent.get('/api/admin/audit');
    expect(res.status).toBe(403);
  });

  it('not logged in gets 401', async () => {
    const res = await request(app).get('/api/admin/audit');
    expect(res.status).toBe(401);
  });

  it('bad page gives 400', async () => {
    const { agent } = await loginAs(app, { roles: ['admin'] });
    const res = await agent.get('/api/admin/audit?page=abc');
    expect(res.status).toBe(400);
  });
});