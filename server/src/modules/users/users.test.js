import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import { Club } from '../clubs/model.js';
import { AuditLog } from '../audit/model.js';
import { User } from './model.js';

const app = createApp();
let admin, club;

beforeAll(async () => {
  await startTestDB();
  admin = await loginAs(app, { roles: ['admin'] });
  club = await Club.create({ name: 'Tuesday Mystery Circle', published: true });
});
afterAll(stopTestDB);

const patch = (who, id, body) =>
  who.agent.patch(`/api/users/${id}/staff-role`).set('x-csrf-token', who.csrf).send(body);

const newReader = async () => (await loginAs(app)).user;

describe('GET /api/admin/users', () => {
  it('lists users and filters by name or email', async () => {
    await User.create({ name: 'Zara Unique', email: 'zara@test.local', passwordHash: 'x' });
    const all = await admin.agent.get('/api/admin/users');
    expect(all.status).toBe(200);
    expect(all.body.data.items.length).toBeGreaterThan(1);

    const res = await admin.agent.get('/api/admin/users?q=zara');
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe('Zara Unique');
  });

  it('a reader gets 403', async () => {
    const reader = await loginAs(app);
    expect((await reader.agent.get('/api/admin/users')).status).toBe(403);
  });

  it('not logged in gets 401', async () => {
    expect((await request(app).get('/api/admin/users')).status).toBe(401);
  });
});

describe('PATCH /api/users/:id/staff-role', () => {
  it('grants and revokes bookseller and saves an audit row', async () => {
    const target = await newReader();

    const grant = await patch(admin, target._id, { action: 'grant', role: 'bookseller' });
    expect(grant.status).toBe(200);
    expect(grant.body.data.roles).toContain('bookseller');

    const revoke = await patch(admin, target._id, { action: 'revoke', role: 'bookseller' });
    expect(revoke.body.data.roles).not.toContain('bookseller');

    const rows = await AuditLog.find({ action: 'role.change', targetId: target._id }).lean();
    expect(rows).toHaveLength(2);
    expect(rows[0].details.after.roles).toContain('bookseller');
    expect(rows[0].details.before.roles).not.toContain('bookseller');
  });

  it('adds and removes a club moderator', async () => {
    const target = await newReader();

    const add = await patch(admin, target._id, {
      action: 'grant',
      role: 'moderator',
      clubId: String(club._id),
    });
    expect(add.status).toBe(200);
    expect(add.body.data.moderatorOf[0].name).toBe('Tuesday Mystery Circle');

    const remove = await patch(admin, target._id, {
      action: 'revoke',
      role: 'moderator',
      clubId: String(club._id),
    });
    expect(remove.body.data.moderatorOf).toHaveLength(0);
  });

  it('moderator needs a clubId and the club must exist', async () => {
    const target = await newReader();
    expect((await patch(admin, target._id, { action: 'grant', role: 'moderator' })).status).toBe(
      400,
    );

    const unknownClub = String(new mongoose.Types.ObjectId());
    const res = await patch(admin, target._id, {
      action: 'grant',
      role: 'moderator',
      clubId: unknownClub,
    });
    expect(res.status).toBe(404);
  });

  it('admin role cannot be given here', async () => {
    const target = await newReader();
    expect((await patch(admin, target._id, { action: 'grant', role: 'admin' })).status).toBe(400);
  });

  it('nobody can change their own roles', async () => {
    const res = await patch(admin, admin.user._id, { action: 'grant', role: 'bookseller' });
    expect(res.status).toBe(403);
  });

  it('a reader gets 403', async () => {
    const reader = await loginAs(app);
    const target = await newReader();
    expect((await patch(reader, target._id, { action: 'grant', role: 'bookseller' })).status).toBe(
      403,
    );
  });

  it('an unknown user gets 404', async () => {
    const res = await patch(admin, new mongoose.Types.ObjectId(), {
      action: 'grant',
      role: 'bookseller',
    });
    expect(res.status).toBe(404);
  });
});
