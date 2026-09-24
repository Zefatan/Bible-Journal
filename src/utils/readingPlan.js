/**
 * readingPlan.js — Dynamic Bible reading plan engine
 * Supports sequential/random reading across all 66 books of the Bible.
 */

// ── Complete Bible book catalog ───────────────────────────────────────────────
export const OT_BOOKS = [
  { id: 'GEN', name: 'Genesis',         chapters: 50 },
  { id: 'EXO', name: 'Exodus',          chapters: 40 },
  { id: 'LEV', name: 'Leviticus',       chapters: 27 },
  { id: 'NUM', name: 'Numbers',         chapters: 36 },
  { id: 'DEU', name: 'Deuteronomy',     chapters: 34 },
  { id: 'JOS', name: 'Joshua',          chapters: 24 },
  { id: 'JDG', name: 'Judges',          chapters: 21 },
  { id: 'RUT', name: 'Ruth',            chapters:  4 },
  { id: '1SA', name: '1 Samuel',        chapters: 31 },
  { id: '2SA', name: '2 Samuel',        chapters: 24 },
  { id: '1KI', name: '1 Kings',         chapters: 22 },
  { id: '2KI', name: '2 Kings',         chapters: 25 },
  { id: '1CH', name: '1 Chronicles',    chapters: 29 },
  { id: '2CH', name: '2 Chronicles',    chapters: 36 },
  { id: 'EZR', name: 'Ezra',            chapters: 10 },
  { id: 'NEH', name: 'Nehemiah',        chapters: 13 },
  { id: 'EST', name: 'Esther',          chapters: 10 },
  { id: 'JOB', name: 'Job',             chapters: 42 },
  { id: 'PRO', name: 'Proverbs',        chapters: 31 },
  { id: 'ECC', name: 'Ecclesiastes',    chapters: 12 },
  { id: 'SNG', name: 'Song of Solomon', chapters:  8 },
  { id: 'ISA', name: 'Isaiah',          chapters: 66 },
  { id: 'JER', name: 'Jeremiah',        chapters: 52 },
  { id: 'LAM', name: 'Lamentations',    chapters:  5 },
  { id: 'EZK', name: 'Ezekiel',         chapters: 48 },
  { id: 'DAN', name: 'Daniel',          chapters: 12 },
  { id: 'HOS', name: 'Hosea',           chapters: 14 },
  { id: 'JOL', name: 'Joel',            chapters:  3 },
  { id: 'AMO', name: 'Amos',            chapters:  9 },
  { id: 'OBA', name: 'Obadiah',         chapters:  1 },
  { id: 'JON', name: 'Jonah',           chapters:  4 },
  { id: 'MIC', name: 'Micah',           chapters:  7 },
  { id: 'NAM', name: 'Nahum',           chapters:  3 },
  { id: 'HAB', name: 'Habakkuk',        chapters:  3 },
  { id: 'ZEP', name: 'Zephaniah',       chapters:  3 },
  { id: 'HAG', name: 'Haggai',          chapters:  2 },
  { id: 'ZEC', name: 'Zechariah',       chapters: 14 },
  { id: 'MAL', name: 'Malachi',         chapters:  4 },
];

export const PSALMS = [
  { id: 'PSA', name: 'Psalms', chapters: 150 },
];

