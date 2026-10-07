import { tool } from '@langchain/core/tools';

import { SearchCatalogInput } from '@bookstore/shared/schemas/readingAgent';
import { fakeBooks } from './fakeData.js';

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
    emitToolEvent(config, 'started', 'Searching the fake catalog');

    try {
      const words = input.query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2);
      const themes = (input.themes ?? []).map((theme) => theme.toLowerCase());
      const moods = (input.moods ?? []).map((mood) => mood.toLowerCase());

      const results = fakeBooks
        .filter((book) => input.maxPages === undefined || book.pages <= input.maxPages)
        .map((book) => {
          const text = [book.title, ...book.themes, ...book.moods, ...book.authors]
            .join(' ')
            .toLowerCase();
          const matchedWords = words.filter((word) => text.includes(word));
          const matchedThemes = themes.filter((theme) => book.themes.includes(theme));
          const matchedMoods = moods.filter((mood) => book.moods.includes(mood));
          const matched = [...new Set([...matchedWords, ...matchedThemes, ...matchedMoods])];

          return {
            bookId: book.bookId,
            title: book.title,
            authors: book.authors,
            themes: book.themes,
            pages: book.pages,
            score: matched.length,
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
      "Search the bookstore catalog for books matching the club's request, themes, moods, and page limit.",
    schema: SearchCatalogInput,
  },
);
