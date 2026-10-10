// server/src/ai/embeddings/books.js
import Book from '../../modules/books/model.js';
import { AppError } from '../../lib/AppError.js';
import { embeddings, requireOllama } from '../ollama.js';

export function textForBook(b) {
  return `${b.title}. Themes: ${b.themes.join(', ')}. Mood: ${b.moods.join(', ')}. ${b.synopsis}`;
}

export async function embedBook(id) {
  const book = await Book.findById(id).lean();
  if (!book) throw new AppError('NOT_FOUND', 404, 'Book not found');

  const vector = await embeddings.embedQuery(textForBook(book));
  await Book.updateOne({ _id: id }, { $set: { embedding: vector } });
}

export async function embedAllBooks() {
  await requireOllama();

  const books = await Book.find().select('_id').lean();
  let count = 0;
  for (const b of books) {
    await embedBook(b._id);
    count++;
  }
  return count;
}
