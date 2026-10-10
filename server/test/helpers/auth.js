import request from 'supertest';
import argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { User } from '../../src/modules/users/model.js';

// creates a user, logs in with csrf, returns an agent that keeps the session cookie
export async function loginAs(app, { roles = ['reader'], verified = true, moderatorOf = [] } = {}) {
  const email = `user-${randomUUID()}@test.local`;
  const password = 'Password@123';
  const user = await User.create({
    name: 'Test User',
    email,
    passwordHash: await argon2.hash(password),
    roles,
    emailVerifiedAt: verified ? new Date() : null,
    moderatorOf,
  });

  const agent = request.agent(app);
  const { body } = await agent.get('/api/auth/csrf');
  const csrf = body.data.token;

  const res = await agent
    .post('/api/auth/login')
    .set('x-csrf-token', csrf)
    .send({ email, password });
  if (res.status !== 200) {
    throw new Error(`loginAs failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { agent, csrf, user: user.toJSON() };
}
