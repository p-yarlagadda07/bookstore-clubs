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
