// usage: npm run seed  (add -- --reset to clear the db first)
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { isOllamaUp } from '../src/ai/ollama.js';
import { embedAllBooks } from '../src/ai/embeddings/books.js';

const reset = process.argv.includes('--reset');
const DEMO_PASSWORD = 'Password@123';
const DAY = 24 * 60 * 60 * 1000;

const col = (name) => mongoose.connection.collection(name);

async function readData(file) {
  const text = await readFile(new URL(`./data/${file}`, import.meta.url), 'utf8');
  return JSON.parse(text);
}

async function seedUsers(passwordHash) {
  const users = col('users');
  const now = new Date();
  const base = {
    passwordHash,
    emailVerifiedAt: now,
    moderatorOf: [],
    createdAt: now,
    updatedAt: now,
    preferences: { genres: [], moods: [], maxPages: null },
    spoilerSettings: { strict: false, maxChapter: null },
  };
  const demo = [
    { name: 'Store Admin', email: 'admin@bookstore.test', roles: ['admin'] },
    {
      name: 'Bina Bookseller',
      email: 'bookseller@bookstore.test',
      roles: ['reader', 'bookseller'],
    },
    { name: 'Mohan Moderator', email: 'moderator@bookstore.test', roles: ['reader'] },
    { name: 'Riya Reader', email: 'reader1@bookstore.test', roles: ['reader'] },
    { name: 'Arjun Reader', email: 'reader2@bookstore.test', roles: ['reader'] },
    {
      name: 'Unverified User',
      email: 'unverified@bookstore.test',
      roles: ['reader'],
      emailVerifiedAt: null,
    },
  ];
  // extra readers so the Tuesday Mystery Circle has 8 members
  const extraNames = ['Sana', 'Kiran', 'Meena', 'Rahul', 'Divya', 'Farhan'];
  extraNames.forEach((name, i) => {
    demo.push({
      name: `${name} Reader`,
      email: `reader${i + 3}@bookstore.test`,
      roles: ['reader'],
    });
  });

  for (const u of demo) {
    await users.updateOne(
      { email: u.email },
      { $setOnInsert: { ...base, ...u } },
      { upsert: true },
    );
  }
  await users.createIndex({ email: 1 }, { unique: true });

  const all = await users.find({}, { projection: { email: 1 } }).toArray();
  return new Map(all.map((u) => [u.email, u._id]));
}

// next 7 days, 10:00 - 19:00
function pickupWindows() {
  const windows = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let d = 0; d < 7; d++) {
    const day = new Date(today.getTime() + d * DAY);
    const start = new Date(day);
    start.setHours(10);
    const end = new Date(day);
    end.setHours(19);
    windows.push({ _id: new mongoose.Types.ObjectId(), start, end });
  }
  return windows;
}

function need(map, key, what) {
  const id = map.get(key);
  if (!id) throw new Error(`${what} "${key}" not found - check the JSON files`);
  return id;
}

async function seedCatalog() {
  const now = new Date();
  const sources = await readData('catalogSources.json');
  const sourceIds = new Map();
  const approved = new Map();
  for (const s of sources) {
    const { key, ...doc } = s;
    const res = await col('catalogsources').insertOne({ ...doc, createdAt: now, updatedAt: now });
    sourceIds.set(key, res.insertedId);
    approved.set(key, s.permission === 'approved');
  }

  const books = await readData('books.json');
  const bookIds = new Map();
  const bookSource = new Map();
  for (const b of books) {
    const { key, source, ...doc } = b;
    const res = await col('books').insertOne({
      ...doc,
      sourceId: need(sourceIds, source, 'source'),
      approvedSource: approved.get(source),
      createdAt: now,
      updatedAt: now,
    });
    bookIds.set(key, res.insertedId);
    bookSource.set(key, sourceIds.get(source));
  }

  const inventory = await readData('inventory.json');
  for (const row of inventory) {
    const { book, ...doc } = row;
    await col('inventories').insertOne({
      ...doc,
      bookId: need(bookIds, book, 'book'),
      pickupWindows: pickupWindows(),
      createdAt: now,
      updatedAt: now,
    });
  }

  return { bookIds, bookSource, counts: [sources.length, books.length, inventory.length] };
}

