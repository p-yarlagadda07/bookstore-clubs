import api from '../../api/client.js';

export async function listBooks({
  q = '',
  theme = '',
  mood = '',
  maxPages = '',
  available = false,
  page = 1,
  limit = 6,
} = {}) {
  const params = { page, limit };

  if (q.trim()) params.q = q.trim();
  if (theme) params.theme = theme;
  if (mood) params.mood = mood;
  if (maxPages) params.maxPages = maxPages;
  if (available) params.available = true;

  const res = await api.get('/books', { params });

  return {
    ...res,
    books: res.items ?? [],
    totalPages: Math.max(1, Math.ceil(res.total / res.limit)),
  };
}

export function getBook(id) {
  return api.get(`/books/${id}`);
}

export function reserveBook(id, { condition, pickupWindowId }) {
  return api.post(`/books/${id}/reservations`, { condition, pickupWindowId });
}
