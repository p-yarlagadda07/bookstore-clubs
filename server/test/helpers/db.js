// in-memory db for tests (replica set so transactions work)
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
