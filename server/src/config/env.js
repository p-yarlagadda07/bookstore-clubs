import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// .env is in the root folder, not in server/
dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  MONGODB_URI: process.env.MONGODB_URI ?? '',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  SESSION_SECRET: process.env.SESSION_SECRET ?? 'dev-only-secret',
  CSRF_SECRET: process.env.CSRF_SECRET ?? 'dev-only-csrf-secret',
  OLLAMA_URL: process.env.OLLAMA_URL ?? 'http://localhost:11434',
  OLLAMA_CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL ?? 'llama3.2:3b',
  OLLAMA_EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text',
  AGENT_MODE: process.env.AGENT_MODE ?? 'tools',
};
export const isProd = env.NODE_ENV === 'production';
