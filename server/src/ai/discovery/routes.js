import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { DiscoverQuery } from '@bookstore/shared/schemas/discovery';
import { getAvailability } from '../../modules/inventory/service.js';
import { vectorSearchBooks } from './service.js';

const router = Router();

router.get(
  '/books/discover',
  validate({ query: DiscoverQuery }),
  asyncHandler(async (req, res) => {
    const { q, limit } = req.validatedQuery;
    const rows = await vectorSearchBooks(q, limit);
    const availability = await getAvailability(rows.map((r) => r._id));

    const items = rows.map((r) => ({
      id: String(r._id),
      title: r.title,
      authors: r.authors,
      themes: r.themes,
      moods: r.moods,
      pageCount: r.pageCount,
      synopsis: r.synopsis,
      score: r.score,
      availability: availability.get(String(r._id)),
    }));

    res.ok({ items });
  }),
);

export default router;
