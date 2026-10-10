import { embeddings, requireOllama } from '../ollama.js';
import Book from '../../modules/books/model.js';

export async function vectorSearchBooks(q, limit) {
  await requireOllama();
  const vector = await embeddings.embedQuery(q);

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