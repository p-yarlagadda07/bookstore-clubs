export const mockClubs = [
  {
    id: "club-1",
    name: "Tuesday Mystery Circle",
    description:
      "A friendly book club for readers who enjoy mysteries, detective stories, and thrillers.",
    rules: [
      "Be respectful of other members.",
      "Avoid spoilers before the scheduled meeting.",
      "Try to finish the current book before the meeting.",
    ],
    currentBook: {
      title: "The Silent Patient",
      author: "Alex Michaelides",
    },
    meetings: [
      {
        id: "meeting-1",
        date: "October 20, 2026",
        time: "6:00 PM",
        location: "Main Street Bookstore",
        agenda: "Discuss chapters 1–10",
      },
      {
        id: "meeting-2",
        date: "November 3, 2026",
        time: "6:00 PM",
        location: "Main Street Bookstore",
        agenda: "Discuss chapters 11–end",
      },
    ],
  },
  {
    id: "club-2",
    name: "Weekend Classics Club",
    description:
      "A relaxed reading group exploring classic novels and discussing their themes and characters.",
    rules: [
      "Respect different interpretations.",
      "Keep discussions welcoming and inclusive.",
      "Complete the selected reading before meetings.",
    ],
    currentBook: {
      title: "Pride and Prejudice",
      author: "Jane Austen",
    },
    meetings: [
      {
        id: "meeting-3",
        date: "October 24, 2026",
        time: "4:00 PM",
        location: "Independent Bookstore Cafe",
        agenda: "Discuss chapters 1–20",
      },
      {
        id: "meeting-4",
        date: "November 7, 2026",
        time: "4:00 PM",
        location: "Independent Bookstore Cafe",
        agenda: "Discuss chapters 21–end",
      },
    ],
  },
  {
    id: "club-3",
    name: "New Readers Book Club",
    description:
      "A welcoming club for readers who want to discover new authors and build a regular reading habit.",
    rules: [
      "Everyone is welcome.",
      "Share recommendations respectfully.",
      "No pressure to read at the same pace as everyone else.",
    ],
    currentBook: {
      title: "Tomorrow, and Tomorrow, and Tomorrow",
      author: "Gabrielle Zevin",
    },
    meetings: [
      {
        id: "meeting-5",
        date: "October 27, 2026",
        time: "5:30 PM",
        location: "Community Reading Room",
        agenda: "Introductions and discussion of the first half",
      },
    ],
  },
];