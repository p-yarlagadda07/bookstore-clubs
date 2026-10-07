import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { Club, Membership } from './model.js';
import {
  getPublishedClubs,
  getPublishedClubById,
  joinClub,
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
});