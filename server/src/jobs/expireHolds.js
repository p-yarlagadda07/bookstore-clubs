
import Reservation from '../modules/reservations/model.js';
import Inventory from '../modules/inventory/model.js';
import { logger } from '../lib/logger.js';

export async function expireHolds(now = new Date()) {
  const expiredCandidates = await Reservation.find({
    status: 'held',
    expiresAt: { $lt: now },
  })
    .select('_id inventoryId')
    .lean();

  let count = 0;

  for (const candidate of expiredCandidates) {
    const reservation = await Reservation.findOneAndUpdate(
      { _id: candidate._id, status: 'held' },
      { $set: { status: 'expired' } },
      { new: true },
    );

    // Another operation may have changed the reservation already.
    if (!reservation) continue;

    const inventory = await Inventory.findOneAndUpdate(
      { _id: reservation.inventoryId, held: { $gt: 0 } },
      { $inc: { held: -1, available: 1 } },
      { new: true },
    );

    if (!inventory) {
      // Restore the reservation state if inventory cannot be restored.
      await Reservation.updateOne(
        { _id: reservation._id, status: 'expired' },
        { $set: { status: 'held' } },
      );

      logger.error(
        { reservationId: reservation._id },
        'Could not restore inventory for expired reservation',
      );
      continue;
    }

    count += 1;
  }

  return count;
}

export function startExpireJob() {
  return setInterval(async () => {
    try {
      await expireHolds();
    } catch (err) {
      logger.error({ err }, 'Reservation expiry job failed');
    }
  }, 60_000);
}
