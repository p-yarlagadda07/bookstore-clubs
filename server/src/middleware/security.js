import cookieParser from 'cookie-parser';
import session from 'express-session';
import * as connectMongo from 'connect-mongo';
import { doubleCsrf } from 'csrf-csrf';
import { env, isProd } from '../config/env.js';
import { AppError } from '../lib/AppError.js';

const MongoStore = connectMongo.default ?? connectMongo.MongoStore;

const { generateToken, doubleCsrfProtection, invalidCsrfTokenError } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  cookieName: 'csrf',
  cookieOptions: { sameSite: 'lax', secure: isProd, httpOnly: true, path: '/' },
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

export { generateToken };

export function applySecurity(app) {
  app.use(cookieParser());

  const isTest = env.NODE_ENV === 'test';
  app.use(
    session({
      name: 'sid',
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 30 * 60 * 1000 },
      // tests use the default memory store so they don't need Atlas
      store: isTest
        ? undefined
        : MongoStore.create({
            mongoUrl: env.MONGODB_URI,
            collectionName: 'sessions',
            ttl: 8 * 60 * 60,
          }),
    }),
  );

  app.use(doubleCsrfProtection);
  app.use((err, _req, _res, next) => {
    if (err === invalidCsrfTokenError || err?.code === 'EBADCSRFTOKEN') {
      return next(new AppError('CSRF_INVALID', 403, 'Invalid CSRF token'));
    }
    next(err);
  });
}