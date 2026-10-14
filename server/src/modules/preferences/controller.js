import { getPreferences, updatePreferences } from './service.js';

export async function get(req, res) {
  const preferences = await getPreferences(req.user._id);

  if (!preferences) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.ok(preferences);
}

export async function update(req, res) {
  const preferences = await updatePreferences(req.user._id, req.body);

  if (!preferences) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.ok(preferences);
}
