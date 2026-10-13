import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { AppError } from '../../lib/AppError.js';
import { validate } from '../../middleware/validate.js';
import { IdParams } from '@bookstore/shared';
import { DiscoverQuery, SimilarQuery } from '@bookstore/shared/schemas/discovery';
import { getAvailability } from '../../modules/inventory/service.js';
import { vectorSearchBooks, similarBooks } from './service.js';

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

router.get(
  '/books/:id/similar',
  validate({ params: IdParams, query: SimilarQuery }),
  asyncHandler(async (req, res) => {
    const rows = await similarBooks(req.params.id, req.validatedQuery.limit);
    if (rows === null) throw new AppError('NOT_FOUND', 404, 'Book not found');

    const availability = await getAvailability(rows.map((r) => r._id));

    const items = rows.map((r) => ({
      id: String(r._id),
      title: r.title,
      authors: r.authors,
      themes: r.themes,
      moods: r.moods,
      pageCount: r.pageCount,
      score: r.score,
      availability: availability.get(String(r._id)),
    }));

    res.ok({ items });
  }),
);

export default router;
