import { AppError } from '../../lib/AppError.js';
import * as service from './service.js';

export async function list(req, res) {
  res.ok(await service.list(req.validatedQuery));
}

export async function get(req, res) {
  const book = await service.get(req.params.id);
  if (!book) throw new AppError('NOT_FOUND', 404, 'Book not found');
  res.ok(book);
}
