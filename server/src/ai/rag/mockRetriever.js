const mockChunks = [
  {
    id: 'chunk-1',
    text: 'The story introduces the main characters and establishes the setting of the book.',
    chapter: 1,
    pageStart: 1,
    pageEnd: 12,
    title: 'Introduction',
  },
  {
    id: 'chunk-2',
    text: 'The main character begins to understand the central conflict and the challenges they must face.',
    chapter: 2,
    pageStart: 13,
    pageEnd: 27,
    title: 'The Conflict',
  },
  {
    id: 'chunk-3',
    text: 'The characters discuss their goals and make plans to deal with the problems introduced earlier.',
    chapter: 3,
    pageStart: 28,
    pageEnd: 41,
    title: 'Plans',
  },
  {
    id: 'chunk-4',
    text: 'The chapter focuses on the characters learning from their experiences and developing their understanding.',
    chapter: 4,
    pageStart: 42,
    pageEnd: 55,
    title: 'Learning',
  },
];

export function retrieveBookChunks() {
  return mockChunks;
}
