// Adds res.ok(data, status) so every success response has the same shape: { ok: true, data }
export function responseHelpers(_req, res, next) {
  res.ok = (data = null, status = 200) => res.status(status).json({ ok: true, data });
  next();
}
