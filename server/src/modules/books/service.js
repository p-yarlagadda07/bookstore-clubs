import Book from "./model.js";
import Inventory from "../inventory/model.js";
import { getAvailability } from "../inventory/service.js";

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

  const bookIds = items.map((book) => book._id);
  const availability = await getAvailability(bookIds);

  const itemsWithAvailability = items.map((book) => ({
    ...book,
    availability: availability.get(book._id.toString()),
  }));

  if (available !== undefined) {
    const inventory = await Inventory.find({
      bookId: { $in: bookIds },
      available: { $gt: 0 },
      status: "active",
    }).lean();

    const availableIds = new Set(
      inventory.map((item) => item.bookId.toString())
    );

    return {
      items: itemsWithAvailability.filter((book) =>
        availableIds.has(book._id.toString())
      ),
      page,
      limit,
      total: availableIds.size,
    };
  }

  return {
    items: itemsWithAvailability,
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

  const availability = await getAvailability([id]);

  return {
    ...book,
    inventory,
    availability: availability.get(id.toString()),
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