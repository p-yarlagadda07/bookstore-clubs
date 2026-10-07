import { retrieveBookChunks } from './mockRetriever.js';

// mock version for now - real retrieval + ollama come in the next steps
export async function bookChat(_user, { message }) {
  const words = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);

  const chunks = retrieveBookChunks().filter((c) =>
    words.some((w) => c.text.toLowerCase().includes(w)),
  );

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

  return { answer, status: 'answered', citations, conversationId: null };
}
