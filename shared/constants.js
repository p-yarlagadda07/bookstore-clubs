export const ROLES = Object.freeze({
  READER: 'reader',
  BOOKSELLER: 'bookseller',
  ADMIN: 'admin',
});
// moderators are stored per club in user.moderatorOf

export const BOOK_CONDITION = Object.freeze({ NEW: 'new', USED: 'used' });
export const INVENTORY_STATUS = Object.freeze({ ACTIVE: 'active', UNAVAILABLE: 'unavailable' });
export const CONTENT_LEVEL = Object.freeze({ SYNOPSIS: 'synopsis', EXCERPTS: 'excerpts' });
export const SOURCE_PERMISSION = Object.freeze({
  APPROVED: 'approved',
  PENDING: 'pending',
  REVOKED: 'revoked',
});

export const RESERVATION_STATUS = Object.freeze({
  HELD: 'held',
  COLLECTED: 'collected',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
});

export const VISIBILITY = Object.freeze({ PRIVATE: 'private', CLUB: 'club', PUBLIC: 'public' });
export const MEMBERSHIP_STATUS = Object.freeze({ ACTIVE: 'active', REMOVED: 'removed' });

export const TOOL_STATUS = Object.freeze({
  STARTED: 'started',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
});

export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FORBIDDEN: 'FORBIDDEN',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  CSRF_INVALID: 'CSRF_INVALID',
  NOT_FOUND: 'NOT_FOUND',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
});
