import { searchCatalog } from './tools/searchCatalog.js';
import { checkStockAndLength } from './tools/checkStockAndLength.js';
import { compareClubConstraints } from './tools/compareClubConstraints.js';
import { fakeClubs } from './tools/fakeData.js';

export const runAgent = async ({ clubId, request, emit }) => {
  const club = fakeClubs.find((item) => item.clubId === clubId);

  if (!club) {
    throw new Error(`Club not found: ${clubId}`);
  }

  const searchResult = await searchCatalog.invoke(
    { query: request },
    { context: { emit } },
  );

  const stockResult = await checkStockAndLength.invoke(
    {
      bookIds: searchResult.map((book) => book.bookId),
      groupSize: club.memberCount,
    },
    { context: { emit } },
  );

  const constraintResult = await compareClubConstraints.invoke(
    {
      clubId,
      books: stockResult.map((book) => ({
        bookId: book.bookId,
        pages: book.pages,
      })),
    },
    { context: { emit } },
  );

  const shortlist = searchResult
    .map((book) => {
      const stock = stockResult.find((item) => item.bookId === book.bookId);
      const constraints = constraintResult.find(
        (item) => item.bookId === book.bookId,
      );

      if (!stock || !constraints) {
        return null;
      }

      if (
        !stock.enoughCopies ||
        !['fits', 'tight'].includes(constraints.timeFit)
      ) {
        return null;
      }

      return {
        bookId: book.bookId,
        title: book.title,
        authors: book.authors,
        pages: book.pages,
        copies: stock.copies,
        enoughCopies: stock.enoughCopies,
        timeFit: constraints.timeFit,
        evidence: [
          `${stock.copies} copies for ${club.memberCount} members`,
          constraints.note,
        ],
      };
    })
    .filter(Boolean)
    .slice(0, 3);

  return {
    shortlist,
    note: shortlist.length
      ? 'Recommendations only. No book was reserved or selected.'
      : 'No book fits the time and copies, try a shorter book.',
  };
};