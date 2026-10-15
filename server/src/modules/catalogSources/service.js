import CatalogSource from './model.js';
import Book from '../books/model.js';
import { AppError } from '../../lib/AppError.js';
import { logAudit } from '../audit/service.js';

const toItem = (s, bookCount) => ({
  id: String(s._id),
  name: s.name,
  type: s.type,
  license: s.license,
  permission: s.permission,
  bookCount,
});

export async function listSources() {
  const sources = await CatalogSource.find().sort({ name: 1 });
  return Promise.all(
    sources.map(async (s) => toItem(s, await Book.countDocuments({ sourceId: s._id }))),
  );
}

export async function setPermission(user, id, permission) {
  const source = await CatalogSource.findById(id);
  if (!source) throw new AppError('NOT_FOUND', 404, 'Source not found');

  const before = source.permission;
  source.permission = permission;
  await source.save();

  await Book.updateMany(
    { sourceId: source._id },
    { $set: { approvedSource: permission === 'approved' } },
  );

  await logAudit(user, 'source.permission', { type: 'source', id }, { before, after: permission });

  return toItem(source, await Book.countDocuments({ sourceId: source._id }));
}
