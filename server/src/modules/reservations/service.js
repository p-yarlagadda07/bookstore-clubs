import Inventory from '../inventory/model.js';
import Reservation from './model.js';
import { AppError } from '../../lib/AppError.js';

export async function reserve(user, bookId, { condition, pickupWindowId }) {
  const activeReservations = await Reservation.countDocuments({
    userId: user._id,
    status: 'held',
  });

  if (activeReservations >= 5) {
    throw new AppError('LIMIT_REACHED', 409, 'You can have at most 5 active reservations');
  }

  const inventory = await Inventory.findOneAndUpdate(
    {
      bookId,
      condition,
      status: 'active',
      available: { $gt: 0 },
      'pickupWindows._id': pickupWindowId,
    },
    {
      $inc: { available: -1, held: 1 },
    },
    { new: true },
  );

  if (!inventory) {
    throw new AppError('OUT_OF_STOCK', 409, 'Sorry, this copy was just taken');
  }

  const pickupWindow = inventory.pickupWindows.id(pickupWindowId);

  if (!pickupWindow) {
    throw new AppError('OUT_OF_STOCK', 409, 'Pickup window is not available');
  }

  return Reservation.create({
    userId: user._id,
    bookId,
    inventoryId: inventory._id,
    condition,
    pickupWindowId,
    status: 'held',
    expiresAt: pickupWindow.end,
  });
}

export async function getMyReservations(user) {
  const rows = await Reservation.find({ userId: user._id })
    .populate('bookId', 'title')
    .sort({ createdAt: -1 })
    .lean();

  const inventories = await Inventory.find({ _id: { $in: rows.map((r) => r.inventoryId) } })
    .select('pickupWindows')
    .lean();
  const windows = new Map();
  for (const inv of inventories) {
    for (const w of inv.pickupWindows ?? []) windows.set(String(w._id), w);
  }

  return {
    items: rows.map((r) => {
      const w = windows.get(String(r.pickupWindowId));
      return {
        id: r._id,
        bookId: r.bookId?._id ?? r.bookId,
        title: r.bookId?.title ?? '',
        condition: r.condition,
        status: r.status,
        pickupWindow: w ? { start: w.start, end: w.end } : null,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      };
    }),
  };
}

export async function cancelReservation(user, reservationId) {
  const reservation = await Reservation.findOneAndUpdate(
    {
      _id: reservationId,
      userId: user._id,
      status: 'held',
    },
    { $set: { status: 'cancelled' } },
    { new: true },
  );

  if (!reservation) {
    const existing = await Reservation.findOne({
      _id: reservationId,
      userId: user._id,
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 404, 'Reservation not found');
    }

    throw new AppError(
      'RESERVATION_NOT_HELD',
      409,
      'Only held reservations can be cancelled',
    );
  }

  const inventory = await Inventory.findOneAndUpdate(
    {
      _id: reservation.inventoryId,
      held: { $gt: 0 },
    },
    { $inc: { available: 1, held: -1 } },
    { new: true },
  );

  if (!inventory) {
    await Reservation.updateOne(
      { _id: reservation._id, status: 'cancelled' },
      { $set: { status: 'held' } },
    );

    throw new AppError(
      'INVENTORY_CONFLICT',
      409,
      'Inventory could not be restored',
    );
  }

  return reservation;
}
