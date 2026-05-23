// NT reading plan: starts at Luke 7 on May 23 2026, one chapter per day
const START_DATE = new Date('2026-05-23T00:00:00');

// Books from Luke onward, in canonical order
// startChapter lets us handle the mid-book start at Luke 7
const NT_BOOKS = [
  { id: 'LUK', name: 'Luke',            chapters: 24, startChapter: 7 },
  { id: 'JHN', name: 'John',            chapters: 21 },
  { id: 'ACT', name: 'Acts',            chapters: 28 },
  { id: 'ROM', name: 'Romans',          chapters: 16 },
  { id: '1CO', name: '1 Corinthians',   chapters: 16 },
  { id: '2CO', name: '2 Corinthians',   chapters: 13 },
  { id: 'GAL', name: 'Galatians',       chapters: 6  },
  { id: 'EPH', name: 'Ephesians',       chapters: 6  },
  { id: 'PHP', name: 'Philippians',     chapters: 4  },
  { id: 'COL', name: 'Colossians',      chapters: 4  },
  { id: '1TH', name: '1 Thessalonians', chapters: 5  },
  { id: '2TH', name: '2 Thessalonians', chapters: 3  },
  { id: '1TI', name: '1 Timothy',       chapters: 6  },
  { id: '2TI', name: '2 Timothy',       chapters: 4  },
  { id: 'TIT', name: 'Titus',           chapters: 3  },
  { id: 'PHM', name: 'Philemon',        chapters: 1  },
  { id: 'HEB', name: 'Hebrews',         chapters: 13 },
  { id: 'JAS', name: 'James',           chapters: 5  },
  { id: '1PE', name: '1 Peter',         chapters: 5  },
  { id: '2PE', name: '2 Peter',         chapters: 3  },
  { id: '1JN', name: '1 John',          chapters: 5  },
  { id: '2JN', name: '2 John',          chapters: 1  },
  { id: '3JN', name: '3 John',          chapters: 1  },
  { id: 'JUD', name: 'Jude',            chapters: 1  },
  { id: 'REV', name: 'Revelation',      chapters: 22 },
];

// Build a flat ordered list of all chapters in the plan
const NT_SEQUENCE = [];
for (const book of NT_BOOKS) {
  const start = book.startChapter ?? 1;
  for (let ch = start; ch <= book.chapters; ch++) {
    NT_SEQUENCE.push({ bookId: book.id, bookName: book.name, chapter: ch });
  }
}

const PSALM_COUNT = 150;

/**
 * Returns the NT chapter and Psalm assigned for a given date.
 * Wraps back to the beginning when the sequence is exhausted.
 */
export function getScheduleForDate(date = new Date()) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayIndex = Math.max(0, Math.floor((date - START_DATE) / msPerDay));

  const ntEntry = NT_SEQUENCE[dayIndex % NT_SEQUENCE.length];
  const psalmNumber = (dayIndex % PSALM_COUNT) + 1;

  return {
    dayIndex,
    nt: ntEntry,
    psalm: psalmNumber,
    dateKey: date.toISOString().slice(0, 10),
  };
}

export function formatNtRef(nt) {
  return `${nt.bookName} ${nt.chapter}`;
}

export function formatPsalmRef(psalm) {
  return `Psalm ${psalm}`;
}
