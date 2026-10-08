import { describe, it, expect, vi, afterEach } from 'vitest';
import { isOllamaUp, requireOllama } from './ollama.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ollama client', () => {
  it('isOllamaUp is false when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await isOllamaUp()).toBe(false);
  });

  it('requireOllama throws AI_UNAVAILABLE when ollama is off', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    await expect(requireOllama()).rejects.toMatchObject({
      code: 'AI_UNAVAILABLE',
      status: 503,
    });
  });

  it('requireOllama passes when ollama is up', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    await expect(requireOllama()).resolves.toBeUndefined();
  });
});