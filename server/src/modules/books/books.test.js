import request from "supertest";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

import app from "../../app.js";
import Book from "./model.js";
import CatalogSource from "../catalogSources/model.js";
import { startTestDB, stopTestDB } from "../../../test/helpers/db.js";

beforeAll(startTestDB);
afterAll(stopTestDB);

describe("Books API", () => {
  it("lists approved books", async () => {
    const source = await CatalogSource.create({
      name: "Test Source",
      type: "store",
      permission: "approved",
    });

    await Book.create({
      title: "Test Book",
      authors: ["Test Author"],
      approvedSource: true,
      sourceId: source._id,
    });

    const response = await request(app).get("/api/books");

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBeGreaterThan(0);
    expect(response.body.data.items[0].embedding).toBeUndefined();
  });

  it("returns 404 for an unknown book", async () => {
    const id = new mongoose.Types.ObjectId();

    const response = await request(app).get(`/api/books/${id}`);

    expect(response.status).toBe(404);
  });

  it("returns 400 for a bad book id", async () => {
    const response = await request(app).get("/api/books/not-a-valid-id");

    expect(response.status).toBe(400);
  });
});