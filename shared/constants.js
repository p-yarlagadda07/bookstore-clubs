// Shared constants used by server and client.
// Owner: Member 1. Changes need a small PR + Member 1 review (see CODEOWNERS).

export const ROLES = Object.freeze({
  READER: 'reader',
  BOOKSELLER: 'bookseller',
  ADMIN: 'admin',
});
// Moderator rights are per club: user.moderatorOf = [clubId, ...]

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

// Error codes returned in { ok: false, error: { code, message } }
export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 400
  UNAUTHENTICATED: 'UNAUTHENTICATED', // 401
  FORBIDDEN: 'FORBIDDEN', // 403
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED', // 403
  CSRF_INVALID: 'CSRF_INVALID', // 403
  NOT_FOUND: 'NOT_FOUND', // 404
  OUT_OF_STOCK: 'OUT_OF_STOCK', // 409
  CONFLICT: 'CONFLICT', // 409
  RATE_LIMITED: 'RATE_LIMITED', // 429
  INTERNAL: 'INTERNAL', // 500
  AI_UNAVAILABLE: 'AI_UNAVAILABLE', // 503
});
