import argon2 from 'argon2';
import { User } from '../users/model.js';
import { AppError } from '../../lib/AppError.js';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
// same error for wrong email and wrong password, so nobody can tell which emails exist
export async function checkLogin(email, password) {
  const user = await User.findOne({ email });
  const ok = user && (await argon2.verify(user.passwordHash, password).catch(() => false));
  if (!ok) throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
  return user;
}
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export async function signup({ name, email, password }) {
  if (await User.exists({ email })) {
    throw new AppError('EMAIL_TAKEN', 409, 'An account with this email already exists');
  }

  // only the hash goes in the db, the real token is only in the link
  const token = crypto.randomBytes(32).toString('hex');
  let user;
  try {
    user = await User.create({
      name,
      email,
      passwordHash: await argon2.hash(password),
      roles: ['reader'],
      emailVerifiedAt: null,
      verifyTokenHash: sha256(token),
      verifyTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('EMAIL_TAKEN', 409, 'An account with this email already exists');
    }
    throw err;
  }

  console.log(`Verify link: ${env.CLIENT_ORIGIN}/verify?token=${token}`);
  return user;
}

export async function verifyEmail(token) {
  // token fields are removed in the same update, so a link only works once
  const user = await User.findOneAndUpdate(
    { verifyTokenHash: sha256(token), verifyTokenExpires: { $gt: new Date() } },
    {
      $set: { emailVerifiedAt: new Date() },
      $unset: { verifyTokenHash: 1, verifyTokenExpires: 1 },
    },
    { new: true },
  );
  if (!user) throw new AppError('TOKEN_INVALID', 400, 'This link is invalid or has expired');
  return user;
}
export async function requestReset(email) {
  const user = await User.findOne({ email });
  // unknown email: do nothing, but the route still answers 200
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        resetTokenHash: sha256(token),
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    },
  );
  console.log(`Reset link: ${env.CLIENT_ORIGIN}/reset?token=${token}`);
}

export async function resetPassword(token, password) {
  // token fields are removed in the same update, so the link works only once
  const user = await User.findOneAndUpdate(
    { resetTokenHash: sha256(token), resetTokenExpires: { $gt: new Date() } },
    {
      $set: { passwordHash: await argon2.hash(password) },
      $unset: { resetTokenHash: 1, resetTokenExpires: 1 },
    },
    { new: true },
  );
  if (!user) throw new AppError('TOKEN_INVALID', 400, 'This link is invalid or has expired');
}
