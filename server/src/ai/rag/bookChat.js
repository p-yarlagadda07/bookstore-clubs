
import { retrieveBookChunks } from './mockRetriever.js';
import { searchStoreDocs } from './policyRetriever.js';
import { getBoundary } from '../../modules/progress/service.js';
import { buildSystemPrompt } from './prompts.js';

// Mock book retrieval for now; store policy questions use StoreDocs.
export async function bookChat(user, { message, bookId, clubId }) {
  let boundary;

  if (bookId) {
    boundary = await getBoundary(user._id, bookId, clubId);

    if (!boundary.declared) {
      return {
        answer: "Tell me which chapter you're on first, so I don't spoil anything.",
        status: 'needs_progress',
        citations: [],
        conversationId: null,
      };
    }
  } else {
    const docs = await searchStoreDocs(message);

    if (docs.length > 0) {
      const used = docs.slice(0, 2);

      const answer = used
        .map((doc, i) => {
          const sentences = doc.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
          const summary = sentences.slice(0, 2).join(' ').trim();
          return `${summary} [${i + 1}]`;
        })
        .join(' ');

      const citations = used.map((doc, i) => ({
        n: i + 1,
        kind: 'policy',
        title: doc.title,
      }));

      return {
        answer,
        status: 'answered',
        citations,
        conversationId: null,
      };
    }
  }

  const words = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);

  let chunks = retrieveBookChunks().filter((c) =>
    words.some((w) => c.text.toLowerCase().includes(w)),
  );

  if (bookId) {
    chunks = chunks.filter((c) => c.chapter <= boundary.chapter);
  }

  if (chunks.length === 0) {
    return {
      answer: "I don't have approved material about that yet.",
      status: 'not_in_sources',
      citations: [],
      conversationId: null,
    };
  }

  const used = chunks.slice(0, 2);
  const answer = used.map((c, i) => `${c.text} [${i + 1}]`).join(' ');
  const citations = used.map((c, i) => ({
    n: i + 1,
    kind: 'excerpt',
    title: c.title,
    chapter: c.chapter,
    pageStart: c.pageStart,
    pageEnd: c.pageEnd,
  }));

  // Build the prompt with the reader's spoiler boundary.
  if (bookId) {
    buildSystemPrompt(boundary.chapter);
  }

  return { answer, status: 'answered', citations, conversationId: null };
}