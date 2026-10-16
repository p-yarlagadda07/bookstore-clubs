import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { User } from '../users/model.js';

const app = createApp();
const OLD = 'Password@123';
const NEW = 'NewPass@456';

beforeAll(startTestDB);
afterAll(stopTestDB);

// the reset link is printed with console.log, so we read the token from there
let logSpy;
beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => logSpy.mockRestore());

function lastToken() {
  const line = logSpy.mock.calls
    .map((c) => String(c[0]))
    .reverse()
    .find((l) => l.includes('Reset link'));
  return line?.split('token=')[1];
}

async function post(path, body) {
  const agent = request.agent(app);
  const { body: csrfBody } = await agent.get('/api/auth/csrf');
  return agent.post(path).set('x-csrf-token', csrfBody.data.token).send(body);
}

async function makeUser(email) {
  await User.create({
    name: 'Test',
    email,
    passwordHash: await argon2.hash(OLD),
    emailVerifiedAt: new Date(),
  });
}

describe('forgot', () => {
  it('answers 200 for an unknown email and prints no link', async () => {
    const res = await post('/api/auth/forgot', { email: 'nobody@test.local' });
    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(true);
    expect(lastToken()).toBeUndefined();
  });

  it('rejects a bad email with 400', async () => {
    const res = await post('/api/auth/forgot', { email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

describe('reset', () => {
  it('changes the password: old one fails, new one works', async () => {
    await makeUser('anu@test.local');
    await post('/api/auth/forgot', { email: 'anu@test.local' });
    const token = lastToken();

    const res = await post('/api/auth/reset', { token, password: NEW });
    expect(res.status).toBe(200);
    expect(res.body.data.reset).toBe(true);

    const oldLogin = await post('/api/auth/login', { email: 'anu@test.local', password: OLD });
    expect(oldLogin.status).toBe(401);
    const newLogin = await post('/api/auth/login', { email: 'anu@test.local', password: NEW });
    expect(newLogin.status).toBe(200);
  });

  it('a link works only once', async () => {
    await makeUser('bala@test.local');
    await post('/api/auth/forgot', { email: 'bala@test.local' });
    const token = lastToken();

    expect((await post('/api/auth/reset', { token, password: NEW })).status).toBe(200);
    const again = await post('/api/auth/reset', { token, password: 'Another@789' });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe('TOKEN_INVALID');
  });

  it('rejects an expired link', async () => {
    await makeUser('chitra@test.local');
    await post('/api/auth/forgot', { email: 'chitra@test.local' });
    const token = lastToken();
    await User.updateOne(
      { email: 'chitra@test.local' },
      { resetTokenExpires: new Date(Date.now() - 1000) },
    );

    const res = await post('/api/auth/reset', { token, password: NEW });
    expect(res.status).toBe(400);
  });

  it('rejects a short new password with 400', async () => {
    const res = await post('/api/auth/reset', { token: 'a'.repeat(64), password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
describe('reset security', () => {
  // the forgot limit is 5 per IP and the tests above use them up, so use other IPs here
  async function forgotFrom(ip, email) {
    const agent = request.agent(app);
    const { body } = await agent.get('/api/auth/csrf');
    return agent
      .post('/api/auth/forgot')
      .set('x-csrf-token', body.data.token)
      .set('X-Forwarded-For', ip)
      .send({ email });
  }

  it('the reset link lasts 30 minutes', async () => {
    await makeUser('dev30@test.local');
    expect((await forgotFrom('10.0.0.1', 'dev30@test.local')).status).toBe(200);
    const user = await User.findOne({ email: 'dev30@test.local' }).lean();
    const minutes = (new Date(user.resetTokenExpires).getTime() - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(29);
    expect(minutes).toBeLessThanOrEqual(30);
  });

  it('logs out old sessions after a reset, and a new login works', async () => {
    await makeUser('dina@test.local');

    // agent A logs in with the old password
    const a = request.agent(app);
    const { body } = await a.get('/api/auth/csrf');
    const login = await a
      .post('/api/auth/login')
      .set('x-csrf-token', body.data.token)
      .send({ email: 'dina@test.local', password: OLD });
    expect(login.status).toBe(200);
    expect((await a.get('/api/auth/me')).status).toBe(200);

    // password is reset through the link
    expect((await forgotFrom('10.0.0.2', 'dina@test.local')).status).toBe(200);
    const token = lastToken();
    expect((await post('/api/auth/reset', { token, password: NEW })).status).toBe(200);

    // agent A's old session no longer works
    expect((await a.get('/api/auth/me')).status).toBe(401);

    // logging in again with the new password works
    const again = await post('/api/auth/login', { email: 'dina@test.local', password: NEW });
    expect(again.status).toBe(200);
  });
});