async function seedClubs(userIds, bookIds) {
  const now = new Date();
  const data = await readData('clubs.json');
  const clubIds = new Map();
  const clubBook = new Map();

  for (const c of data.clubs) {
    const moderatorId = need(userIds, c.moderator, 'user');
    const res = await col('clubs').insertOne({
      name: c.name,
      description: c.description,
      published: c.published,
      rules: c.rules,
      moderators: [moderatorId],
      currentBookId: need(bookIds, c.currentBook, 'book'),
      readingPace: { pagesPerWeek: c.pagesPerWeek },
      createdAt: now,
      updatedAt: now,
    });
    clubIds.set(c.key, res.insertedId);
    clubBook.set(c.key, bookIds.get(c.currentBook));
    await col('users').updateOne(
      { _id: moderatorId },
      { $addToSet: { moderatorOf: res.insertedId } },
    );
  }

  for (const m of data.members) {
    await col('memberships').insertOne({
      clubId: need(clubIds, m.club, 'club'),
      userId: need(userIds, m.email, 'user'),
      status: 'active',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const m of data.meetings) {
    const club = data.clubs.find((c) => c.key === m.club);
    await col('meetings').insertOne({
      clubId: need(clubIds, m.club, 'club'),
      date: new Date(Date.now() + m.inDays * DAY),
      time: m.time,
      location: m.location,
      bookId: clubBook.get(m.club),
      agenda: m.agenda,
      chapterRange: { from: m.from, to: m.to },
      createdBy: need(userIds, club.moderator, 'user'),
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const p of data.progress) {
    await col('progresses').insertOne({
      userId: need(userIds, p.email, 'user'),
      bookId: need(bookIds, p.book, 'book'),
      clubId: need(clubIds, p.club, 'club'),
      chapter: p.chapter,
      page: p.page,
      visibility: p.visibility,
      createdAt: now,
      updatedAt: now,
    });
  }

  return [data.clubs.length, data.members.length, data.meetings.length, data.progress.length];
}

async function seedAiData(bookIds, bookSource) {
  const now = new Date();
  const excerpts = await readData('excerpts.json');
  for (const e of excerpts) {
    const { book, ...doc } = e;
    await col('excerpts').insertOne({
      ...doc,
      bookId: need(bookIds, book, 'book'),
      sourceId: bookSource.get(book),
      createdAt: now,
      updatedAt: now,
    });
  }

  const docs = await readData('storeDocs.json');
  for (const d of docs) {
    await col('storedocs').insertOne({
      title: d.title,
      type: d.type,
      text: d.text,
      chunkIndex: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  return [excerpts.length, docs.length];
}

async function main() {
  await connectDB();
  if (reset) {
    // clear each collection instead of dropping the db, Atlas deletes the search indexes with it
    const cols = await mongoose.connection.db.listCollections().toArray();
    for (const c of cols) {
      await col(c.name).deleteMany({});
    }
    console.log('Database reset.');
  }

  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
  const userIds = await seedUsers(passwordHash);
  console.log(`Users: ${userIds.size} (password for all: ${DEMO_PASSWORD})`);

  // books and the rest only go in once - use --reset to load them again
  if ((await col('books').countDocuments()) > 0) {
    console.log('Books are already there, skipping the rest. Use: npm run seed -- --reset');
    await disconnectDB();
    return;
  }

  const { bookIds, bookSource, counts } = await seedCatalog();
  console.log(`Sources: ${counts[0]}, books: ${counts[1]}, inventory rows: ${counts[2]}`);

  const [clubs, members, meetings, progress] = await seedClubs(userIds, bookIds);
  console.log(`Clubs: ${clubs}, members: ${members}, meetings: ${meetings}, progress: ${progress}`);

  const [excerpts, docs] = await seedAiData(bookIds, bookSource);
  console.log(`Excerpts: ${excerpts}, store docs: ${docs}`);

  if (await isOllamaUp()) {
    console.log(`Embedded ${await embedAllBooks()} books`);
  } else {
    console.log('Ollama is off, run npm run embed later');
  }

  await disconnectDB();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDB();
  process.exit(1);
});
