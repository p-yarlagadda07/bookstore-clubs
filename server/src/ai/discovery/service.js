import { embeddings, requireOllama } from '../ollama.js';
import { withTimeout, AI_TIMEOUT_MS } from '../timeout.js';
import Book from '../../modules/books/model.js';

export async function vectorSearchBooks(q, limit) {
  await requireOllama();

  const vector = await withTimeout(embeddings.embedQuery(q), AI_TIMEOUT_MS, 'Smart Search');

  return Book.aggregate([
    {
      $vectorSearch: {
        index: 'books_vec',
        path: 'embedding',
        queryVector: vector,
        numCandidates: 100,
        limit,
        filter: { approvedSource: true },
      },
    },
    {
      $project: {
        title: 1,
        authors: 1,
        themes: 1,
        moods: 1,
        pageCount: 1,
        synopsis: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ]);
}

export async function similarBooks(bookId, limit) {
  const book = await Book.findOne({ _id: bookId, approvedSource: true })
    .select('+embedding')
    .lean();

  if (!book) return null;
  if (!book.embedding || book.embedding.length === 0) return [];

  const rows = await Book.aggregate([
    {
      $vectorSearch: {
        index: 'books_vec',
        path: 'embedding',
        queryVector: book.embedding,
        numCandidates: 100,
        limit: limit + 1,
        filter: { approvedSource: true },
      },
    },
    {
      $project: {
        title: 1,
        authors: 1,
        themes: 1,
        moods: 1,
        pageCount: 1,
        synopsis: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ]);

  return rows.filter((r) => String(r._id) !== String(bookId)).slice(0, limit);
}
