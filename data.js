export const STORAGE_KEY = "leo-mohan-reader-library";
export const SESSION_KEY = "leo-mohan-reader-session";

export const seedData = {
  settings: {
    libraryName: "Leo Mohan Reader Library",
    authorName: "Leo Mohan",
    authorEmail: "hello@leomohan.net",
    registrationApprovalEmail: "leomohan@yahoo.com",
    website: "https://www.leomohan.net",
    about:
      "Leo Mohan writes across technology, business, education, spirituality, religion, motivation, and fiction. This reader space helps approved members discover new releases, revisit timeless titles, and stay close to the ideas behind each book.",
    latestRelease: "The Digital Mindset for Human-Centered Leadership",
    latestReleaseNote:
      "A practical guide to leading with wisdom, technology fluency, and moral clarity in rapidly changing times.",
  },
  news: [
    {
      id: "news-1",
      title: "New release announcement",
      date: "2026-04-12",
      body: "The latest release explores how leaders can embrace AI, ethics, and resilient culture without losing the human heart of business.",
    },
    {
      id: "news-2",
      title: "Reader circle update",
      date: "2026-03-28",
      body: "Monthly reader Q&A notes are now available inside the library for approved members.",
    },
  ],
  users: [
    {
      id: "user-admin",
      role: "admin",
      name: "Leo Mohan",
      email: "hello@leomohan.net",
      username: "admin",
      password: "change-me-now",
      approvedAt: "2026-04-01T09:00:00.000Z",
    },
    {
      id: "user-reader-1",
      role: "reader",
      name: "Anita Joseph",
      email: "anita@example.com",
      username: "anita",
      password: "reader123",
      approvedAt: "2026-04-10T10:00:00.000Z",
    },
  ],
  registrationRequests: [
    {
      id: "req-1",
      name: "Samuel George",
      email: "samuel@example.com",
      interests: "Technology, Motivation",
      message: "I would love access to your latest practical business and AI writing.",
      status: "pending",
      createdAt: "2026-04-20T11:30:00.000Z",
    },
  ],
  books: [
    {
      id: "book-tech-1",
      title: "The Digital Mindset for Human-Centered Leadership",
      genre: "Technology",
      status: "active",
      isFree: false,
      summary:
        "A leadership guide for using emerging technologies with wisdom, discernment, and empathy.",
      description:
        "This book helps leaders, founders, and change-makers understand how to work with technology without becoming servants to it. It blends strategic thinking, practical scenarios, and values-based leadership.",
      thumbnail:
        "linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #7dd3fc 100%)",
      coverAccent: "#e0f2fe",
      freeContent:
        "",
      storeLinks: {
        amazon: "https://www.amazon.com/",
        smashwords: "https://www.smashwords.com/",
      },
    },
    {
      id: "book-business-1",
      title: "Business With Integrity",
      genre: "Business",
      status: "active",
      isFree: true,
      summary:
        "A concise handbook on building trust-centered organizations in uncertain markets.",
      description:
        "From customer loyalty to long-term strategy, this title argues that moral clarity is a practical business advantage, not a sentimental luxury.",
      thumbnail:
        "linear-gradient(135deg, #1f2937 0%, #b45309 50%, #fde68a 100%)",
      coverAccent: "#fff7ed",
      freeContent:
        "Chapter 1: Integrity is not a decorative value. It shapes hiring, partnerships, pricing, and the energy a team brings into the marketplace.\n\nChapter 2: Trust compounds quietly. Customers return when they sense consistency between what a company says and what it truly practices.\n\nChapter 3: Leadership credibility begins in the small decisions nobody applauds but everybody eventually feels.",
      storeLinks: {
        amazon: "",
        smashwords: "",
      },
    },
    {
      id: "book-education-1",
      title: "Future-Ready Learning",
      genre: "Education",
      status: "active",
      isFree: false,
      summary:
        "An education-focused reflection on curiosity, relevance, and learning for a changing world.",
      description:
        "Teachers, institutions, and lifelong learners are invited to rethink how knowledge, character, and creativity can grow together.",
      thumbnail:
        "linear-gradient(135deg, #083344 0%, #0f766e 50%, #99f6e4 100%)",
      coverAccent: "#ccfbf1",
      freeContent: "",
      storeLinks: {
        amazon: "https://www.amazon.com/",
        smashwords: "https://www.smashwords.com/",
      },
    },
    {
      id: "book-spiritual-1",
      title: "Quiet Strength for Restless Hearts",
      genre: "Spiritual",
      status: "active",
      isFree: true,
      summary:
        "Short spiritual reflections for people carrying pressure, hope, and unanswered questions.",
      description:
        "This meditative work invites readers into stillness, courage, and a more centered inner life through accessible reflections and prayers.",
      thumbnail:
        "linear-gradient(135deg, #3f3cbb 0%, #6366f1 40%, #c4b5fd 100%)",
      coverAccent: "#ede9fe",
      freeContent:
        "Reflection 1: Silence is not emptiness. It is often where courage is reassembled.\n\nReflection 2: A hurried soul can still learn to breathe, listen, and trust again.\n\nReflection 3: Strength grows when we surrender the need to carry every burden alone.",
      storeLinks: {
        amazon: "",
        smashwords: "",
      },
    },
    {
      id: "book-religious-1",
      title: "Faith, Practice, and Daily Conviction",
      genre: "Religious",
      status: "active",
      isFree: false,
      summary:
        "A reflective exploration of doctrine, devotion, and everyday discipleship.",
      description:
        "Designed for thoughtful readers who want faith to move beyond ritual into lived character, discipline, and service.",
      thumbnail:
        "linear-gradient(135deg, #3b0764 0%, #7e22ce 45%, #f0abfc 100%)",
      coverAccent: "#fae8ff",
      freeContent: "",
      storeLinks: {
        amazon: "https://www.amazon.com/",
        smashwords: "https://www.smashwords.com/",
      },
    },
    {
      id: "book-motivation-1",
      title: "Rise Again",
      genre: "Motivation",
      status: "active",
      isFree: true,
      summary:
        "A motivational companion for readers rebuilding momentum after setbacks and delays.",
      description:
        "This book offers grounded encouragement, practical mindset reframes, and short exercises for rediscovering disciplined hope.",
      thumbnail:
        "linear-gradient(135deg, #7c2d12 0%, #ea580c 40%, #fdba74 100%)",
      coverAccent: "#ffedd5",
      freeContent:
        "Lesson 1: Start where you are, not where you wish you had begun.\n\nLesson 2: Discouragement speaks loudly, but it is not always telling the truth.\n\nLesson 3: Progress is often disguised as a series of very ordinary faithful steps.",
      storeLinks: {
        amazon: "",
        smashwords: "",
      },
    },
    {
      id: "book-fiction-1",
      title: "The Lantern Beyond the Rain",
      genre: "Fiction",
      status: "active",
      isFree: false,
      summary:
        "A character-driven novel about memory, calling, and courage in a city of secrets.",
      description:
        "A quiet, atmospheric story where personal loss opens the door to mystery, healing, and a final choice that changes many lives.",
      thumbnail:
        "linear-gradient(135deg, #111827 0%, #334155 45%, #a5b4fc 100%)",
      coverAccent: "#e0e7ff",
      freeContent: "",
      storeLinks: {
        amazon: "https://www.amazon.com/",
        smashwords: "https://www.smashwords.com/",
      },
    },
  ],
  comments: [
    {
      id: "comment-1",
      bookId: "book-business-1",
      userId: "user-reader-1",
      userName: "Anita Joseph",
      message: "Clear, practical, and uplifting. I especially appreciated the section on trust.",
      createdAt: "2026-04-11T12:00:00.000Z",
    },
  ],
  ratings: [
    {
      id: "rating-1",
      bookId: "book-business-1",
      userId: "user-reader-1",
      value: 5,
    },
  ],
};
