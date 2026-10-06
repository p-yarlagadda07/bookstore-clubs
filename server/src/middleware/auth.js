// temporary versions so other routes can use these already
// will be replaced with the real checks

export const requireAuth = (_req, _res, next) => next();
export const requireVerified = (_req, _res, next) => next();
export const requireRole = () => (_req, _res, next) => next();
export const requireClubModerator = () => (_req, _res, next) => next();
export const assertCan = () => true;
