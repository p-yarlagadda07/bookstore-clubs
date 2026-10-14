
import Reservation from '../reservations/model.js';
import Inventory from '../inventory/model.js';
import Book from '../books/model.js';
import StockAlert from '../alerts/model.js';

export async function getShopFloor() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    activeHolds,
    pickupsToday,
    alertsWaiting,
    lowStockRows,
    soldOutRows,
    heldRows,
  ] = await Promise.all([
    Reservation.countDocuments({ status: 'held' }),

    Reservation.countDocuments({
      status: 'held',
      expiresAt: { $gte: startOfToday, $lt: endOfToday },
    }),

    StockAlert.countDocuments({ status: 'waiting' }),

    Inventory.find({
      status: 'active',
      available: { $lte: 1 },
    })
      .sort({ available: 1 })
      .limit(10)
      .populate('bookId', 'title')
      .lean(),

    Inventory.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$bookId',
          rowsWithStock: {
            $sum: {
              $cond: [{ $gt: ['$available', 0] }, 1, 0],
            },
          },
        },
      },
      { $match: { rowsWithStock: 0 } },
    ]),

    Reservation.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$bookId', holds: { $sum: 1 } } },
      { $sort: { holds: -1, _id: 1 } },
      { $limit: 5 },
    ]),
  ]);

  const mostHeldBooks = await Book.find({
    _id: { $in: heldRows.map((row) => row._id) },
  })
    .select('title')
    .lean();

  const titles = new Map(
    mostHeldBooks.map((book) => [String(book._id), book.title]),
  );

  return {
    activeHolds,
    pickupsToday,
    alertsWaiting,
    lowStock: lowStockRows.map((row) => ({
      inventoryId: row._id,
      bookId: row.bookId?._id ?? row.bookId,
      title: row.bookId?.title ?? '',
      condition: row.condition,
      available: row.available,
      total: row.total,
    })),
    soldOut: soldOutRows.length,
    mostHeld: heldRows.map((row) => ({
      bookId: row._id,
      title: titles.get(String(row._id)) ?? '',
      holds: row.holds,
    })),
  };
}
