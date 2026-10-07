import Book from "./model.js";
import Inventory from "../inventory/model.js";

async function list({
  page = 1,
  limit = 20,
  q,
  theme,
  mood,
  maxPages,
  available,
}) {
  const filter = {
    approvedSource: true,
  };

  if (q) {
    filter.$text = { $search: q };
  }

  if (theme) {
    filter.themes = theme;
  }

  if (mood) {
    filter.moods = mood;
  }

  if (maxPages) {
    filter.pageCount = { $lte: maxPages };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Book.find(filter)
      .select("-embedding")
      .skip(skip)
      .limit(limit)
      .lean(),

    Book.countDocuments(filter),
  ]);

  if (available !== undefined) {
    const bookIds = items.map((book) => book._id);

    const inventory = await Inventory.find({
      bookId: { $in: bookIds },
      available: { $gt: 0 },
      status: "active",
    }).lean();

    const availableIds = new Set(
      inventory.map((item) => item.bookId.toString())
    );

    return {
      items: items.filter((book) =>
        availableIds.has(book._id.toString())
      ),
      page,
      limit,
      total: availableIds.size,
    };
  }

  return {
    items,
    page,
    limit,
    total,
  };
}

async function get(id) {
  const book = await Book.findById(id)
    .select("-embedding")
    .lean();

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

  return query.select("-embedding").lean();
}

export {
  list,
  get,
  getMany,
};