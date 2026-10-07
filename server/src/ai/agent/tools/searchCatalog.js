import { tool } from "@langchain/core/tools";

import { SearchCatalogInput } from "../../../../shared/schemas/readingAgent.js";
import { fakeBooks } from "./fakeData.js";

const emitToolEvent = (config, status, summary) => {
  const context = config?.context ?? config;

  if (typeof context?.emit === "function") {
    context.emit({
      name: "searchCatalog",
      status,
      summary,
    });
  }
};

export const searchCatalog = tool(
  async (input, config) => {
    emitToolEvent(config, "started", "Searching the fake catalog");

    try {
      const query = input.query.toLowerCase().trim();
      const themes = (input.themes ?? []).map((theme) =>
        theme.toLowerCase(),
      );
      const moods = (input.moods ?? []).map((mood) =>
        mood.toLowerCase(),
      );

      const results = fakeBooks
        .filter((book) => {
          if (
            input.maxPages !== undefined &&
            book.pages > input.maxPages
          ) {
            return false;
          }

          const searchableText = [
            book.title,
            ...book.themes,
            ...book.moods,
            ...book.authors,
          ]
            .join(" ")
            .toLowerCase();

          const queryMatches =
            !query || searchableText.includes(query);

          const themeMatches =
            themes.length === 0 ||
            themes.some((theme) => book.themes.includes(theme));

          const moodMatches =
            moods.length === 0 ||
            moods.some((mood) => book.moods.includes(mood));

          return queryMatches && themeMatches && moodMatches;
        })
        .map((book) => {
          let score = 0;

          const searchableText = [
            book.title,
            ...book.themes,
            ...book.moods,
            ...book.authors,
          ]
            .join(" ")
            .toLowerCase();

          if (query && searchableText.includes(query)) {
            score += 1;
          }

          score += themes.filter((theme) =>
            book.themes.includes(theme),
          ).length;

          score += moods.filter((mood) =>
            book.moods.includes(mood),
          ).length;

          return {
            bookId: book.bookId,
            title: book.title,
            authors: book.authors,
            themes: book.themes,
            pages: book.pages,
            score,
            why: `Matches the requested query and available book metadata.`,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      emitToolEvent(
        config,
        "succeeded",
        `Found ${results.length} matching books`,
      );

      return results;
    } catch (error) {
      emitToolEvent(
        config,
        "failed",
        error instanceof Error ? error.message : "Catalog search failed",
      );

      throw error;
    }
  },
  {
    name: "searchCatalog",
    description:
      "Search the bookstore catalog for books matching the club's request, themes, moods, and page limit.",
    schema: SearchCatalogInput,
  },
);