// OWNER: Member 2 (Authentication, sessions, roles and audit)
// Export from this file: requireAuth, requireVerified, requireRole, requireClubModerator, assertCan
// See Document 02, Member 2, Step 1 for the reference code.
// Until Member 2's PR is merged, other members can import these placeholders - they let every request through.

export const requireAuth = (_req, _res, next) => next();
export const requireVerified = (_req, _res, next) => next();
export const requireRole = () => (_req, _res, next) => next();
export const requireClubModerator = () => (_req, _res, next) => next();
export const assertCan = () => true;
