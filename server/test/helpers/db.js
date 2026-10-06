// Use in tests that need a database:
//   import { startTestDB, stopTestDB } from './helpers/db.js';
//   beforeAll(startTestDB); afterAll(stopTestDB);
// A replica set is used so MongoDB transactions work (needed for reservations).
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet;
export async function startTestDB() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
}
export async function stopTestDB() {
  await mongoose.disconnect();
  await replSet?.stop();
}
