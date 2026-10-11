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

export async function create(req, res) {
  res.ok(await service.create(req.user, req.body), 201);
}

export async function update(req, res) {
  const book = await service.update(req.user, req.params.id, req.body);
  if (!book) throw new AppError('NOT_FOUND', 404, 'Book not found');
  res.ok(book);
}
