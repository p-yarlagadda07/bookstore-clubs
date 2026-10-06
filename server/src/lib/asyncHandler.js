// Wrap async controllers so thrown errors reach the error handler (Express 4).
//   router.get('/books', asyncHandler(ctrl.list));
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
