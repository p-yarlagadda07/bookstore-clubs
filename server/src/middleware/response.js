export function responseHelpers(_req, res, next) {
  res.ok = (data = null, status = 200) => res.status(status).json({ ok: true, data });
  next();
}
