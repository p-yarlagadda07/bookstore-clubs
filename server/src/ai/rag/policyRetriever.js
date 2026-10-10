import StoreDoc from '../ingest/storeDoc.model.js';

export async function searchStoreDocs(question, k = 2) {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);

  if (words.length === 0) {
    return [];
  }

  const docs = await StoreDoc.find({}).select('title type text').lean();

  return docs
    .map((doc) => {
      const title = doc.title.toLowerCase();
      const text = doc.text.toLowerCase();

      const score = words.filter((word) => title.includes(word) || text.includes(word)).length;

      return {
        id: doc._id,
        title: doc.title,
        type: doc.type,
        text: doc.text,
        score,
      };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
