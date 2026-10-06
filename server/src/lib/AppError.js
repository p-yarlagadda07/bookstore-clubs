// Throw this from services/controllers. The error handler turns it into
// { ok: false, error: { code, message, details } } with the right HTTP status.
//   throw new AppError('OUT_OF_STOCK', 409, 'No copy available');
export class AppError extends Error {
  constructor(code, status = 500, message = 'Something went wrong', details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
