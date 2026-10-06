// usage: npm run seed  (add -- --reset to clear the db first)
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { connectDB, disconnectDB } from '../src/config/db.js';

const reset = process.argv.includes('--reset');
const DEMO_PASSWORD = 'Password@123';

async function seedUsers() {
  const users = mongoose.connection.collection('users');
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
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
  for (const u of demo) {
    await users.updateOne(
      { email: u.email },
      { $setOnInsert: { ...base, ...u } },
      { upsert: true },
    );
  }
  await users.createIndex({ email: 1 }, { unique: true });
  return demo.length;
}

async function main() {
  await connectDB();
  if (reset) {
    await mongoose.connection.dropDatabase();
    console.log('Database reset.');
  }
  const n = await seedUsers();
  console.log(`Seeded ${n} demo users (password for all: ${DEMO_PASSWORD})`);
  // TODO: books + inventory, clubs, excerpts
  await disconnectDB();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDB();
  process.exit(1);
});
