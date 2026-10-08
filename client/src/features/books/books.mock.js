export const mockBooks = [
  {
    id: 'book-1',
    title: 'The Silent Library',
    authors: ['Maya Rao'],
    themes: ['Mystery', 'Books'],
    moods: ['Calm', 'Curious'],
    pageCount: 280,
    availability: {
      new: 2,
      used: 1,
      reservable: true,
      label: 'Available',
    },
    synopsis:
      'A young student discovers a hidden collection of books that reveals secrets about an old library.',
    chapterCount: 18,
    inventory: [
      {
        id: 'copy-1-new',
        condition: 'new',
        total: 2,
        available: 2,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-1',
            start: '2026-10-18T10:00:00',
            end: '2026-10-18T12:00:00',
          },
        ],
      },
      {
        id: 'copy-1-used',
        condition: 'used',
        total: 1,
        available: 1,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-2',
            start: '2026-10-18T14:00:00',
            end: '2026-10-18T16:00:00',
          },
        ],
      },
    ],
  },

  {
    id: 'book-2',
    title: 'Journey Beyond the Stars',
    authors: ['Arjun Mehta'],
    themes: ['Science Fiction', 'Space'],
    moods: ['Adventurous', 'Exciting'],
    pageCount: 340,
    availability: {
      new: 1,
      used: 0,
      reservable: true,
      label: 'Few left',
    },
    synopsis:
      'A group of students travel across distant planets and discover a mystery that changes their understanding of space.',
    chapterCount: 22,
    inventory: [
      {
        id: 'copy-2-new',
        condition: 'new',
        total: 1,
        available: 1,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-3',
            start: '2026-10-19T10:00:00',
            end: '2026-10-19T12:00:00',
          },
        ],
      },
    ],
  },

  {
    id: 'book-3',
    title: 'Code Your Future',
    authors: ['Riya Sharma'],
    themes: ['Programming', 'Technology'],
    moods: ['Motivational', 'Focused'],
    pageCount: 210,
    availability: {
      new: 0,
      used: 2,
      reservable: true,
      label: 'Available',
    },
    synopsis:
      'A beginner-friendly guide that follows students as they learn programming and build their first software projects.',
    chapterCount: 15,
    inventory: [
      {
        id: 'copy-3-used',
        condition: 'used',
        total: 2,
        available: 2,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-4',
            start: '2026-10-20T10:00:00',
            end: '2026-10-20T12:00:00',
          },
        ],
      },
    ],
  },

  {
    id: 'book-4',
    title: 'The Green Planet',
    authors: ['Neha Kapoor'],
    themes: ['Environment', 'Nature'],
    moods: ['Peaceful', 'Thoughtful'],
    pageCount: 190,
    availability: {
      new: 0,
      used: 0,
      reservable: false,
      label: 'Unavailable',
    },
    synopsis:
      'An exploration of forests, oceans and the people working to protect the natural world.',
    chapterCount: 12,
    inventory: [],
  },

  {
    id: 'book-5',
    title: 'Digital Dreams',
    authors: ['Kiran Patel'],
    themes: ['Technology', 'Innovation'],
    moods: ['Creative', 'Curious'],
    pageCount: 265,
    availability: {
      new: 0,
      used: 0,
      reservable: false,
      label: 'Unavailable',
    },
    synopsis:
      'A story about young innovators creating technology that transforms their community.',
    chapterCount: 17,
    inventory: [],
  },

  {
    id: 'book-6',
    title: 'Mystery at Midnight',
    authors: ['Ananya Iyer'],
    themes: ['Mystery', 'Crime'],
    moods: ['Suspenseful', 'Dark'],
    pageCount: 310,
    availability: {
      new: 1,
      used: 0,
      reservable: true,
      label: 'Few left',
    },
    synopsis:
      'A mysterious event at midnight leads an amateur detective through a series of unexpected clues.',
    chapterCount: 20,
    inventory: [
      {
        id: 'copy-6-new',
        condition: 'new',
        total: 1,
        available: 1,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-5',
            start: '2026-10-21T10:00:00',
            end: '2026-10-21T12:00:00',
          },
        ],
      },
    ],
  },

  {
    id: 'book-7',
    title: 'Waves of Change',
    authors: ['Rahul Verma'],
    themes: ['Society', 'Drama'],
    moods: ['Emotional', 'Hopeful'],
    pageCount: 230,
    availability: {
      new: 3,
      used: 1,
      reservable: true,
      label: 'Available',
    },
    synopsis:
      'A story about friendship, change and the challenges faced by a community during difficult times.',
    chapterCount: 16,
    inventory: [
      {
        id: 'copy-7-new',
        condition: 'new',
        total: 3,
        available: 3,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-6',
            start: '2026-10-22T10:00:00',
            end: '2026-10-22T12:00:00',
          },
        ],
      },
      {
        id: 'copy-7-used',
        condition: 'used',
        total: 1,
        available: 1,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-7',
            start: '2026-10-22T14:00:00',
            end: '2026-10-22T16:00:00',
          },
        ],
      },
    ],
  },

  {
    id: 'book-8',
    title: 'Mindful Moments',
    authors: ['Sara Thomas'],
    themes: ['Self Development', 'Wellness'],
    moods: ['Calm', 'Reflective'],
    pageCount: 150,
    availability: {
      new: 2,
      used: 1,
      reservable: true,
      label: 'Available',
    },
    synopsis:
      'Simple ideas and stories that encourage readers to slow down and appreciate everyday moments.',
    chapterCount: 10,
    inventory: [
      {
        id: 'copy-8-new',
        condition: 'new',
        total: 2,
        available: 2,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-8',
            start: '2026-10-23T10:00:00',
            end: '2026-10-23T12:00:00',
          },
        ],
      },
      {
        id: 'copy-8-used',
        condition: 'used',
        total: 1,
        available: 1,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-9',
            start: '2026-10-23T14:00:00',
            end: '2026-10-23T16:00:00',
          },
        ],
      },
    ],
  },

  {
    id: 'book-9',
    title: 'The Last Explorer',
    authors: ['Vikram Singh'],
    themes: ['Adventure', 'Travel'],
    moods: ['Exciting', 'Adventurous'],
    pageCount: 375,
    availability: {
      new: 1,
      used: 0,
      reservable: true,
      label: 'Few left',
    },
    synopsis:
      'An explorer travels to a remote region searching for a lost scientific expedition.',
    chapterCount: 24,
    inventory: [
      {
        id: 'copy-9-new',
        condition: 'new',
        total: 1,
        available: 1,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-10',
            start: '2026-10-24T10:00:00',
            end: '2026-10-24T12:00:00',
          },
        ],
      },
    ],
  },

  {
    id: 'book-10',
    title: 'Stories from Tomorrow',
    authors: ['Meera Nair'],
    themes: ['Science Fiction', 'Future'],
    moods: ['Hopeful', 'Imaginative'],
    pageCount: 295,
    availability: {
      new: 1,
      used: 1,
      reservable: true,
      label: 'Available',
    },
    synopsis:
      'A collection of futuristic stories imagining how technology could change ordinary human life.',
    chapterCount: 19,
    inventory: [
      {
        id: 'copy-10-new',
        condition: 'new',
        total: 1,
        available: 1,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-11',
            start: '2026-10-25T10:00:00',
            end: '2026-10-25T12:00:00',
          },
        ],
      },
      {
        id: 'copy-10-used',
        condition: 'used',
        total: 1,
        available: 1,
        held: 0,
        status: 'active',
        pickupWindows: [
          {
            _id: 'window-12',
            start: '2026-10-25T14:00:00',
            end: '2026-10-25T16:00:00',
          },
        ],
      },
    ],
  },
];

export function getMockBook(id) {
  return mockBooks.find((book) => book.id === id);
}