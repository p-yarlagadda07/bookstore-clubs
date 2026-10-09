import { tool } from '@langchain/core/tools';

import { SearchCatalogInput } from '@bookstore/shared/schemas/readingAgent';
import Book from '../../../modules/books/model.js';

const emitToolEvent = (config, status, summary) => {
  const context = config?.context ?? config;

  if (typeof context?.emit === 'function') {
    context.emit({
      name: 'searchCatalog',
      status,
      summary,
    });
  }
};

export const searchCatalog = tool(
  async (input, config) => {
    emitToolEvent(config, 'started', 'Searching the real catalog');

    try {
      const words = input.query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 3);

      const themes = (input.themes ?? []).map((theme) => theme.toLowerCase());
      const moods = (input.moods ?? []).map((mood) => mood.toLowerCase());

      const books = await Book.find({ approvedSource: true }).lean();

      const results = books
        .filter((book) => input.maxPages === undefined || book.pageCount <= input.maxPages)
        .map((book) => {
          const bookThemes = (book.themes ?? []).map((theme) => theme.toLowerCase());
          const bookMoods = (book.moods ?? []).map((mood) => mood.toLowerCase());

          const text = [book.title, ...bookThemes, ...bookMoods, book.synopsis ?? '']
            .join(' ')
            .toLowerCase();

          const matchedWords = words.filter((word) => text.includes(word));
          const matchedThemes = themes.filter((theme) => bookThemes.includes(theme));
          const matchedMoods = moods.filter((mood) => bookMoods.includes(mood));

          const matched = [...new Set([...matchedWords, ...matchedThemes, ...matchedMoods])];

          return {
            bookId: String(book._id),
            title: book.title,
            authors: book.authors,
            themes: book.themes,
            pages: book.pageCount,
            score: matchedWords.length + matchedThemes.length + matchedMoods.length,
            why: matched.length ? `Matches: ${matched.join(', ')}` : '',
          };
        })
        .filter((book) => book.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      emitToolEvent(config, 'succeeded', `Found ${results.length} matching books`);

      return results;
    } catch (error) {
      emitToolEvent(
        config,
        'failed',
        error instanceof Error ? error.message : 'Catalog search failed',
      );

      throw error;
    }
  },
  {
    name: 'searchCatalog',
    description:
      "Search approved bookstore books for titles matching the club's request, themes, and moods.",
    schema: SearchCatalogInput,
  },
);
