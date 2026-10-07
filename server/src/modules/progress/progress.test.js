import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { setProgress, getMyProgress, listMyProgress, getBoundary } from './service.js';

const userA = { _id: new mongoose.Types.ObjectId() };
const userB = { _id: new mongoose.Types.ObjectId() };
const strictUser = { _id: new mongoose.Types.ObjectId() };
const bookId = new mongoose.Types.ObjectId().toString();

describe('progress service', () => {
  beforeAll(startTestDB, 120000);
  afterAll(stopTestDB);

  it('saves progress and updates it', async () => {
    await setProgress(userA, { bookId, chapter: 3, page: 40 });
    const updated = await setProgress(userA, { bookId, chapter: 5 });
    expect(updated.chapter).toBe(5);
    expect(updated.page).toBe(40);
  });

  it('lists only my own progress', async () => {
    const mine = await listMyProgress(userA);
    expect(mine).toHaveLength(1);
    expect(await listMyProgress(userB)).toHaveLength(0);
  });

  it('a reader cannot see another reader progress', async () => {
    expect(await getMyProgress(userB, bookId)).toBeNull();
  });

  it('getBoundary uses the declared chapter', async () => {
    const b = await getBoundary(userA._id, bookId);
    expect(b).toEqual({ chapter: 5, page: 40, declared: true });
  });

  it('getBoundary with no progress is chapter 0 and not declared', async () => {
    const b = await getBoundary(userB._id, bookId);
    expect(b).toEqual({ chapter: 0, page: 0, declared: false });
  });

  it('getBoundary respects a strict spoiler limit lower than progress', async () => {
    await mongoose.connection.collection('users').insertOne({
      _id: strictUser._id,
      spoilerSettings: { strict: true, maxChapter: 2 },
    });
    await setProgress(strictUser, { bookId, chapter: 6 });
    const b = await getBoundary(strictUser._id, bookId);
    expect(b.chapter).toBe(2);
    expect(b.declared).toBe(true);
  });
});
