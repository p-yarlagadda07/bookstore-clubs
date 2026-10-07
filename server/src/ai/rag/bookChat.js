import { retrieveBookChunks } from './mockRetriever.js';

export async function bookChat(user, { message, bookId, clubId }) {
  const chunks = retrieveBookChunks();

  const answer =
    `Based on the available approved material, the book introduces its ` +
    `main characters and setting, and then develops a central conflict. [1]`;

  const citations = chunks.slice(0, 1).map((chunk, index) => ({
    n: index + 1,
    kind: 'excerpt',
    title: chunk.title,
    chapter: chunk.chapter,
    pageStart: 1,
    pageEnd: 2,
  }));

  return {
    answer,
    status: 'answered',
    citations,
    conversationId: null,
  };
}