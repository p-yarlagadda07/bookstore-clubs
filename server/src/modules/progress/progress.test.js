import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import { setProgress, getMyProgress, getBoundary } from './service.js';

const userA = { _id: new mongoose.Types.ObjectId() };
const userB = { _id: new mongoose.Types.ObjectId() };
const bookId = new mongoose.Types.ObjectId().toString();

describe('progress service', () => {
  beforeAll(startTestDB);
  afterAll(stopTestDB);

  it('saves progress and updates it', async () => {
    await setProgress(userA, { bookId, chapter: 3, page: 40 });
    const updated = await setProgress(userA, { bookId, chapter: 5 });
    expect(updated.chapter).toBe(5);
    expect(updated.page).toBe(40);
  });

  it('getBoundary returns chapter and page', async () => {
    const boundary = await getBoundary(userA, bookId);
    expect(boundary).toEqual({ chapter: 5, page: 40 });
  });

  it('getBoundary returns null when no progress is set', async () => {
    const boundary = await getBoundary(userB, bookId);
    expect(boundary).toBeNull();
  });

  it('a reader cannot see another reader progress', async () => {
    const other = await getMyProgress(userB, bookId);
    expect(other).toBeNull();
  });
});