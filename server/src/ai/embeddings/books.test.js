import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestDB, stopTestDB } from '../../../test/helpers/db.js';
import Book from '../../modules/books/model.js';
import { textForBook, embedBook, embedAllBooks } from './books.js';

vi.mock('../ollama.js', () => ({
  embeddings: { embedQuery: vi.fn(async () => Array(768).fill(0.1)) },
  requireOllama: vi.fn(async () => {}),
}));

const sample = {
  title: 'Murder at Platform Nine',
  authors: ['A. Writer'],
  themes: ['mystery', 'trains'],
  moods: ['tense', 'cozy'],
  synopsis: 'A body is found at the station.',
  approvedSource: true,
};

async function addBook(extra = {}) {
  const res = await Book.collection.insertOne({ ...sample, ...extra });
  return res.insertedId;
}

describe('book embeddings', () => {
  beforeAll(startTestDB);
  afterAll(stopTestDB);
  beforeEach(async () => {
    await Book.deleteMany({});
  });

  it('builds the text for a book', () => {
    expect(textForBook(sample)).toBe(
      'Murder at Platform Nine. Themes: mystery, trains. Mood: tense, cozy. A body is found at the station.',
    );
  });

  it('saves the embedding on the book', async () => {
    const id = await addBook();
    await embedBook(id);

    const book = await Book.findById(id).select('+embedding').lean();
    expect(book.embedding).toHaveLength(768);
  });

  it('does not return the embedding by default', async () => {
    const id = await addBook();
    await embedBook(id);

    const book = await Book.findById(id).lean();
    expect(book).not.toHaveProperty('embedding');
  });

  it('embeds all books and returns the count', async () => {
    await addBook();
    await addBook({ title: 'Another Book' });

    expect(await embedAllBooks()).toBe(2);
  });
});