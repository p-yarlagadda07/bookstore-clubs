import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../ollama.js', () => ({
  chat: {
    invoke: vi.fn(),
  },
  isOllamaUp: vi.fn(),
}));

import { chat, isOllamaUp } from '../ollama.js';
import { writeNote } from './note.js';

const constraints = {
  memberCount: 8,
  pagesPossible: 240,
};

const shortlist = [
  {
    title: 'Short Mystery',
    pages: 220,
    copies: 10,
    timeFit: 'fits',
  },
];

const DISCLAIMER = 'Recommendations only. No book was reserved or selected.';

describe('writeNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the template when Ollama is offline', async () => {
    isOllamaUp.mockResolvedValue(false);

    const note = await writeNote(shortlist, constraints);

    expect(note).toContain('Short Mystery');
    expect(note).toContain(DISCLAIMER);
    expect(chat.invoke).not.toHaveBeenCalled();
  });

  it('uses the model response when Ollama is available', async () => {
    isOllamaUp.mockResolvedValue(true);
    chat.invoke.mockResolvedValue({
      content: 'Short Mystery is a good choice for your book club.',
    });

    const note = await writeNote(shortlist, constraints);

    expect(note).toBe(`Short Mystery is a good choice for your book club. ${DISCLAIMER}`);
    expect(chat.invoke).toHaveBeenCalledOnce();
  });

  it('uses the template when model generation fails', async () => {
    isOllamaUp.mockResolvedValue(true);
    chat.invoke.mockRejectedValue(new Error('Model unavailable'));

    const note = await writeNote(shortlist, constraints);

    expect(note).toContain('Short Mystery');
    expect(note).toContain(DISCLAIMER);
  });

  it('returns the shorter-book message for an empty shortlist', async () => {
    const note = await writeNote([], constraints);

    expect(note).toBe(`No book fits the time and copies, try a shorter book. ${DISCLAIMER}`);
    expect(note).toContain(DISCLAIMER);
    expect(chat.invoke).not.toHaveBeenCalled();
  });
});
