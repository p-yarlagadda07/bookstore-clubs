import { searchExcerpts } from './excerptRetriever.js';
import { searchStoreDocs } from './policyRetriever.js';
import { getBoundary } from '../../modules/progress/service.js';
import { buildSystemPrompt } from './prompts.js';
import { chat, isOllamaUp } from '../ollama.js';

// Book chat uses approved excerpts; store policy questions use StoreDocs.
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

return {
  answer: "I don't have approved material about that yet.",
  status: 'not_in_sources',
  citations: [],
  conversationId: null,
};

}

const chunks = await searchExcerpts(bookId, boundary.chapter, message);

if (chunks.length === 0) {
return {
answer: "I don't have approved material about that yet.",
status: 'not_in_sources',
citations: [],
conversationId: null,
};
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
answer = res.content;
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

return { answer, status: 'answered', citations, conversationId: null };
}