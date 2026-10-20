import Book from './model.js';
import Inventory from '../inventory/model.js';
import { getAvailability } from '../inventory/service.js';
import { logAudit } from '../audit/service.js';
import { isOllamaUp } from '../../ai/ollama.js';
import { embedBook } from '../../ai/embeddings/books.js';
import { logger } from '../../lib/logger.js';

function exactIgnoringCase(value) {
  const safe = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${safe}$`, 'i');
}

async function list({ page = 1, limit = 20, q, theme, mood, maxPages, available }) {
  const filter = { approvedSource: true };

  if (q) filter.$text = { $search: q };
  // the filter lists use capitals, the data is lowercase
  if (theme) filter.themes = exactIgnoringCase(theme);
  if (mood) filter.moods = exactIgnoringCase(mood);
  if (maxPages) filter.pageCount = { $lte: maxPages };

  // "available only" has to be filtered before paging, otherwise pages come out short
  if (available) {
    const ids = await Inventory.distinct('bookId', { available: { $gt: 0 }, status: 'active' });
    filter._id = { $in: ids };
  }

  const [items, total] = await Promise.all([
    Book.find(filter)
      .select('-embedding')
      .sort({ title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Book.countDocuments(filter),
  ]);

  const availability = await getAvailability(items.map((b) => b._id));
  const withAvailability = items.map((b) => ({
    ...b,
    availability: availability.get(String(b._id)),
  }));

  return { items: withAvailability, page, limit, total };
}

async function get(id) {
  const book = await Book.findOne({ _id: id, approvedSource: true }).select('-embedding').lean();

  if (!book) {
    return null;
  }

  const inventory = await Inventory.find({
    bookId: id,
  }).lean();

  const availability = await getAvailability([book._id]);

  return {
    ...book,
    inventory,
    availability: availability.get(String(book._id)),
  };
}

async function getMany(ids, fields) {
  let query = Book.find({
    _id: { $in: ids },
  });

  if (fields) {
    query = query.select(fields);
  }

  return query.select('-embedding').lean();
}

// runs after the response is sent, the book is saved either way
async function refreshEmbedding(id) {
  try {
    if (await isOllamaUp()) await embedBook(id);
  } catch (err) {
    logger.warn({ err, bookId: String(id) }, 'could not embed book');
  }
}

async function create(user, data) {
  const book = await Book.create({ ...data, approvedSource: true });

  // empty new and used rows so the book shows up in the Stockroom straight away
  await Inventory.insertMany([
    { bookId: book._id, condition: 'new' },
    { bookId: book._id, condition: 'used' },
  ]);

  await logAudit(user, 'book.create', { type: 'book', id: book._id }, { title: book.title });
  refreshEmbedding(book._id);

  return get(book._id);
}

async function update(user, id, changes) {
  const before = await Book.findOne({ _id: id, approvedSource: true }).select('-embedding').lean();
  if (!before) return null;

  await Book.updateOne({ _id: id }, { $set: changes });

  const old = Object.fromEntries(Object.keys(changes).map((k) => [k, before[k]]));
  await logAudit(user, 'book.update', { type: 'book', id }, { before: old, after: changes });

  const textChanged = ['title', 'synopsis', 'themes', 'moods'].some((k) => k in changes);
  if (textChanged) refreshEmbedding(id);

  return get(id);
}

export { list, get, getMany, create, update };
