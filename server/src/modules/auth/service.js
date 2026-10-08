import argon2 from 'argon2';
import { User } from '../users/model.js';
import { AppError } from '../../lib/AppError.js';

// same error for wrong email and wrong password, so nobody can tell which emails exist
export async function checkLogin(email, password) {
  const user = await User.findOne({ email });
  const ok = user && (await argon2.verify(user.passwordHash, password).catch(() => false));
    if (!ok) throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
  return user;
}