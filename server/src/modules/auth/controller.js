import * as service from './service.js';
import { generateToken } from '../../middleware/security.js';

export const csrf = (req, res) => res.ok({ token: generateToken(req, res) });

export async function login(req, res) {
  const user = await service.checkLogin(req.body.email, req.body.password);
  // new session id after login so an old one can't be reused
  await new Promise((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );
  req.session.userId = String(user._id);
  res.ok({ user });
}

export async function logout(req, res) {
  await new Promise((resolve) => req.session.destroy(() => resolve()));
  res.clearCookie('sid');
  res.ok(null);
}

export const me = (req, res) => res.ok({ user: req.user });