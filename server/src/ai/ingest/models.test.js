import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import Excerpt from './excerpt.model.js';
import StoreDoc from './storeDoc.model.js';

beforeAll(startTestDB);
afterAll(stopTestDB);

describe('Excerpt model', () => {
  it('saves and hides embedding by default', async () => {
    const ex = await Excerpt.create({
      bookId: new mongoose.Types.ObjectId(),
      text: 'The fog rolled in over the harbour.',
      chapter: 1,
      pageStart: 3,
      pageEnd: 4,
      embedding: [0.1, 0.2, 0.3],
    });

    const found = await Excerpt.findById(ex._id).lean();
    expect(found.text).toBe('The fog rolled in over the harbour.');
    expect(found.approved).toBe(false);
    expect(found).not.toHaveProperty('embedding');

    const withEmb = await Excerpt.findById(ex._id).select('+embedding').lean();
    expect(withEmb.embedding).toEqual([0.1, 0.2, 0.3]);
  });

  it('needs a chapter', async () => {
    await expect(
      Excerpt.create({ bookId: new mongoose.Types.ObjectId(), text: 'no chapter' }),
    ).rejects.toThrow(/chapter/);
  });
});

describe('StoreDoc model', () => {
  it('saves and hides embedding by default', async () => {
    const doc = await StoreDoc.create({
      title: 'Pickup policy',
      type: 'policy',
      text: 'Reserved copies are held until the end of the pickup window.',
      embedding: [0.5, 0.6],
    });

    const found = await StoreDoc.findById(doc._id).lean();
    expect(found.chunkIndex).toBe(0);
    expect(found).not.toHaveProperty('embedding');

    const withEmb = await StoreDoc.findById(doc._id).select('+embedding').lean();
    expect(withEmb.embedding).toEqual([0.5, 0.6]);
  });

  it('rejects an unknown type', async () => {
    await expect(StoreDoc.create({ title: 'x', type: 'blog', text: 'y' })).rejects.toThrow(/type/);
  });
});
