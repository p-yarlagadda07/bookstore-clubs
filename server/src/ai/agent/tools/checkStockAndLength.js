import { tool } from '@langchain/core/tools';

import { CheckStockAndLengthInput } from '@bookstore/shared/schemas/readingAgent';
import Book from '../../../modules/books/model.js';
import { getAvailability } from '../../../modules/inventory/service.js';

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
    emitToolEvent(config, 'started', 'Checking real stock and reading length');

    try {
      const books = await Book.find({
        _id: { $in: input.bookIds },
      }).lean();

      const availability = await getAvailability(input.bookIds);

      const results = input.bookIds.map((bookId) => {
        const book = books.find((item) => String(item._id) === String(bookId));

        if (!book) {
          throw new Error(`Book not found: ${bookId}`);
        }

        const stock = availability.get(String(bookId));

        if (!stock) {
          throw new Error(`Availability not found: ${bookId}`);
        }

        const copies = stock.new + stock.used;
        const pages = book.pageCount;

        return {
          bookId: String(book._id),
          title: book.title,
          pages,
          readingHours: book.readingHours ?? Number((pages / 40).toFixed(1)),
          copies,
          enoughCopies: copies >= input.groupSize,
        };
      });

      emitToolEvent(config, 'succeeded', `Checked real stock for ${results.length} books`);

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
    description: 'Check real book availability and estimate reading hours for the club group size.',
    schema: CheckStockAndLengthInput,
  },
);
