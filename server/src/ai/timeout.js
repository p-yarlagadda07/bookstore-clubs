import { AppError } from '../lib/AppError.js';

export const AI_TIMEOUT_MS = 20000;

export function withTimeout(promise, ms, label = 'AI call') {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new AppError('AI_TIMEOUT', 503, `${label} timed out. The AI is taking too long, try again`),
      );
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
}
