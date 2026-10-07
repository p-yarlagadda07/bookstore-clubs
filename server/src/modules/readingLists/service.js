import { ReadingList } from './model.js';
import { AppError } from '../../lib/AppError.js';

export async function createList(user, data) {
  return ReadingList.create({
    ownerId: user._id,
    name: data.name,
  });
}

export async function listMine(user) {
  return ReadingList.find({
    ownerId: user._id,
  })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getList(user, id) {
  const list = await ReadingList.findOne({
    _id: id,
    ownerId: user._id,
  }).lean();

  if (!list) {
    throw new AppError('NOT_FOUND', 404, 'Reading list not found');
  }

  return list;
}

export async function updateList(user, id, data) {
  const list = await ReadingList.findOneAndUpdate(
    {
      _id: id,
      ownerId: user._id,
    },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!list) {
    throw new AppError('NOT_FOUND', 404, 'Reading list not found');
  }

  return list;
}

export async function addItem(user, id, data) {
  const list = await ReadingList.findOne({
    _id: id,
    ownerId: user._id,
  });

  if (!list) {
    throw new AppError('NOT_FOUND', 404, 'Reading list not found');
  }

  const alreadyExists = list.items.some((item) => item.bookId.toString() === data.bookId);

  if (alreadyExists) {
    throw new AppError('CONFLICT', 409, 'Book is already in this reading list');
  }

  list.items.push({
    bookId: data.bookId,
    note: data.note,
  });

  await list.save();

  return list;
}

export async function removeItem(user, id, bookId) {
  const list = await ReadingList.findOne({
    _id: id,
    ownerId: user._id,
  });

  if (!list) {
    throw new AppError('NOT_FOUND', 404, 'Reading list not found');
  }

  list.items = list.items.filter((item) => item.bookId.toString() !== bookId);

  await list.save();

  return list;
}

export async function deleteList(user, id) {
  const list = await ReadingList.findOneAndDelete({
    _id: id,
    ownerId: user._id,
  });

  if (!list) {
    throw new AppError('NOT_FOUND', 404, 'Reading list not found');
  }

  return list;
}
