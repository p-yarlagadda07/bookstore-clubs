import Inventory from './model.js';
import { notifyBackInStock } from '../alerts/service.js';
import Book from '../books/model.js';
import Reservation from '../reservations/model.js';

import { AppError } from '../../lib/AppError.js';
import { logAudit } from '../audit/service.js';

export async function getAvailability(bookIds) {
  const inventory = await Inventory.find({
    bookId: { $in: bookIds },
  }).lean();

  const availability = new Map();

  for (const item of inventory) {
    const bookId = String(item.bookId);

    if (!availability.has(bookId)) {
      availability.set(bookId, { new: 0, used: 0 });
    }

    const current = availability.get(bookId);

    if (item.status === 'active') {
      current[item.condition] += item.available;
    }
  }

  for (const bookId of bookIds) {
    const key = String(bookId);

    if (!availability.has(key)) {
      availability.set(key, { new: 0, used: 0 });
    }

    const current = availability.get(key);
    const reservable = current.new + current.used > 0;

    let label = 'Unavailable';

    if (current.new + current.used >= 3) {
      label = 'Available';
    } else if (current.new + current.used > 0) {
      label = 'Few left';
    }

    availability.set(key, { ...current, reservable, label });
  }

  return availability;
}

function toRow(row, book) {
  return {
    id: String(row._id),
    bookId: String(book?._id ?? row.bookId),
    title: book?.title ?? '',
    authors: book?.authors ?? [],
    condition: row.condition,
    total: row.total,
    available: row.available,
    held: row.held,
    status: row.status,
    pickupWindows: (row.pickupWindows ?? []).map((window) => ({
      id: String(window._id),
      start: window.start,
      end: window.end,
    })),
  };
}

export async function listStock({ q, page, limit }) {
  const filter = {};

  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const books = await Book.find({
      title: { $regex: safe, $options: 'i' },
    }).select('_id');

    filter.bookId = { $in: books.map((book) => book._id) };
  }

  const [rows, total] = await Promise.all([
    Inventory.find(filter)
      .populate('bookId', 'title authors')
      .sort({ _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Inventory.countDocuments(filter),
  ]);

  return {
    items: rows.map((row) => toRow(row, row.bookId)),
    page,
    limit,
    total,
  };
}

export async function adjustStock(user, id, { delta, status, reason }) {
  const row = await Inventory.findById(id);

  if (!row) {
    throw new AppError('NOT_FOUND', 404, 'Stock row not found');
  }

  const before = {
    total: row.total,
    available: row.available,
    held: row.held,
    status: row.status,
  };

  if (delta !== undefined) {
    const newTotal = row.total + delta;

    if (newTotal < row.held) {
      throw new AppError('VALIDATION_ERROR', 400, "Total can't be lower than copies on hold");
    }

    row.total = newTotal;
    row.available = newTotal - row.held;
  }

  if (status !== undefined) {
    row.status = status;
  }

  await row.save();

  if (row.available > 0) {
    await notifyBackInStock(row.bookId);
  }

  const after = {
    total: row.total,
    available: row.available,
    held: row.held,
    status: row.status,
  };

  await logAudit(
    user,
    'stock.adjust',
    { type: 'inventory', id: row._id },
    { before, after, reason },
  );

  const book = await Book.findById(row.bookId).select('title authors').lean();

  return toRow(row.toObject(), book);
}

export async function addPickupWindow(user, id, { start, end }) {
  const row = await Inventory.findById(id);

  if (!row) {
    throw new AppError('NOT_FOUND', 404, 'Stock row not found');
  }

  const window = { start: new Date(start), end: new Date(end) };

  row.pickupWindows.push(window);
  await row.save();

  await logAudit(
    user,
    'pickup.add',
    { type: 'inventory', id: row._id },
    { start: window.start, end: window.end },
  );

  const book = await Book.findById(row.bookId).select('title authors').lean();

  return toRow(row.toObject(), book);
}

export async function removePickupWindow(user, id, pickupWindowId) {
  const row = await Inventory.findById(id);

  if (!row) {
    throw new AppError('NOT_FOUND', 404, 'Stock row not found');
  }

  const window = row.pickupWindows.id(pickupWindowId);

  if (!window) {
    throw new AppError('NOT_FOUND', 404, 'Pickup window not found');
  }

  const reservation = await Reservation.exists({
    inventoryId: row._id,
    pickupWindowId: window._id,
    status: 'held',
  });

  if (reservation) {
    throw new AppError('CONFLICT', 409, 'Someone has a hold for this time');
  }

  window.deleteOne();
  await row.save();

  await logAudit(
    user,
    'pickup.remove',
    { type: 'inventory', id: row._id },
    { pickupWindowId: String(pickupWindowId) },
  );

  const book = await Book.findById(row.bookId).select('title authors').lean();

  return toRow(row.toObject(), book);
}
