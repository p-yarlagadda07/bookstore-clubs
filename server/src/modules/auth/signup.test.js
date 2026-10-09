import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { User } from '../users/model.js';

const app = createApp();
const PASSWORD = 'Password@123';

beforeAll(startTestDB);
afterAll(stopTestDB);

// the verify link is printed with console.log, so we read the token from there
let logSpy;
beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => logSpy.mockRestore());

function lastToken() {
  const line = logSpy.mock.calls
    .map((c) => String(c[0]))
    .reverse()
    .find((l) => l.includes('Verify link'));
  return line.split('token=')[1];
}

async function signup(body) {
  const agent = request.agent(app);
  const { body: csrfBody } = await agent.get('/api/auth/csrf');
  return agent.post('/api/auth/signup').set('x-csrf-token', csrfBody.data.token).send(body);
}

describe('signup', () => {
  it('creates an unverified reader and hides secrets', async () => {
    const res = await signup({ name: 'Asha', email: 'asha@test.local', password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.data.user.roles).toEqual(['reader']);
    expect(res.body.data.user.emailVerifiedAt).toBeNull();
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.verifyTokenHash).toBeUndefined();
  });

  it('rejects an email that is already used', async () => {
    await signup({ name: 'Ben', email: 'ben@test.local', password: PASSWORD });
    const res = await signup({ name: 'Ben 2', email: 'ben@test.local', password: PASSWORD });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects a bad body with 400', async () => {
    const res = await signup({ name: 'C', email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
  });
});

describe('verify', () => {
  it('verifies once, then the same link fails', async () => {
    await signup({ name: 'Dev', email: 'dev@test.local', password: PASSWORD });
    const token = lastToken();

    const first = await request(app).get(`/api/auth/verify?token=${token}`);
    expect(first.status).toBe(200);
    expect(first.body.data.user.emailVerifiedAt).toBeTruthy();

    const again = await request(app).get(`/api/auth/verify?token=${token}`);
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe('TOKEN_INVALID');
  });

  it('rejects a random token', async () => {
    const res = await request(app).get(`/api/auth/verify?token=${'a'.repeat(64)}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('rejects an expired token', async () => {
    await signup({ name: 'Eva', email: 'eva@test.local', password: PASSWORD });
    const token = lastToken();
    await User.updateOne({ email: 'eva@test.local' }, { verifyTokenExpires: new Date(Date.now() - 1000) });
    const res = await request(app).get(`/api/auth/verify?token=${token}`);
    expect(res.status).toBe(400);
  });

  it('a new user can log in after signing up', async () => {
    await signup({ name: 'Faye', email: 'faye@test.local', password: PASSWORD });
    const agent = request.agent(app);
    const { body } = await agent.get('/api/auth/csrf');
    const res = await agent
      .post('/api/auth/login')
      .set('x-csrf-token', body.data.token)
      .send({ email: 'faye@test.local', password: PASSWORD });
    expect(res.status).toBe(200);
  });
});