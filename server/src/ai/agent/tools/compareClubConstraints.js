import { tool } from '@langchain/core/tools';

import { CompareClubConstraintsInput } from '@bookstore/shared/schemas/readingAgent';

const emitToolEvent = (config, status, summary) => {
  const context = config?.context ?? config;

  if (typeof context?.emit === 'function') {
    context.emit({
      name: 'compareClubConstraints',
      status,
      summary,
    });
  }
};

export const compareClubConstraints = tool(
  async (input, config) => {
    emitToolEvent(config, 'started', 'Comparing books with club reading constraints');

    try {
      const results = input.books.map((book) => {
        let timeFit = 'too_long';

        if (book.pages <= input.pagesPossible) {
          timeFit = 'fits';
        } else if (book.pages <= input.pagesPossible * 1.2) {
          timeFit = 'tight';
        }

        return {
          bookId: book.bookId,
          pagesNeeded: book.pages,
          pagesPossible: input.pagesPossible,
          timeFit,
          note:
            timeFit === 'fits'
              ? "Book fits comfortably within the club's available reading time."
              : timeFit === 'tight'
                ? 'Book is slightly longer than the ideal reading capacity.'
                : "Book is too long for the club's available reading time.",
        };
      });

      emitToolEvent(config, 'succeeded', `Compared ${results.length} books with club constraints`);

      return results;
    } catch (error) {
      emitToolEvent(
        config,
        'failed',
        error instanceof Error ? error.message : 'Club constraint comparison failed',
      );

      throw error;
    }
  },
  {
    name: 'compareClubConstraints',
    description:
      "Compare candidate books with the club's available reading time and page capacity.",
    schema: CompareClubConstraintsInput,
  },
);
