// most of our seed books already have readingHours; older ones only have a page count
export function readingHours(book) {
  const hours = book.readingHours ?? (book.pageCount ? book.pageCount / 40 : null);
  if (!hours) return null;

  const rounded = Math.max(1, Math.round(hours));
  return rounded === 1 ? 'about 1 hour' : `about ${rounded} hours`;
}
