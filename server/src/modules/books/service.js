import Book from './model.js';
import Inventory from '../inventory/model.js';

async function list({ page = 1, limit = 20, q, theme, mood, maxPages, available }) {
  const filter = { approvedSource: true };

  if (q) filter.$text = { $search: q };
  if (theme) filter.themes = theme;
  if (mood) filter.moods = mood;
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

  return { items, page, limit, total };
}

async function get(id) {
  const book = await Book.findOne({ _id: id, approvedSource: true }).select('-embedding').lean();

  if (!book) {
    return null;
  }

  const inventory = await Inventory.find({
    bookId: id,
  }).lean();

  return {
    ...book,
    inventory,
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

export { list, get, getMany };
