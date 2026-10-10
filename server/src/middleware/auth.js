import { AppError } from '../lib/AppError.js';
import { User } from '../modules/users/model.js';
import { Membership } from '../modules/clubs/model.js';

const isAdmin = (user) => !!user?.roles?.includes('admin');
const moderates = (user, clubId) => (user?.moderatorOf ?? []).map(String).includes(String(clubId));

export const requireAuth = async (req, _res, next) => {
  try {
    if (!req.session?.userId) throw new AppError('UNAUTHENTICATED', 401, 'Please log in');
    const user = await User.findById(req.session.userId).select('-passwordHash').lean();
    if (!user) throw new AppError('UNAUTHENTICATED', 401, 'Session expired, please log in again');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireVerified = (req, _res, next) => {
  if (!req.user?.emailVerifiedAt) {
    return next(new AppError('EMAIL_NOT_VERIFIED', 403, 'Please verify your email first'));
  }
  next();
};

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    const user = req.user;
    if (isAdmin(user) || roles.some((r) => user?.roles?.includes(r))) return next();
    next(new AppError('FORBIDDEN', 403, 'You are not allowed to do this'));
  };

export const requireClubModerator =
  (param = 'id') =>
  (req, _res, next) => {
    if (isAdmin(req.user) || moderates(req.user, req.params[param])) return next();
    next(new AppError('FORBIDDEN', 403, "Only this club's moderators can do this"));
  };

// for services and AI tools (no req/res). async because club.member checks the db
export async function assertCan(user, action, resource = {}) {
  if (!user) throw new AppError('UNAUTHENTICATED', 401, 'Please log in');
  const admin = isAdmin(user);
  let allowed = false;

  switch (action) {
    case 'club.read':
      allowed = true;
      break;
    case 'club.moderate':
      allowed = admin || moderates(user, resource.clubId);
      break;
    case 'club.member':
      allowed =
        admin ||
        moderates(user, resource.clubId) ||
        !!(await Membership.exists({
          clubId: resource.clubId,
          userId: user._id,
          status: 'active',
        }));
      break;
    case 'stock.update':
      allowed = admin || !!user.roles?.includes('bookseller');
      break;
    case 'role.change':
      allowed = admin && String(resource.targetUserId) !== String(user._id);
      break;
  }

  if (!allowed) throw new AppError('FORBIDDEN', 403, 'You are not allowed to do this');
  return true;
}
