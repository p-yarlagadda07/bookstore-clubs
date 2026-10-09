import { afterAll, beforeAll, describe, it, expect } from 'vitest';

import { startTestDB, stopTestDB } from '../../../../test/helpers/db.js';

import Book from '../../../modules/books/model.js';
import Inventory from '../../../modules/inventory/model.js';

import { searchCatalog } from './searchCatalog.js';
import { checkStockAndLength } from './checkStockAndLength.js';
import { compareClubConstraints } from './compareClubConstraints.js';

describe('agent tools (real books and inventory)', () => {
  beforeAll(async () => {
    await startTestDB();

    await Inventory.deleteMany({});
    await Book.deleteMany({});

    const books = await Book.create([
      {
        title: "The Lantern Keeper's Secret",
        authors: ['Test Author'],
        themes: ['mystery'],
        moods: ['suspenseful'],
        synopsis: 'A mystery involving a lantern keeper and a hidden secret.',
        pageCount: 380,
        readingHours: 9.5,
        approvedSource: true,
      },
      {
        title: 'Murder at Platform Nine',
        authors: ['Test Author'],
        themes: ['mystery'],
        moods: ['suspenseful'],
        synopsis: 'A short mystery set at a railway station.',
        pageCount: 220,
        readingHours: 5.5,
        approvedSource: true,
      },
    ]);

    await Inventory.create([
      {
        bookId: books[0]._id,
        condition: 'new',
        total: 3,
        available: 3,
        held: 0,
        status: 'active',
      },
      {
        bookId: books[1]._id,
        condition: 'new',
        total: 10,
        available: 10,
        held: 0,
        status: 'active',
      },
    ]);
  });

  afterAll(async () => {
    await stopTestDB();
  });

  it('searchCatalog finds matching real books', async () => {
    const res = await searchCatalog.invoke({
      query: 'a short mystery for our club',
    });

    expect(res.length).toBeGreaterThan(0);
    expect(res.some((book) => book.title === 'Murder at Platform Nine')).toBe(true);
  });

  it('searchCatalog respects maxPages', async () => {
    const res = await searchCatalog.invoke({
      query: 'mystery',
      maxPages: 250,
    });

    expect(res.every((book) => book.pages <= 250)).toBe(true);
  });

  it('checks real inventory for an eight-member club', async () => {
    const books = await Book.find({
      title: {
        $in: ["The Lantern Keeper's Secret", 'Murder at Platform Nine'],
      },
    }).lean();

    const popularBook = books.find((book) => book.title === "The Lantern Keeper's Secret");
    const shortBook = books.find((book) => book.title === 'Murder at Platform Nine');

    const res = await checkStockAndLength.invoke({
      bookIds: [String(popularBook._id), String(shortBook._id)],
      groupSize: 8,
    });

    expect(res[0].enoughCopies).toBe(false);
    expect(res[1].enoughCopies).toBe(true);
  });

  it('compareClubConstraints marks 380 pages too long and 220 as fitting', async () => {
    const res = await compareClubConstraints.invoke({
      pagesPossible: 240,
      books: [
        { bookId: 'popular-book', pages: 380 },
        { bookId: 'short-book', pages: 220 },
      ],
    });

    expect(res[0].timeFit).toBe('too_long');
    expect(res[1].timeFit).toBe('fits');
  });

  it('sends started and succeeded events', async () => {
    const events = [];

    await searchCatalog.invoke(
      { query: 'mystery' },
      { context: { emit: (event) => events.push(event) } },
    );

    expect(events.map((event) => event.status)).toEqual(['started', 'succeeded']);
  });

  it('rejects bad input', async () => {
    await expect(checkStockAndLength.invoke({ bookIds: [], groupSize: 8 })).rejects.toThrow();
  });
});
