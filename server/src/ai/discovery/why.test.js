import { describe, expect, it } from 'vitest';
import { whyItMatched } from './why.js';

describe('whyItMatched', () => {
  it('names matching themes and moods', () => {
    const book = {
      themes: ['friendship', 'courage'],
      moods: ['suspenseful'],
    };

    expect(whyItMatched('a suspenseful mystery', book)).toBe('Matches suspenseful');
  });

  it('uses the fallback when nothing matches', () => {
    const book = {
      themes: ['friendship'],
      moods: ['hopeful'],
    };

    expect(whyItMatched('a space adventure', book)).toBe('Close to how you described it');
  });

  it('handles missing themes and moods', () => {
    expect(whyItMatched('a mystery', {})).toBe('Close to how you described it');
  });
});
