import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

export async function connectDB(uri = env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI is missing. Copy .env.example to .env and fill it in.');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info({ db: mongoose.connection.name }, 'MongoDB connected');
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
