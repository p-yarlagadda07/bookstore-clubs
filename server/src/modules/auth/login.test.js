import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';
import { User } from '../users/model.js';

const app = createApp();
const PASSWORD = 'Password@123';

beforeAll(async () => {
  await startTestDB();
  const passwordHash = await argon2.hash(PASSWORD);
  await User.create([
    { name: 'Riya', email: 'riya@test.local', passwordHash, emailVerifiedAt: new Date() },
    { name: 'Locked', email: 'locked@test.local', passwordHash, emailVerifiedAt: new Date() },
  ]);
});
afterAll(stopTestDB);

async function csrfAgent() {
  const agent = request.agent(app);
  const { body } = await agent.get('/api/auth/csrf');
  return { agent, csrf: body.data.token };
}

describe('login, me, logout', () => {
  it('logs in with the right password and hides passwordHash', async () => {
    const { agent, csrf } = await csrfAgent();
    const res = await agent
      .post('/api/auth/login')
      .set('x-csrf-token', csrf)
      .send({ email: 'riya@test.local', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('riya@test.local');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('gives the same 401 for wrong password and unknown email', async () => {
    const { agent, csrf } = await csrfAgent();
    const wrongPass = await agent
      .post('/api/auth/login')
      .set('x-csrf-token', csrf)
      .send({ email: 'riya@test.local', password: 'nope-nope' });
    const noUser = await agent
      .post('/api/auth/login')
      .set('x-csrf-token', csrf)
      .send({ email: 'ghost@test.local', password: 'nope-nope' });
    expect(wrongPass.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPass.body.error.message).toBe(noUser.body.error.message);
    expect(wrongPass.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects a bad body with 400', async () => {
    const { agent, csrf } = await csrfAgent();
    const res = await agent
      .post('/api/auth/login')
      .set('x-csrf-token', csrf)
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('me works after login and gives 401 after logout', async () => {
    const { agent, csrf } = await loginAs(app);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    expect((await agent.post('/api/auth/logout').set('x-csrf-token', csrf)).status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('blocks the 6th wrong login with 429', async () => {
    const { agent, csrf } = await csrfAgent();
    const tryLogin = () =>
      agent
        .post('/api/auth/login')
        .set('x-csrf-token', csrf)
        .send({ email: 'locked@test.local', password: 'wrong-pass' });
    for (let i = 0; i < 5; i++) expect((await tryLogin()).status).toBe(401);
    const res = await tryLogin();
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });

  it('loginAs gives a session with the requested roles', async () => {
    const { agent } = await loginAs(app, { roles: ['bookseller'] });
    const res = await agent.get('/api/auth/me');
    expect(res.body.data.user.roles).toContain('bookseller');
  });
});
