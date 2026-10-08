import * as service from './service.js';

export async function set(req, res) {
  res.ok(await service.setProgress(req.user, req.body));
}

export async function listMine(req, res) {
  res.ok({ items: await service.listMyProgress(req.user) });
}

export async function getOne(req, res) {
  res.ok(await service.getMyProgress(req.user, req.params.bookId));
}
