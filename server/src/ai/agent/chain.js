import { searchCatalog } from './tools/searchCatalog.js';
import { checkStockAndLength } from './tools/checkStockAndLength.js';
import { compareClubConstraints } from './tools/compareClubConstraints.js';
import { writeNote } from './note.js';

export const runAgent = async ({ constraints, request, emit }) => {
  const searchResult = await searchCatalog.invoke({ query: request }, { context: { emit } });

  const stockResult = await checkStockAndLength.invoke(
    {
      bookIds: searchResult.map((book) => book.bookId),
      groupSize: constraints.memberCount,
    },
    { context: { emit } },
  );

  const constraintResult = await compareClubConstraints.invoke(
    {
      pagesPossible: constraints.pagesPossible,
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

      const bookConstraints = constraintResult.find((item) => item.bookId === book.bookId);

      if (!stock || !bookConstraints) {
        return null;
      }

      if (!stock.enoughCopies || !['fits', 'tight'].includes(bookConstraints.timeFit)) {
        return null;
      }

      return {
        bookId: book.bookId,
        title: book.title,
        authors: book.authors,
        pages: book.pages,
        copies: stock.copies,
        enoughCopies: stock.enoughCopies,
        timeFit: bookConstraints.timeFit,
        evidence: [
          `${stock.copies} copies for ${constraints.memberCount} members`,
          bookConstraints.note,
        ],
      };
    })
    .filter(Boolean)
    .slice(0, 3);

  const note = await writeNote(shortlist, constraints);

  return {
    shortlist,
    note,
  };
};
