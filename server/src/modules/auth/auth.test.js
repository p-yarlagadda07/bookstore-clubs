import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import {
  requireAuth,
  requireRole,
  requireClubModerator,
  assertCan,
} from '../../middleware/auth.js';
import { Membership } from '../clubs/model.js';

const app = createApp();

beforeAll(startTestDB);
afterAll(stopTestDB);

// runs a middleware and returns whatever it passed to next()
function run(mw, req) {
  return new Promise((resolve) => mw(req, {}, resolve));
}

const newId = () => new mongoose.Types.ObjectId();

describe('csrf', () => {
  it('GET /api/auth/csrf returns a token', async () => {
    const res = await request(app).get('/api/auth/csrf');
    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe('string');
  });

  it('POST without x-csrf-token is rejected', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_INVALID');
  });

  it('POST with a valid token gets past the csrf check', async () => {
    const agent = request.agent(app);
    const { body } = await agent.get('/api/auth/csrf');
    const res = await agent.post('/api/auth/login').set('x-csrf-token', body.data.token).send({});
    expect(res.status).not.toBe(403);
  });
});

describe('auth middleware', () => {
  it('requireAuth rejects when not logged in', async () => {
    const err = await run(requireAuth, { session: {} });
    expect(err.status).toBe(401);
  });

  it('requireRole blocks a reader', async () => {
    const err = await run(requireRole('bookseller'), { user: { roles: ['reader'] } });
    expect(err.code).toBe('FORBIDDEN');
  });

  it('requireRole lets an admin through', async () => {
    const err = await run(requireRole('bookseller'), { user: { roles: ['admin'] } });
    expect(err).toBeUndefined();
  });

  it('requireClubModerator only allows moderators of that club', async () => {
    const clubId = newId();
    const user = { roles: ['reader'], moderatorOf: [clubId] };
    expect(await run(requireClubModerator(), { user, params: { id: String(clubId) } })).toBeUndefined();
    const err = await run(requireClubModerator(), { user, params: { id: String(newId()) } });
    expect(err.status).toBe(403);
  });
});

describe('assertCan', () => {
  const reader = { _id: newId(), roles: ['reader'], moderatorOf: [] };

  it('stock.update is only for booksellers', async () => {
    await expect(assertCan(reader, 'stock.update')).rejects.toMatchObject({ status: 403 });
    await expect(assertCan({ ...reader, roles: ['bookseller'] }, 'stock.update')).resolves.toBe(true);
  });

  it('club.member checks memberships', async () => {
    const clubId = newId();
    await expect(assertCan(reader, 'club.member', { clubId })).rejects.toMatchObject({ status: 403 });
    await Membership.create({ clubId, userId: reader._id });
    await expect(assertCan(reader, 'club.member', { clubId })).resolves.toBe(true);
  });

  it('admin cannot change their own role', async () => {
    const admin = { _id: newId(), roles: ['admin'] };
    await expect(assertCan(admin, 'role.change', { targetUserId: admin._id })).rejects.toMatchObject({ status: 403 });
    await expect(assertCan(admin, 'role.change', { targetUserId: newId() })).resolves.toBe(true);
  });
});