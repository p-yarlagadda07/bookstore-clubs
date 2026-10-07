import { tool } from '@langchain/core/tools';

import { CheckStockAndLengthInput } from '@bookstore/shared/schemas/readingAgent';
import { fakeBooks } from './fakeData.js';

const emitToolEvent = (config, status, summary) => {
  const context = config?.context ?? config;

  if (typeof context?.emit === 'function') {
    context.emit({
      name: 'checkStockAndLength',
      status,
      summary,
    });
  }
};

export const checkStockAndLength = tool(
  async (input, config) => {
    emitToolEvent(config, 'started', 'Checking stock and reading length');

    try {
      const results = input.bookIds.map((bookId) => {
        const book = fakeBooks.find((item) => item.bookId === bookId);

        if (!book) {
          throw new Error(`Book not found: ${bookId}`);
        }

        return {
          bookId: book.bookId,
          title: book.title,
          pages: book.pages,
          readingHours: Number((book.pages / 40).toFixed(1)),
          copies: book.copies,
          enoughCopies: book.copies >= input.groupSize,
        };
      });

      emitToolEvent(config, 'succeeded', `Checked stock for ${results.length} books`);

      return results;
    } catch (error) {
      emitToolEvent(
        config,
        'failed',
        error instanceof Error ? error.message : 'Stock and length check failed',
      );

      throw error;
    }
  },
  {
    name: 'checkStockAndLength',
    description: 'Check book availability and estimate reading hours for the club group size.',
    schema: CheckStockAndLengthInput,
  },
);
