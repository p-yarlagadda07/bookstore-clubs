import { describe, it, expect } from 'vitest';
import { searchCatalog } from './searchCatalog.js';
import { checkStockAndLength } from './checkStockAndLength.js';
import { compareClubConstraints } from './compareClubConstraints.js';

describe('agent tools (fake data)', () => {
  it('searchCatalog finds mysteries from a normal sentence', async () => {
    const res = await searchCatalog.invoke({
      query: 'a short mystery for our club',
    });
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].why).toContain('mystery');
  });

  it('searchCatalog respects maxPages', async () => {
    const res = await searchCatalog.invoke({
      query: 'mystery',
      maxPages: 250,
    });
    expect(res.every((b) => b.pages <= 250)).toBe(true);
  });

  it('popular mystery does not have enough copies for 8 members', async () => {
    const res = await checkStockAndLength.invoke({
      bookIds: ['book-popular-mystery', 'book-short-mystery'],
      groupSize: 8,
    });
    expect(res[0].enoughCopies).toBe(false);
    expect(res[1].enoughCopies).toBe(true);
  });

  it('compareClubConstraints marks 380 pages too long and 220 fits', async () => {
    const res = await compareClubConstraints.invoke({
      pagesPossible: 240,
      books: [
        { bookId: 'book-popular-mystery', pages: 380 },
        { bookId: 'book-short-mystery', pages: 220 },
      ],
    });
    expect(res[0].timeFit).toBe('too_long');
    expect(res[1].timeFit).toBe('fits');
  });

  it('sends started and succeeded events', async () => {
    const events = [];
    await searchCatalog.invoke(
      { query: 'mystery' },
      { context: { emit: (e) => events.push(e) } },
    );
    expect(events.map((e) => e.status)).toEqual(['started', 'succeeded']);
  });

  it('rejects bad input', async () => {
    await expect(
      checkStockAndLength.invoke({ bookIds: [], groupSize: 8 }),
    ).rejects.toThrow();
  });
});