export const NT_BOOKS = [
  { id: 'MAT', name: 'Matthew',          chapters: 28 },
  { id: 'MRK', name: 'Mark',             chapters: 16 },
  { id: 'LUK', name: 'Luke',             chapters: 24 },
  { id: 'JHN', name: 'John',             chapters: 21 },
  { id: 'ACT', name: 'Acts',             chapters: 28 },
  { id: 'ROM', name: 'Romans',           chapters: 16 },
  { id: '1CO', name: '1 Corinthians',    chapters: 16 },
  { id: '2CO', name: '2 Corinthians',    chapters: 13 },
  { id: 'GAL', name: 'Galatians',        chapters:  6 },
  { id: 'EPH', name: 'Ephesians',        chapters:  6 },
  { id: 'PHP', name: 'Philippians',      chapters:  4 },
  { id: 'COL', name: 'Colossians',       chapters:  4 },
  { id: '1TH', name: '1 Thessalonians',  chapters:  5 },
  { id: '2TH', name: '2 Thessalonians',  chapters:  3 },
  { id: '1TI', name: '1 Timothy',        chapters:  6 },
  { id: '2TI', name: '2 Timothy',        chapters:  4 },
  { id: 'TIT', name: 'Titus',            chapters:  3 },
  { id: 'PHM', name: 'Philemon',         chapters:  1 },
  { id: 'HEB', name: 'Hebrews',          chapters: 13 },
  { id: 'JAS', name: 'James',            chapters:  5 },
  { id: '1PE', name: '1 Peter',          chapters:  5 },
  { id: '2PE', name: '2 Peter',          chapters:  3 },
  { id: '1JN', name: '1 John',           chapters:  5 },
  { id: '2JN', name: '2 John',           chapters:  1 },
  { id: '3JN', name: '3 John',           chapters:  1 },
  { id: 'JUD', name: 'Jude',             chapters:  1 },
  { id: 'REV', name: 'Revelation',       chapters: 22 },
];

// All 66 books in canonical order (Psalms inserted between Job and Proverbs)
export const ALL_BOOKS = [
  ...OT_BOOKS.slice(0, 18),  // GEN → JOB
  ...PSALMS,                   // PSA
  ...OT_BOOKS.slice(18),      // PRO → MAL
  ...NT_BOOKS,
];

// ── Reading presets ───────────────────────────────────────────────────────────
// Each preset defines one or more "streams" (parallel reading tracks).
// stream.key is used as the localStorage / Firestore entry key.
export const PRESETS = {
  // ── 1 chapter / day ────────────────────────────────────────────────────────
  nt_only: {
    label: 'New Testament',
    streams: [{ label: 'New Testament', books: NT_BOOKS, key: 'nt' }],
  },
  ot_only: {
    label: 'Old Testament',
    streams: [{ label: 'Old Testament', books: OT_BOOKS, key: 'ot' }],
  },
  psa_only: {
    label: 'Psalms',
    streams: [{ label: 'Psalms', books: PSALMS, key: 'psalm' }],
  },

  // ── 2 chapters / day ───────────────────────────────────────────────────────
  nt_psalms: {
    label: 'NT + Psalms',
    streams: [
      { label: 'New Testament', books: NT_BOOKS, key: 'nt'    },
      { label: 'Psalms',        books: PSALMS,   key: 'psalm' },
    ],
  },
  full_bible: {
    label: 'Full Bible (OT + NT)',
    streams: [
      { label: 'Old Testament', books: OT_BOOKS, key: 'ot' },
      { label: 'New Testament', books: NT_BOOKS, key: 'nt' },
    ],
  },
  ot_psalms: {
    label: 'OT + Psalms',
    streams: [
      { label: 'Old Testament', books: OT_BOOKS, key: 'ot'    },
      { label: 'Psalms',        books: PSALMS,   key: 'psalm' },
    ],
  },

  // ── 3 chapters / day ───────────────────────────────────────────────────────
  full_psalms: {
    label: 'Full Bible + Psalms',
    streams: [
      { label: 'Old Testament', books: OT_BOOKS, key: 'ot'    },
      { label: 'New Testament', books: NT_BOOKS, key: 'nt'    },
      { label: 'Psalms',        books: PSALMS,   key: 'psalm' },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a flat array of every {bookId, bookName, chapter} in a book list */
function buildSequence(books) {
  const seq = [];
  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      seq.push({ bookId: book.id, bookName: book.name, chapter: ch });
    }
  }
  return seq;
}

/** Deterministic seeded random (LCG) — returns 0..1 */
function seededRandom(seed) {
  const s = Math.abs((1664525 * (seed | 0) + 1013904223) & 0x7fffffff);
  return s / 0x7fffffff;
}

/** Day index from startDate to date, adjusted for user's timezone */
export function getDayIndex(startDate, date, timezone) {
  const fmt = (d) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'UTC' }).format(d);
  const startMs = new Date(fmt(new Date(startDate + 'T00:00:00'))).getTime();
  const todayMs = new Date(fmt(date)).getTime();
  return Math.max(0, Math.floor((todayMs - startMs) / 86400000));
}

