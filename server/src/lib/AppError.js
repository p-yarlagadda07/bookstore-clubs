export class AppError extends Error {
  constructor(code, status = 500, message = 'Something went wrong', details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
