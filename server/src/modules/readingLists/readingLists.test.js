import { beforeAll, afterAll } from "vitest";
import {
  startTestDB,
  stopTestDB,
} from "../../../test/helpers/db.js";
import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { ReadingList } from "./model.js";
import {
  createList,
  listMine,
  getList,
  updateList,
  addItem,
  removeItem,
  deleteList,
} from "./service.js";

beforeAll(startTestDB);
afterAll(stopTestDB);

const userA = { _id: new mongoose.Types.ObjectId() };
const userB = { _id: new mongoose.Types.ObjectId() };

describe("Reading Lists service", () => {
  beforeEach(async () => {
    await ReadingList.deleteMany({});
  });

  it("creates a reading list", async () => {
    const list = await createList(userA, { name: "My Books" });

    expect(list.name).toBe("My Books");
    expect(list.ownerId.toString()).toBe(userA._id.toString());
  });

  it("lists only the current user's lists", async () => {
    await createList(userA, { name: "A List" });
    await createList(userB, { name: "B List" });

    const lists = await listMine(userA);

    expect(lists).toHaveLength(1);
    expect(lists[0].name).toBe("A List");
  });

  it("adds a book", async () => {
    const list = await createList(userA, { name: "Favorites" });
    const bookId = new mongoose.Types.ObjectId();

    const updated = await addItem(userA, list._id, {
      bookId: bookId.toString(),
      note: "Read soon",
    });

    expect(updated.items).toHaveLength(1);
  });

  it("rejects duplicate books", async () => {
    const list = await createList(userA, { name: "Favorites" });
    const bookId = new mongoose.Types.ObjectId();

    await addItem(userA, list._id, {
      bookId: bookId.toString(),
    });

    await expect(
      addItem(userA, list._id, {
        bookId: bookId.toString(),
      })
    ).rejects.toThrow();
  });

  it("removes a book", async () => {
    const list = await createList(userA, { name: "Favorites" });
    const bookId = new mongoose.Types.ObjectId();

    await addItem(userA, list._id, {
      bookId: bookId.toString(),
    });

    const updated = await removeItem(
      userA,
      list._id,
      bookId.toString()
    );

    expect(updated.items).toHaveLength(0);
  });

  it("updates a list", async () => {
    const list = await createList(userA, { name: "Old Name" });

    const updated = await updateList(userA, list._id, {
      name: "New Name",
    });

    expect(updated.name).toBe("New Name");
  });

  it("does not allow another user to access the list", async () => {
    const list = await createList(userA, { name: "Private" });

    await expect(
      getList(userB, list._id)
    ).rejects.toThrow();
  });

  it("deletes a list", async () => {
    const list = await createList(userA, { name: "Delete Me" });

    await deleteList(userA, list._id);

    const result = await ReadingList.findById(list._id);

    expect(result).toBeNull();
  });
});