// OWNER: Member 2 - sessions (express-session + connect-mongo), CSRF and rate limits go here.
// app.js already calls applySecurity(app) before the routes, so Member 2 never needs to edit app.js.

export function applySecurity(_app) {
  // Member 2: app.use(session(...)); app.use(csrfProtection); etc.
}
