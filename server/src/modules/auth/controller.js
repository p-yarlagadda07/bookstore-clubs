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

export async function signup(req, res) {
  const user = await service.signup(req.body);
  res.ok({ user }, 201);
}

export async function verify(req, res) {
  const user = await service.verifyEmail(req.validatedQuery.token);
  res.ok({ user });
}

export async function forgot(req, res) {
  await service.requestReset(req.body.email);
  res.ok({ sent: true });
}

export async function reset(req, res) {
  await service.resetPassword(req.body.token, req.body.password);
  res.ok({ reset: true });
}