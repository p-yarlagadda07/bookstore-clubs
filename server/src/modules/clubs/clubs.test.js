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
