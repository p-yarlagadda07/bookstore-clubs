import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';

import { createApp } from '../../app.js';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { loginAs } from '../../../test/helpers/auth.js';

const app = createApp();

beforeAll(startTestDB);
afterAll(stopTestDB);

describe('Preferences API', () => {
  it('requires login to read preferences', async () => {
    const response = await request(app).get('/api/users/me/preferences');
    expect(response.status).toBe(401);
  });

  it('returns default preferences for a logged-in user', async () => {
    const { agent } = await loginAs(app);
    const response = await agent.get('/api/users/me/preferences');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      genres: [],
      moods: [],
      maxPages: null,
      spoilerStrict: false,
      bookmarkVisibility: 'club',
    });
  });

  it('updates only the preference fields sent', async () => {
    const { agent, csrf } = await loginAs(app);
    const response = await agent
      .patch('/api/users/me/preferences')
      .set('x-csrf-token', csrf)
      .send({ genres: ['Fantasy'], spoilerStrict: true });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      genres: ['Fantasy'],
      moods: [],
      maxPages: null,
      spoilerStrict: true,
      bookmarkVisibility: 'club',
    });
  });

  it('rejects invalid preference values', async () => {
    const { agent, csrf } = await loginAs(app);
    const response = await agent
      .patch('/api/users/me/preferences')
      .set('x-csrf-token', csrf)
      .send({ maxPages: 20 });

    expect(response.status).toBe(400);
  });

  it('rejects an empty update', async () => {
    const { agent, csrf } = await loginAs(app);
    const response = await agent
      .patch('/api/users/me/preferences')
      .set('x-csrf-token', csrf)
      .send({});

    expect(response.status).toBe(400);
  });
});
