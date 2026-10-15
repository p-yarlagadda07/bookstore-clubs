export function whyItMatched(query, book) {
  const q = query.toLowerCase();

  const hits = [...(book.themes ?? []), ...(book.moods ?? [])].filter((word) =>
    q.includes(word.toLowerCase()),
  );

  if (hits.length) {
    return `Matches ${hits.slice(0, 3).join(', ')}`;
  }

  return 'Close to how you described it';
}
