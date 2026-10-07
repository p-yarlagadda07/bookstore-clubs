import * as service from "./service.js";

export async function list(req, res, next) {
  try {
    const result = await service.list(req.validatedQuery);
    return res.ok(result);
  } catch (error) {
    return next(error);
  }
}

export async function get(req, res, next) {
  try {
    const result = await service.get(req.params.id);

    if (!result) {
      return next({
        code: "NOT_FOUND",
        message: "Book not found",
      });
    }

    return res.ok(result);
  } catch (error) {
    return next(error);
  }
}