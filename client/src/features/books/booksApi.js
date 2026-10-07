import api from '../../api/client.js';
import { mockBooks } from './books.mock.js';

const USE_MOCK = true;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneBook(book) {
  return JSON.parse(JSON.stringify(book));
}

export async function listBooks({
  q = '',
  theme = '',
  mood = '',
  maxPages = '',
  available = false,
  page = 1,
  limit = 6,
} = {}) {
  if (!USE_MOCK) {
    const response = await api.get('/books', {
      params: {
        q,
        theme,
        mood,
        maxPages,
        available,
        page,
        limit,
      },
    });

    return response;
  }

  await delay(300);

  const search = q.trim().toLowerCase();

  let filtered = mockBooks.filter((book) => {
    const matchesSearch =
      !search ||
      book.title.toLowerCase().includes(search) ||
      book.authors.some((author) =>
        author.toLowerCase().includes(search)
      );

    const matchesTheme =
      !theme || book.themes.includes(theme);

    const matchesMood =
      !mood || book.moods.includes(mood);

    const matchesMaxPages =
      !maxPages || book.pageCount <= Number(maxPages);

    const matchesAvailable =
      !available ||
      (book.availability.reservable &&
        (book.availability.new > 0 ||
          book.availability.used > 0));

    return (
      matchesSearch &&
      matchesTheme &&
      matchesMood &&
      matchesMaxPages &&
      matchesAvailable
    );
  });

  const total = filtered.length;
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit);

  filtered = filtered.slice(start, end);

  return {
    books: filtered.map(cloneBook),
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.max(
      1,
      Math.ceil(total / Number(limit))
    ),
  };
}

export async function getBook(id) {
  if (!USE_MOCK) {
    return api.get(`/books/${id}`);
  }

  await delay(300);

  const book = mockBooks.find((item) => item.id === id);

  if (!book) {
    const error = new Error('Book not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  return cloneBook(book);
}

export async function reserveBook(
  id,
  { condition, pickupWindowId }
) {
  if (!USE_MOCK) {
    return api.post(`/books/${id}/reserve`, {
      condition,
      pickupWindowId,
    });
  }

  await delay(300);

  const book = mockBooks.find((item) => item.id === id);

  if (!book) {
    const error = new Error('Book not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const inventory = book.inventory.find(
    (item) => item.condition === condition
  );

  if (!inventory || inventory.available <= 0) {
    const error = new Error(
      'This copy is no longer available.'
    );
    error.code = 'OUT_OF_STOCK';
    error.status = 409;
    throw error;
  }

  const pickupWindow = inventory.pickupWindows.find(
    (window) => window._id === pickupWindowId
  );

  if (!pickupWindow) {
    const error = new Error('Pickup window not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  inventory.available -= 1;
  inventory.held += 1;

  if (condition === 'new') {
    book.availability.new -= 1;
  } else {
    book.availability.used -= 1;
  }

  const remainingCopies =
    book.availability.new + book.availability.used;

  if (remainingCopies === 0) {
    book.availability.label = 'Unavailable';
    book.availability.reservable = false;
  } else if (remainingCopies === 1) {
    book.availability.label = 'Few left';
  }

  return {
    _id: `reservation-${Date.now()}`,
    status: 'held',
    bookId: id,
    condition,
    pickupWindowId,
  };
}