import { createApp } from '../../app.js';
import { loginAs } from '../../../test/helpers/auth.js';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { Club, Membership, Meeting } from './model.js';
import Progress from '../progress/model.js';
import {
  getPublishedClubs,
  getPublishedClubById,
  joinClub,
  getClub,
  isMember,
  getConstraints,
  getClubProgress,
} from './service.js';

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

describe('clubs service', () => {
  it('only lists published clubs', async () => {
    await Club.create([
      {
        name: 'Published Club',
        published: true,
      },
      {
        name: 'Unpublished Club',
        published: false,
      },
    ]);

    const result = await getPublishedClubs();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Published Club');
  });

  it('returns null for an unpublished club', async () => {
    const club = await Club.create({
      name: 'Private Club',
      published: false,
    });

    const result = await getPublishedClubById(club._id);

    expect(result).toBeNull();
  });

  it('returns ALREADY_MEMBER when joining an active club twice', async () => {
    const club = await Club.create({
      name: 'Test Club',
      published: true,
    });

    const user = {
      _id: new mongoose.Types.ObjectId(),
    };

    await Membership.create({
      clubId: club._id,
      userId: user._id,
      status: 'active',
    });

    const result = await joinClub(club._id, user);

    expect(result.error).toBe('ALREADY_MEMBER');
  });

  it('gets a club by id', async () => {
    const club = await Club.create({
      name: 'Test Club',
      published: true,
    });

    const result = await getClub(club._id);

    expect(String(result._id)).toBe(String(club._id));
    expect(result.name).toBe('Test Club');
  });

  it('checks whether a user is an active member', async () => {
    const club = await Club.create({
      name: 'Test Club',
      published: true,
    });

    const userId = new mongoose.Types.ObjectId();

    expect(await isMember(club._id, userId)).toBe(false);

    await Membership.create({
      clubId: club._id,
      userId,
      status: 'active',
    });

    expect(await isMember(club._id, userId)).toBe(true);
  });

  it('returns club reading constraints for a member', async () => {
    const club = await Club.create({
      name: 'Test Club',
      published: true,
      rules: ['Be respectful', 'Read before meetings'],
      readingPace: { pagesPerWeek: 140 },
    });
    const member = { _id: new mongoose.Types.ObjectId() };

    await Membership.create([
      { clubId: club._id, userId: member._id, status: 'active' },
      { clubId: club._id, userId: new mongoose.Types.ObjectId(), status: 'active' },
      { clubId: club._id, userId: new mongoose.Types.ObjectId(), status: 'removed' },
    ]);

    await Meeting.create({
      clubId: club._id,
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdBy: new mongoose.Types.ObjectId(),
    });

    const result = await getConstraints(club._id, member);

    expect(result.memberCount).toBe(2);
    expect(result.nextMeeting).toBeTruthy();
    expect(result.daysUntilMeeting).toBe(14);
    expect(result.pagesPerWeek).toBe(140);
    expect(result.pagesPossible).toBe(280);
    expect(result.rules).toEqual(['Be respectful', 'Read before meetings']);
  });

  it('does not give constraints to non-members', async () => {
    const club = await Club.create({ name: 'Test Club', published: true });
    const stranger = { _id: new mongoose.Types.ObjectId() };

    await expect(getConstraints(club._id, stranger)).rejects.toMatchObject({ status: 403 });
  });

  it('club progress hides private progress and blocks non-members', async () => {
    const club = await Club.create({ name: 'Test Club', published: true });
    const a = { _id: new mongoose.Types.ObjectId() };
    const b = { _id: new mongoose.Types.ObjectId() };
    const bookId = new mongoose.Types.ObjectId();

    await Membership.create([
      { clubId: club._id, userId: a._id },
      { clubId: club._id, userId: b._id },
    ]);

    await Progress.create([
      { userId: a._id, bookId, clubId: club._id, chapter: 3, visibility: 'club' },
      { userId: b._id, bookId, clubId: club._id, chapter: 5, visibility: 'private' },
    ]);

    const list = await getClubProgress(club._id, a);

    expect(list).toHaveLength(1);
    expect(list[0].chapter).toBe(3);

    const stranger = { _id: new mongoose.Types.ObjectId() };

    await expect(getClubProgress(club._id, stranger)).rejects.toMatchObject({ status: 403 });
  });
});

