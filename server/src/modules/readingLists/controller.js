import {
  createList,
  listMine,
  getList,
  updateList,
  addItem,
  removeItem,
  deleteList,
} from "./service.js";

export async function create(req, res) {
  const list = await createList(req.user, req.validatedBody);
  res.status(201).json({ item: list });
}

export async function list(req, res) {
  const items = await listMine(req.user);
  res.json({ items });
}

export async function get(req, res) {
  const item = await getList(req.user, req.validatedParams.id);
  res.json({ item });
}

export async function update(req, res) {
  const item = await updateList(
    req.user,
    req.validatedParams.id,
    req.validatedBody
  );
  res.json({ item });
}

export async function add(req, res) {
  const item = await addItem(
    req.user,
    req.validatedParams.id,
    req.validatedBody
  );
  res.status(201).json({ item });
}

export async function remove(req, res) {
  const item = await removeItem(
    req.user,
    req.validatedParams.id,
    req.validatedParams.bookId
  );
  res.json({ item });
}

export async function removeList(req, res) {
  await deleteList(req.user, req.validatedParams.id);
  res.status(204).send();
}