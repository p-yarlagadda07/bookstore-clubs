# Security

This page explains how Booklore keeps accounts and data safe: who can log in, how sessions work, and who is allowed to do what. Each section says where the code lives.

## 1. Signup and email verification

- A new account gets the `reader` role and is not verified yet.
- We create a random token, save only its SHA-256 hash in the database, and print the verify link in the server terminal (no real email in this project).
- The link works once and expires after 24 hours. Opening it sets `emailVerifiedAt` and deletes the token in the same database update.
- Unverified users can browse, but holding a book, joining a club and asking for a back in stock alert use `requireVerified` and answer 403 `EMAIL_NOT_VERIFIED`.
- Signup is limited to 10 tries per 15 minutes per IP. A used email gives 409 `EMAIL_TAKEN`.

Code: `server/src/modules/auth/service.js`, `server/src/modules/auth/routes.js`, `server/src/middleware/auth.js`

## 2. Passwords

- Passwords are hashed with argon2. We never store or return the plain password, and `toJSON` on the User model removes `passwordHash` and all token fields from every response.
- Wrong email and wrong password give the same answer (401 `INVALID_CREDENTIALS`), so nobody can find out which emails have accounts.
- Forgot password always answers 200, even for an unknown email, for the same reason.
- The reset link works once and expires after 30 minutes. Only its hash is stored.
- After a reset, `passwordChangedAt` is saved on the user.

Code: `server/src/modules/auth/service.js`, `server/src/modules/users/model.js`

## 3. Sessions

- We use server side sessions (`express-session`), stored in MongoDB (`connect-mongo`). The browser only gets a session id in the `sid` cookie.
- The cookie is `httpOnly` (JavaScript can't read it), `sameSite: lax`, and `secure` in production.
- A session ends after 30 minutes without activity. Every request resets the timer.
- On login we create a new session id (`req.session.regenerate`), so an old session id can't be reused.
- On login we also save `loginAt`. If a session started before the last password change, `requireAuth` destroys it and answers 401. So after a password reset, every other browser is logged out.
- Logout destroys the session and clears the cookie.

Code: `server/src/middleware/security.js`, `server/src/modules/auth/controller.js`, `server/src/middleware/auth.js`

## 4. CSRF

- Every POST, PATCH and DELETE needs an `x-csrf-token` header. The website gets it from `GET /api/auth/csrf`, and our api client adds it automatically.
- We use the double submit cookie method (`csrf-csrf`). A request without a valid token gets 403 `CSRF_INVALID`.

Code: `server/src/middleware/security.js`

## 5. Login limit

- 5 wrong login tries per 15 minutes for the same IP and email. The 6th gets 429 `RATE_LIMITED`.
- Successful logins don't count, so a real user isn't locked out after logging in normally.

Code: `server/src/modules/auth/routes.js`

## 6. Roles

- `reader`: everyone who signs up.
- `bookseller`: manages stock, pickup times and pickups.
- Moderator: not a global role. It is per club, stored in `user.moderatorOf`, so a moderator of one club has no power in another.
- `admin`: can do everything a bookseller or moderator can, plus staff roles, sources and the Logbook.
- Checks: `requireAuth` (logged in), `requireVerified`, `requireRole(...)`, `requireClubModerator()`, and `assertCan(user, action)` for checks inside services and AI tools.
- Only the admin can give or take the bookseller and moderator roles. Nobody can change their own roles (403), and the admin role can't be given through the API.
- Roles are read from the database on every request, so a role change works right away.

Code: `server/src/middleware/auth.js`, `server/src/modules/users/service.js`

## 7. Owner only data

- Private shelves, reading progress and saved chats are always looked up together with the logged in user's id, so one reader can't read another reader's data.
- A private shelf opened through the public link gives 404, not 403, so nobody can tell it exists.

Code: `server/src/modules/readingLists`, `server/src/modules/progress`, `server/src/modules/conversations`

## 8. AI safety

- All AI routes need login.
- Chapter Chat only uses approved excerpts, and the spoiler limit (the reader's bookmark chapter) is applied in the database query, before the model sees any text.
- Books from a revoked source are filtered out of search, chat and Next Read.
- The Next Read agent only suggests books. It never makes a hold.

Code: `server/src/ai`

## 9. Audit log

- Important staff actions are saved in the `auditlogs` collection with who did it, when, what changed, and the before and after values.
- Logged actions: stock changes, pickup times added or removed, adding and editing books, a hold marked as collected, role changes, source approve or revoke, and excerpt approval by a moderator.
- `logAudit` never throws, so a failed log write can't break the real action.
- Only the admin can read it, on the Logbook page.

Code: `server/src/modules/audit`, `client/src/features/admin/LogbookPage.jsx`

## Brief checklist

| Brief requirement       | How we do it                                               | File                                            |
| ----------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Secure password storage | argon2 hash, never returned                                | `modules/auth/service.js`                       |
| Email verification      | one time hashed link, 24 h, `requireVerified`              | `modules/auth/service.js`                       |
| Password reset          | one time hashed link, 30 min, old sessions logged out      | `modules/auth/service.js`, `middleware/auth.js` |
| Server side sessions    | `express-session` in MongoDB, httpOnly cookie, 30 min idle | `middleware/security.js`                        |
| Session fixation        | new session id on login                                    | `modules/auth/controller.js`                    |
| CSRF protection         | `x-csrf-token` on every POST, PATCH, DELETE                | `middleware/security.js`                        |
| Brute force protection  | 5 wrong logins per 15 min per IP and email                 | `modules/auth/routes.js`                        |
| Role based access       | reader, bookseller, moderator per club, admin              | `middleware/auth.js`                            |
| No self promotion       | own roles can't be changed, admin can't be given           | `modules/users/service.js`                      |
| Private data            | queries always include the owner id                        | `readingLists`, `progress`, `conversations`     |
| Spoiler safe AI         | chapter filter before retrieval                            | `server/src/ai/rag`                             |
| Audit trail             | Logbook of staff actions                                   | `modules/audit`                                 |
