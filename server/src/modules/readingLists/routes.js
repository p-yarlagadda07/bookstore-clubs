 import { z } from "zod";
import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";

import {
  CreateListBody,
  UpdateListBody,
  AddItemBody,
} from "@bookstore/shared/schemas/readingLists";

import { IdParams } from "@bookstore/shared/schemas/common";
import * as controller from "./controller.js";

const router = Router();

const ItemParams = IdParams.extend({
  bookId: z.string(),
});

router.post(
  "/reading-lists",
  requireAuth,
  validate({ body: CreateListBody }),
  asyncHandler(controller.create)
);

router.get(
  "/reading-lists",
  requireAuth,
  asyncHandler(controller.list)
);

router.get(
  "/reading-lists/:id",
  requireAuth,
  validate({ params: IdParams }),
  asyncHandler(controller.get)
);

router.patch(
  "/reading-lists/:id",
  requireAuth,
  validate({
    params: IdParams,
    body: UpdateListBody,
  }),
  asyncHandler(controller.update)
);

router.post(
  "/reading-lists/:id/items",
  requireAuth,
  validate({
    params: IdParams,
    body: AddItemBody,
  }),
  asyncHandler(controller.add)
);

router.delete(
  "/reading-lists/:id/items/:bookId",
  requireAuth,
  validate({ params: ItemParams }),
  asyncHandler(controller.remove)
);

router.delete(
  "/reading-lists/:id",
  requireAuth,
  validate({ params: IdParams }),
  asyncHandler(controller.removeList)
);

export default router;