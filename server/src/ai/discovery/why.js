
export function whyItMatched(query, book) {
  const q = query.toLowerCase();

  const words = [...(book.themes ?? []), ...(book.moods ?? [])];

  const hits = words.filter(
    (word) => word && q.includes(word.toLowerCase()),
  );

  if (hits.length) {
    return `Matches ${hits.slice(0, 3).join(', ')}`;
  }

  const synopsis = book.synopsis ?? '';
  const title = book.title ?? '';

  const queryWords = q
    .split(/[^a-z0-9]+/)
    .filter(
  (word) =>
    word.length > 3 &&
    ![
      'about',
      'with',
      'from',
      'that',
      'this',
      'book',
      'story',
      'something',
      'their',
      'there',
      'where',
      'when',
      'what',
      'have',
      'your',
      'into',
    ].includes(word),
);

  const synopsisLower = synopsis.toLowerCase();
  const titleLower = title.toLowerCase();

  const matchedWords = queryWords.filter(
    (word) => synopsisLower.includes(word) || titleLower.includes(word),
  );

  if (matchedWords.length) {
    return `Related to: ${matchedWords.slice(0, 3).join(', ')}`;
  }

  return 'Close to how you described it';
}
