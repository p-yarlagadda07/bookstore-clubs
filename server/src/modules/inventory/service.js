import Inventory from './model.js';

export async function getAvailability(bookIds) {
  const inventory = await Inventory.find({
    bookId: { $in: bookIds },
  }).lean();

  const availability = new Map();

  for (const item of inventory) {
    const bookId = String(item.bookId);

    if (!availability.has(bookId)) {
      availability.set(bookId, {
        new: 0,
        used: 0,
      });
    }

    const current = availability.get(bookId);

    if (item.status === 'active') {
      current[item.condition] += item.available;
    }
  }

  for (const bookId of bookIds) {
    const key = String(bookId);

    if (!availability.has(key)) {
      availability.set(key, {
        new: 0,
        used: 0,
      });
    }

    const current = availability.get(key);
    const reservable = current.new + current.used > 0;

    let label = 'Unavailable';

    if (current.new + current.used >= 3) {
      label = 'Available';
    } else if (current.new + current.used > 0) {
      label = 'Few left';
    }

    availability.set(key, {
      ...current,
      reservable,
      label,
    });
  }

  return availability;
}