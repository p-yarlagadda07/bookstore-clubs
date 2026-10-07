import express from "express";

import asyncHandler from "../../lib/asyncHandler.js";

import { validate } from "../../middleware/validate.js";

import * as controller from "./controller.js";

import { ListBooksQuery } from "../../../../shared/schemas/books.js";

import { IdParams } from "../../../../shared/schemas/common.js";

const router = express.Router();

router.get(
  "/books",
  validate({ query: ListBooksQuery }),
  asyncHandler(controller.list)
);

router.get(
  "/books/:id",
  validate({ params: IdParams }),
  asyncHandler(controller.get)
);

export default router;