describe('clubs moderator API', () => {
  it('allows a club moderator to create a meeting and see members', async () => {
    const club = await Club.create({
      name: 'Moderator Club',
      published: true,
    });

    const { agent, csrf, user } = await loginAs(app, {
      moderatorOf: [club._id],
    });

    await Membership.create({
      clubId: club._id,
      userId: user._id,
      status: 'active',
    });

    const meetingResponse = await agent
      .post(`/api/clubs/${club._id}/meetings`)
      .set('x-csrf-token', csrf)
      .send({
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '18:30',
        location: 'Library',
        agenda: 'Discuss the next chapters',
      });

    expect(meetingResponse.status).toBe(201);
    expect(meetingResponse.body.data.location).toBe('Library');

    const membersResponse = await agent.get(`/api/clubs/${club._id}/members`);

    expect(membersResponse.status).toBe(200);
    expect(membersResponse.body.data.items).toHaveLength(1);
    expect(membersResponse.body.data.items[0].email).toBe(user.email);
  });

  it('allows a club moderator to edit club rules', async () => {
    const club = await Club.create({
      name: 'Editable Club',
      published: true,
      rules: ['Old rule'],
    });

    const { agent, csrf } = await loginAs(app, {
      moderatorOf: [club._id],
    });

    const response = await agent
      .patch(`/api/clubs/${club._id}`)
      .set('x-csrf-token', csrf)
      .send({
        rules: ['Be respectful', 'No spoilers'],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.rules).toEqual(['Be respectful', 'No spoilers']);

    const updated = await Club.findById(club._id).lean();
    expect(updated.rules).toEqual(['Be respectful', 'No spoilers']);
  });

  it('blocks a normal reader from editing a club', async () => {
    const club = await Club.create({
      name: 'Reader Blocked Club',
      published: true,
      rules: ['Old rule'],
    });

    const { agent, csrf } = await loginAs(app);

    const response = await agent
      .patch(`/api/clubs/${club._id}`)
      .set('x-csrf-token', csrf)
      .send({
        rules: ['New rule'],
      });

    expect(response.status).toBe(403);

    const unchanged = await Club.findById(club._id).lean();
    expect(unchanged.rules).toEqual(['Old rule']);
  });

  it('allows a moderator to remove a member and blocks that member from rejoining', async () => {
    const club = await Club.create({
      name: 'Remove Member Club',
      published: true,
    });

    const moderator = await loginAs(app, {
      moderatorOf: [club._id],
    });

    const member = await loginAs(app);

    await Membership.create({
      clubId: club._id,
      userId: member.user._id,
      status: 'active',
    });

    const removeResponse = await moderator.agent
      .delete(`/api/clubs/${club._id}/members/${member.user._id}`)
      .set('x-csrf-token', moderator.csrf);

    expect(removeResponse.status).toBe(200);
    expect(removeResponse.body.data).toEqual({});

    const membership = await Membership.findOne({
      clubId: club._id,
      userId: member.user._id,
    }).lean();

    expect(membership.status).toBe('removed');

    const rejoinResponse = await member.agent
      .post(`/api/clubs/${club._id}/join`)
      .set('x-csrf-token', member.csrf);

    expect(rejoinResponse.status).toBe(403);
  });

  it('returns 404 when removing an unknown member', async () => {
    const club = await Club.create({
      name: 'Unknown Member Club',
      published: true,
    });

    const { agent, csrf } = await loginAs(app, {
      moderatorOf: [club._id],
    });

    const unknownUserId = new mongoose.Types.ObjectId();

    const response = await agent
      .delete(`/api/clubs/${club._id}/members/${unknownUserId}`)
      .set('x-csrf-token', csrf);

    expect(response.status).toBe(404);
  });

  it('rejects a meeting with a past date', async () => {
    const club = await Club.create({
      name: 'Past Date Club',
      published: true,
    });

    const { agent, csrf } = await loginAs(app, {
      moderatorOf: [club._id],
    });

    const response = await agent
      .post(`/api/clubs/${club._id}/meetings`)
      .set('x-csrf-token', csrf)
      .send({
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        time: '18:30',
        location: 'Library',
        agenda: 'Past meeting',
      });

    expect(response.status).toBe(400);
  });

  it('rejects a meeting with an invalid time', async () => {
    const club = await Club.create({
      name: 'Invalid Time Club',
      published: true,
    });

    const { agent, csrf } = await loginAs(app, {
      moderatorOf: [club._id],
    });

    const response = await agent
      .post(`/api/clubs/${club._id}/meetings`)
      .set('x-csrf-token', csrf)
      .send({
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '6pm',
        location: 'Library',
        agenda: 'Invalid time',
      });

    expect(response.status).toBe(400);
  });

  it('blocks a normal reader from creating a meeting', async () => {
    const club = await Club.create({
      name: 'Reader Blocked Club',
      published: true,
    });

    const { agent, csrf } = await loginAs(app);

    const response = await agent
      .post(`/api/clubs/${club._id}/meetings`)
      .set('x-csrf-token', csrf)
      .send({
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '18:30',
        location: 'Library',
        agenda: 'Test meeting',
      });

    expect(response.status).toBe(403);
  });

  it('blocks a moderator of another club', async () => {
    const club = await Club.create({
      name: 'Target Club',
      published: true,
    });

    const otherClub = await Club.create({
      name: 'Other Club',
      published: true,
    });

    const { agent, csrf } = await loginAs(app, {
      moderatorOf: [otherClub._id],
    });

    const response = await agent
      .post(`/api/clubs/${club._id}/meetings`)
      .set('x-csrf-token', csrf)
      .send({
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '18:30',
        location: 'Library',
        agenda: 'Test meeting',
      });

    expect(response.status).toBe(403);
  });
});
