import * as service from './service.js';

export async function set(req, res) {
  const progress = await service.setProgress(req.user, req.body);
  res.ok(progress);
}

export async function getOne(req, res) {
  const progress = await service.getMyProgress(req.user, req.params.bookId);
  res.ok(progress);
}