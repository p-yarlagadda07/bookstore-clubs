import { z } from "zod";

export const CreateListBody = z.object({
  name: z.string().min(1).max(80),
});

export const UpdateListBody = z.object({
  name: z.string().min(1).max(80).optional(),
  visibility: z.enum(["private", "public"]).optional(),
});

export const AddItemBody = z.object({
  bookId: z.string().min(1),
  note: z.string().max(300).optional(),
});