/**
 * YYYY-MM-DD for `date` in the given IANA timezone — this is "what calendar
 * day is it for this user right now", NOT `date.toISOString()` (which is UTC
 * and silently shifts the date for anyone outside UTC — e.g. a devotion done
 * at 6am in Jakarta, UTC+7, is still "yesterday" in UTC until 7am). Every
 * place that stamps or compares "today" for streaks/entries should use this.
 */
export function dateKeyOf(date, timezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'UTC' }).format(date);
}

// ── Main API ──────────────────────────────────────────────────────────────────

/**
 * Returns today's reading schedule based on the user's profile — exactly one
 * chapter per stream, always. "chaptersPerDay" only controls how many
 * streams/tracks a preset bundles (1 stream at pace 1, 2 at pace 2, …), not
 * how many chapters come out of a single stream — a user who wants more than
 * one chapter of a given book per day adds it via "Add a passage" instead.
 * Each item: { label, bookId, bookName, chapter, passageKey, streamKey, streamStyle }
 *
 * streamStyles (profile.streamStyles) lets individual streams override the
 * global readingStyle — e.g. one stream sequential, another random.
 *
 * Sequential streams do NOT advance with the calendar. Their position comes
 * from profile.streamPositions[streamKey] (an absolute chapter index) which
 * only moves forward once the user has journaled that chapter — see
 * JournalPage's submission gate. This is why the same chapter keeps showing
 * up day after day until it's actually read.
 *
 * Random streams are unaffected by that gate — they intentionally serve a
 * fresh passage every calendar day.
 */
export function getDailyReadings(profile, date = new Date()) {
  const preset          = PRESETS[profile?.readingPreset] || PRESETS.nt_psalms;
  const globalStyle     = profile?.readingStyle    || 'sequential';
  const timezone        = profile?.timezone        || 'UTC';
  const streamPositions = profile?.streamPositions || {};
  const streamStyles    = profile?.streamStyles    || {};

  const todayKey = dateKeyOf(date, timezone);
  const readings = [];

  preset.streams.forEach((stream, si) => {
    const seq         = buildSequence(stream.books);
    const total       = seq.length;
    const streamStyle = streamStyles[stream.key] || globalStyle;

    let entry, passageKey;

    if (streamStyle === 'random') {
      // Deterministic per-day seed — same passage all day, new one tomorrow
      const dayIndex = getDayIndex(profile?.startDate || todayKey, date, timezone);
      const idx = Math.floor(seededRandom(dayIndex * 37 + si * 13) * total);
      entry = seq[idx % total];
      passageKey = `rnd_${stream.key}_${todayKey}`;
    } else {
      const position = streamPositions[stream.key] || 0;
      entry = seq[position % total];
      // Content-addressed: stable across days until the position advances,
      // so an unsubmitted passage's draft/slot survives crossing midnight.
      passageKey = `seq_${stream.key}_${entry.bookId}_${entry.chapter}`;
    }

    readings.push({
      label:      stream.label,
      bookId:     entry.bookId,
      bookName:   entry.bookName,
      chapter:    entry.chapter,
      passageKey,
      streamKey:  stream.key,
      streamStyle,
    });
  });

  return readings;
}

/** Human-readable summary: "Luke 7 · Psalm 1" — one chapter per stream */
export function formatReadingsSummary(readings) {
  return readings.map(r => `${r.bookName} ${r.chapter}`).join(' · ');
}

/**
 * Returns the 0-based index of (bookId, chapter) in the flat chapter sequence
 * of the given book list. Used to set/re-anchor a stream's absolute position.
 */
export function getStreamPosition(books, bookId, chapter) {
  let pos = 0;
  for (const book of books) {
    if (book.id === bookId) return pos + Math.max(0, chapter - 1);
    pos += book.chapters;
  }
  return 0;
}

/** Total chapters in a stream's book list */
export function getStreamTotal(books) {
  return books.reduce((s, b) => s + b.chapters, 0);
}

// Note: journaling progress (shown on Home) is verse-based, not position-based
// — see utils/progress.js's streamJournaledProgress. Reading position here is
// only used to pick the next chapter, not to report "how much progress" was made.
