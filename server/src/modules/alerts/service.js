
import StockAlert from './model.js';
import Book from '../books/model.js';
import Inventory from '../inventory/model.js';
import { User } from '../users/model.js';
import { AppError } from '../../lib/AppError.js';
import { logger } from '../../lib/logger.js';

function toAlert(alert, title = '') {
  return {
    id: String(alert._id),
    bookId: String(alert.bookId),
    title,
    status: alert.status,
    createdAt: alert.createdAt,
    sentAt: alert.sentAt,
  };
}

export async function createAlert(user, bookId) {
  const book = await Book.findOne({
    _id: bookId,
    approvedSource: true,
  }).select('title');

  if (!book) {
    throw new AppError('NOT_FOUND', 404, 'Book not found');
  }

  const stock = await Inventory.exists({
    bookId,
    status: 'active',
    available: { $gt: 0 },
  });

  if (stock) {
    throw new AppError(
      'IN_STOCK',
      409,
      'This book is on the shelf right now',
    );
  }

  const existing = await StockAlert.findOne({
    userId: user._id,
    bookId,
    status: 'waiting',
  });

  if (existing) {
    return { alert: toAlert(existing, book.title), created: false };
  }

  const alert = await StockAlert.create({
    userId: user._id,
    bookId,
    status: 'waiting',
  });

  return { alert: toAlert(alert, book.title), created: true };
}

export async function listMine(user) {
  const alerts = await StockAlert.find({ userId: user._id })
    .populate('bookId', 'title')
    .sort({ createdAt: -1 })
    .lean();

  return {
    items: alerts.map((alert) =>
      toAlert(alert, alert.bookId?.title ?? ''),
    ),
  };
}

export async function deleteAlert(user, id) {
  const alert = await StockAlert.findOneAndDelete({
    _id: id,
    userId: user._id,
  });

  if (!alert) {
    throw new AppError('NOT_FOUND', 404, 'Alert not found');
  }

  return { message: 'Alert deleted' };
}

export async function notifyBackInStock(bookId) {
  try {
    const alerts = await StockAlert.find({
      bookId,
      status: 'waiting',
    }).populate('bookId', 'title');

    for (const alert of alerts) {
      try {
        const user = await User.findById(alert.userId).select('email');

        if (user) {
          const title = alert.bookId?.title ?? 'Unknown book';
          logger.info(
            { userId: String(user._id), bookId: String(bookId) },
            `Back in stock: ${title} for ${user.email}`,
          );
          console.log(`Back in stock: ${title} for ${user.email}`);
        }

        alert.status = 'sent';
        alert.sentAt = new Date();
        await alert.save();
      } catch (err) {
        logger.warn(
          { err, alertId: String(alert._id) },
          'Could not process stock alert',
        );
      }
    }
  } catch (err) {
    logger.warn({ err, bookId: String(bookId) }, 'Could not notify stock alerts');
  }
}
