
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { User } from '../users/model.js';

const router = Router();

const PreferencesPatch = z
  .object({
    genres: z.array(z.string()).optional(),
    moods: z.array(z.string()).optional(),
    maxPages: z.number().int().positive().nullable().optional(),
    spoilerStrict: z.boolean().optional(),
    bookmarkVisibility: z.enum(['private', 'club', 'public']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one preference to update',
  });

function formatPreferences(user) {
  return {
    genres: user.preferences?.genres ?? [],
    moods: user.preferences?.moods ?? [],
    maxPages: user.preferences?.maxPages ?? null,
    spoilerStrict: user.spoilerSettings?.strict ?? false,
    bookmarkVisibility: user.preferences?.bookmarkVisibility ?? 'private',
  };
}

router.get(
  '/users/me/preferences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.ok(formatPreferences(user));
  }),
);

router.patch(
  '/users/me/preferences',
  requireAuth,
  validate({ body: PreferencesPatch }),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.userId);

    if (req.body.genres !== undefined) {
      user.preferences.genres = req.body.genres;
    }

    if (req.body.moods !== undefined) {
      user.preferences.moods = req.body.moods;
    }

    if (req.body.maxPages !== undefined) {
      user.preferences.maxPages = req.body.maxPages;
    }

    if (req.body.spoilerStrict !== undefined) {
      user.spoilerSettings.strict = req.body.spoilerStrict;
    }

    if (req.body.bookmarkVisibility !== undefined) {
      user.preferences.bookmarkVisibility = req.body.bookmarkVisibility;
    }

    await user.save();
    res.ok(formatPreferences(user));
  }),
);

export default router;
