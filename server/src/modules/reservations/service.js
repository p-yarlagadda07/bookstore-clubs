import Inventory from '../inventory/model.js';
import Reservation from './model.js';
import AppError from '../../lib/AppError.js';

export async function reserve(user, bookId, { condition, pickupWindowId }) {
  const activeReservations = await Reservation.countDocuments({
    userId: user._id,
    status: 'held',
  });

  if (activeReservations >= 5) {
    throw new AppError(
      'LIMIT_REACHED',
      409,
      'You can have at most 5 active reservations'
    );
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
      $inc: {
        available: -1,
        held: 1,
      },
    },
    { new: true }
  );

  if (!inventory) {
    throw new AppError(
      'OUT_OF_STOCK',
      409,
      'Sorry, this copy was just taken'
    );
  }

  const pickupWindow = inventory.pickupWindows.id(pickupWindowId);

  if (!pickupWindow) {
    throw new AppError(
      'OUT_OF_STOCK',
      409,
      'Pickup window is not available'
    );
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