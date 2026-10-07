import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { env } from '../config/env.js';
import { AppError } from '../lib/AppError.js';

export const chat = new ChatOllama({
  baseUrl: env.OLLAMA_URL,
  model: env.OLLAMA_CHAT_MODEL,
  temperature: 0,
});

export const embeddings = new OllamaEmbeddings({
  baseUrl: env.OLLAMA_URL,
  model: env.OLLAMA_EMBED_MODEL,
});

export async function isOllamaUp() {
  try {
    const res = await fetch(`${env.OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function requireOllama() {
  const up = await isOllamaUp();
  if (!up) {
    throw new AppError('AI_UNAVAILABLE', 503, 'The AI assistant is offline right now');
  }
}
