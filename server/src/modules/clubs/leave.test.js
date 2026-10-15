import request from 'supertest';
import { createApp } from '../../app.js';
import { loginAs } from '../../../test/helpers/auth.js';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { Club, Membership } from './model.js';

const app = createApp();

beforeAll(async () => {
  await startTestDB();
}, 120000);

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe('leave club API', () => {
  it('allows a member to leave and join the club again', async () => {
    const club = await Club.create({
      name: 'Leave Club Test',
      published: true,
    });
    const { agent, csrf, user } = await loginAs(app);

    await Membership.create({
      clubId: club._id,
      userId: user._id,
      status: 'active',
    });

    const leaveResponse = await agent
      .delete(`/api/clubs/${club._id}/membership`)
      .set('x-csrf-token', csrf);

    expect(leaveResponse.status).toBe(200);
    expect(leaveResponse.body.data).toEqual({ left: true });
    expect(await Membership.findOne({ clubId: club._id, userId: user._id })).toBeNull();

    const joinResponse = await agent.post(`/api/clubs/${club._id}/join`).set('x-csrf-token', csrf);

    expect(joinResponse.status).toBe(201);
  });
  it('returns 404 when a non-member tries to leave', async () => {
    const club = await Club.create({
      name: 'Not a Member Club',
      published: true,
    });
    const { agent, csrf } = await loginAs(app);

    const response = await agent
      .delete(`/api/clubs/${club._id}/membership`)
      .set('x-csrf-token', csrf);

    expect(response.status).toBe(404);
    expect(JSON.stringify(response.body)).toContain('You are not a member of this club');
  });

  it('returns isMember true for an active member', async () => {
    const club = await Club.create({
      name: 'Member Club',
      published: true,
    });
    const { agent, user } = await loginAs(app);

    await Membership.create({
      clubId: club._id,
      userId: user._id,
      status: 'active',
    });

    const response = await agent.get(`/api/clubs/${club._id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.isMember).toBe(true);
  });

  it('returns isMember false for a logged-in non-member', async () => {
    const club = await Club.create({
      name: 'Non-member Club',
      published: true,
    });
    const { agent } = await loginAs(app);

    const response = await agent.get(`/api/clubs/${club._id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.isMember).toBe(false);
  });

  it('returns isMember false for a logged-out visitor', async () => {
    const club = await Club.create({
      name: 'Public Club',
      published: true,
    });

    const response = await request(app).get(`/api/clubs/${club._id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.isMember).toBe(false);
  });
});
