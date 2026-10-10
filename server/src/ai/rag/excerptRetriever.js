import Excerpt from '../ingest/excerpt.model.js';

export async function searchExcerpts(bookId, maxChapter, question, k = 3) {
  const excerpts = await Excerpt.find({
    bookId,
    approved: true,
    chapter: { $lte: maxChapter },
  }).lean();

  const words = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);

  return excerpts
    .map((excerpt) => {
      const text = excerpt.text.toLowerCase();
      const score = words.filter((word) => text.includes(word)).length;

      return { ...excerpt, score };
    })
    .filter((excerpt) => excerpt.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
