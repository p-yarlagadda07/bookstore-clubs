import { User } from '../users/model.js';

const DEFAULT_PREFERENCES = {
  genres: [],
  moods: [],
  maxPages: null,
  spoilerStrict: false,
  bookmarkVisibility: 'club',
};

export async function getPreferences(userId) {
  const user = await User.findById(userId);

  if (!user) {
    return null;
  }

  return {
    genres: user.preferences?.genres ?? [],
    moods: user.preferences?.moods ?? [],
    maxPages: user.preferences?.maxPages ?? null,
    spoilerStrict: user.spoilerSettings?.strict ?? false,
    bookmarkVisibility:
      user.preferences?.bookmarkVisibility ?? DEFAULT_PREFERENCES.bookmarkVisibility,
  };
}

export async function updatePreferences(userId, updates) {
  const user = await User.findById(userId);

  if (!user) {
    return null;
  }

  if (Object.hasOwn(updates, 'genres')) {
    user.preferences.genres = updates.genres;
  }

  if (Object.hasOwn(updates, 'moods')) {
    user.preferences.moods = updates.moods;
  }

  if (Object.hasOwn(updates, 'maxPages')) {
    user.preferences.maxPages = updates.maxPages;
  }

  if (Object.hasOwn(updates, 'spoilerStrict')) {
    user.spoilerSettings.strict = updates.spoilerStrict;
  }

  if (Object.hasOwn(updates, 'bookmarkVisibility')) {
    user.preferences.bookmarkVisibility = updates.bookmarkVisibility;
  }

  await user.save();

  return getPreferences(userId);
}
