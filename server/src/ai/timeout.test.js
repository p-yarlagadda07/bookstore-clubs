import { describe, it, expect } from 'vitest';
import { withTimeout } from './timeout.js';

describe('withTimeout', () => {
  it('rejects when the promise takes too long', async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve('done'), 200);
    });

    await expect(withTimeout(slowPromise, 50)).rejects.toMatchObject({
      code: 'AI_TIMEOUT',
      status: 503,
    });
  });

  it('returns the result when the promise finishes quickly', async () => {
    await expect(withTimeout(Promise.resolve('done'), 1000)).resolves.toBe('done');
  });
});
