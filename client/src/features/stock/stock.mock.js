export const stockMockResponse = {
  items: [
    {
      id: "book-001",
      title: "The Midnight Library",
      author: "Matt Haig",
      new: {
        total: 10,
        available: 7,
        held: 3,
      },
      used: {
        total: 5,
        available: 4,
        held: 1,
      },
      status: "available",
    },
    {
      id: "book-002",
      title: "Atomic Habits",
      author: "James Clear",
      new: {
        total: 8,
        available: 6,
        held: 2,
      },
      used: {
        total: 6,
        available: 5,
        held: 1,
      },
      status: "available",
    },
    {
      id: "book-003",
      title: "The Alchemist",
      author: "Paulo Coelho",
      new: {
        total: 6,
        available: 6,
        held: 0,
      },
      used: {
        total: 4,
        available: 3,
        held: 1,
      },
      status: "available",
    },
    {
      id: "book-004",
      title: "Educated",
      author: "Tara Westover",
      new: {
        total: 5,
        available: 2,
        held: 3,
      },
      used: {
        total: 3,
        available: 3,
        held: 0,
      },
      status: "unavailable",
    },
    {
      id: "book-005",
      title: "Pride and Prejudice",
      author: "Jane Austen",
      new: {
        total: 7,
        available: 5,
        held: 2,
      },
      used: {
        total: 8,
        available: 7,
        held: 1,
      },
      status: "available",
    },
  ],
  page: 1,
  limit: 50,
  total: 5,
};

export const pickupMockResponse = {
  items: [
    {
      id: "reservation-001",
      status: "held",
      reader: "Ananya Rao",
      title: "The Midnight Library",
      pickupWindow: "10:00 AM - 12:00 PM",
    },
    {
      id: "reservation-002",
      status: "held",
      reader: "Rahul Sharma",
      title: "Atomic Habits",
      pickupWindow: "12:00 PM - 2:00 PM",
    },
    {
      id: "reservation-003",
      status: "held",
      reader: "Priya Nair",
      title: "Pride and Prejudice",
      pickupWindow: "4:00 PM - 6:00 PM",
    },
  ],
  page: 1,
  limit: 50,
  total: 3,
};