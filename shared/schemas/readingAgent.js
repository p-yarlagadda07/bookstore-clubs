import { z } from "zod";

export const ReadingAgentBody = z.object({
  clubId: z.string().min(1),
  request: z.string().min(3).max(300),
});

export const SearchCatalogInput = z.object({
  query: z.string().min(1),
  themes: z.array(z.string()).optional(),
  moods: z.array(z.string()).optional(),
  maxPages: z.number().int().positive().optional(),
});

export const CheckStockAndLengthInput = z.object({
  bookIds: z.array(z.string()).min(1).max(10),
  groupSize: z.number().int().min(1),
});

export const CompareClubConstraintsInput = z.object({
  clubId: z.string().min(1),
  books: z
    .array(
      z.object({
        bookId: z.string().min(1),
        pages: z.number().int().positive(),
      }),
    )
    .min(1),
});