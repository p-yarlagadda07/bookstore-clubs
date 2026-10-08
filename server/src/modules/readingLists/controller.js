import {
  createList,
  listMine,
  getList,
  updateList,
  addItem,
  removeItem,
  deleteList,
} from './service.js';

export async function list(req, res) {
  res.ok({ items: await listMine(req.user) });
}

export async function create(req, res) {
  res.ok(await createList(req.user, req.body), 201);
}

export async function get(req, res) {
  res.ok(await getList(req.user, req.params.id));
}

export async function update(req, res) {
  res.ok(await updateList(req.user, req.params.id, req.body));
}

export async function removeList(req, res) {
  await deleteList(req.user, req.params.id);
  res.ok({});
}

export async function add(req, res) {
  res.ok(await addItem(req.user, req.params.id, req.body), 201);
}

export async function remove(req, res) {
  res.ok(await removeItem(req.user, req.params.id, req.params.bookId));
}
