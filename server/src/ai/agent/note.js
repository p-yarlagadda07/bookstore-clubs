import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { chat, isOllamaUp } from '../ollama.js';

const DISCLAIMER = 'Recommendations only. No book was reserved or selected.';

export function templateNote(shortlist, constraints) {
  if (!shortlist.length) {
    return 'No book fits the time and copies, try a shorter book.';
  }

  const titles = shortlist.map((book) => book.title).join(', ');
  const firstBook = shortlist[0];

  return `For ${constraints.memberCount} members at about ${constraints.pagesPossible} pages, ${titles} fit best. ${firstBook.title} has ${firstBook.copies} copies.`;
}

export async function writeNote(shortlist, constraints) {
  const fallback = `${templateNote(shortlist, constraints)} ${DISCLAIMER}`;

  if (!shortlist.length || !(await isOllamaUp())) {
    return fallback;
  }

  try {
    const bookDetails = shortlist.map((book) => ({
      title: book.title,
      pages: book.pages,
      copies: book.copies,
      timeFit: book.timeFit,
    }));

    const result = await Promise.race([
      chat.invoke([
        new SystemMessage(
          'Write 2 or 3 short friendly sentences for a book club. Only use the facts given. Do not add other books.',
        ),
        new HumanMessage(
          JSON.stringify({
            books: bookDetails,
            memberCount: constraints.memberCount,
            pagesPossible: constraints.pagesPossible,
          }),
        ),
      ]),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Note generation timed out')), 15000);
      }),
    ]);

    const modelNote = result.content.trim();

    if (!modelNote) {
      return fallback;
    }

    return `${modelNote} ${DISCLAIMER}`;
  } catch {
    return fallback;
  }
}
