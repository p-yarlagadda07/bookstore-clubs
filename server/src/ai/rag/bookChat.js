import { searchExcerpts } from './excerptRetriever.js';
import { searchStoreDocs } from './policyRetriever.js';
import { getBoundary } from '../../modules/progress/service.js';
import { saveTurn } from '../../modules/conversations/service.js';
import { buildSystemPrompt } from './prompts.js';
import { chat, isOllamaUp } from '../ollama.js';
import { logger } from '../../lib/logger.js';

async function saveResult(user, input, result) {
  const conversationId = await saveTurn(
    user,
    {
      conversationId: input.conversationId,
      kind: input.bookId ? 'book' : 'shop',
      bookId: input.bookId,
      clubId: input.clubId,
    },
    input.message,
    result,
  );

  return { ...result, conversationId };
}

function quoteDocs(docs) {
  return docs
    .map((doc, i) => {
      const sentences = doc.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
      return `${sentences.slice(0, 2).join(' ').trim()} [${i + 1}]`;
    })
    .join(' ');
}

export async function bookChat(user, { message, bookId, clubId, conversationId }) {
  if (!bookId) {
    const docs = (await searchStoreDocs(message)).slice(0, 2);

    if (docs.length === 0) {
      return saveResult(
        user,
        { message, bookId, clubId, conversationId },
        {
          answer: "I don't have approved material about that yet.",
          status: 'not_in_sources',
          citations: [],
        },
      );
    }

    const context = docs.map((doc, i) => `[${i + 1}] ${doc.title}\n${doc.text}`).join('\n\n');

    const citations = docs.map((doc, i) => ({
      n: i + 1,
      kind: 'policy',
      title: doc.title,
    }));

    let answer = quoteDocs(docs);

    if (await isOllamaUp()) {
      try {
        const res = await chat.invoke([
          [
            'system',
            "Answer only from the store documents provided. Cite claims using [1] or [2]. If the answer isn't in the documents, say you don't know. Do not invent store policies.",
          ],
          ['human', `CONTEXT:\n${context}\n\nQUESTION: ${message}`],
        ]);

        answer = String(res.content);
      } catch (err) {
        logger.warn({ err }, 'shop answer fell back to quotes');
      }
    }

    return saveResult(
      user,
      { message, bookId, clubId, conversationId },
      {
        answer,
        status: 'answered',
        citations,
      },
    );
  }

  const boundary = await getBoundary(user._id, bookId, clubId);

  if (!boundary.declared) {
    return saveResult(
      user,
      { message, bookId, clubId, conversationId },
      {
        answer: "Tell me which chapter you're on first, so I don't spoil anything.",
        status: 'needs_progress',
        citations: [],
      },
    );
  }

  const chunks = await searchExcerpts(bookId, boundary.chapter, message);

  if (chunks.length === 0) {
    return saveResult(
      user,
      { message, bookId, clubId, conversationId },
      {
        answer: "I don't have approved material about that yet.",
        status: 'not_in_sources',
        citations: [],
      },
    );
  }

  const context = chunks
    .map((chunk, i) => `[${i + 1}] (chapter ${chunk.chapter}) ${chunk.text}`)
    .join('\n\n');

  let answer;

  if (await isOllamaUp()) {
    try {
      const res = await chat.invoke([
        ['system', buildSystemPrompt(boundary.chapter)],
        ['human', `CONTEXT:\n${context}\n\nQUESTION: ${message}`],
      ]);

      answer = String(res.content);
    } catch {
      answer = chunks
        .slice(0, 2)
        .map((chunk, i) => `${chunk.text} [${i + 1}]`)
        .join(' ');
    }
  } else {
    answer = chunks
      .slice(0, 2)
      .map((chunk, i) => `${chunk.text} [${i + 1}]`)
      .join(' ');
  }

  const citations = chunks.map((chunk, i) => ({
    n: i + 1,
    kind: 'excerpt',
    chapter: chunk.chapter,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
  }));

  return saveResult(
    user,
    { message, bookId, clubId, conversationId },
    {
      answer,
      status: 'answered',
      citations,
    },
  );
}
