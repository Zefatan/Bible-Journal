/**
 * planPresets.js — Shared plan-selection logic used by both the onboarding
 * wizard and the "Change Reading Plan" panel on the Home page, so there's
 * one definition of "which presets exist at which pace" and how a custom
 * track selection resolves to a preset key.
 */

// ── Pace → available presets mapping ────────────────────────────────────────
// '__custom__' is a special UI entry (not a real preset key) that shows the
// track-toggle picker and resolves to a real preset on save.
export const PACE_PRESETS = {
  1: ['nt_only', 'ot_only', 'psa_only'],
  2: ['nt_psalms', 'full_bible', 'ot_psalms'],
  3: ['full_psalms', '__custom__'],
};
export const DEFAULT_PRESET_FOR_PACE = { 1: 'nt_only', 2: 'nt_psalms', 3: 'full_psalms' };

// The three available tracks for the Customize picker
export const CUSTOM_TRACK_OPTIONS = [
  { key: 'nt',    label: 'New Testament', chapters: 260 },
  { key: 'ot',    label: 'Old Testament', chapters: 929 },
  { key: 'psalm', label: 'Psalms',        chapters: 150 },
];

/** Maps a set of selected track keys → the matching preset key */
export function resolveCustomPreset(tracks) {
  const s = [...tracks].sort().join(',');
  return ({
    'nt':           'nt_only',
    'ot':           'ot_only',
    'psalm':        'psa_only',
    'nt,psalm':     'nt_psalms',
    'ot,psalm':     'ot_psalms',
    'nt,ot':        'full_bible',
    'nt,ot,psalm':  'full_psalms',
  })[s] || 'full_psalms';
}

// ── Dynamic preset description (adapts to style choice) ────────────────────
/**
 * Replaces a static preset.description with a live description. Each stream
 * always contributes exactly 1 chapter/day, so the total is just the number
 * of streams — reading more than 1 chapter of a given book per day is done
 * via "Add a passage", not by this automatic plan.
 *
 * Examples (sequential):
 *   NT only       → "1 chapter/day · ~9 months to complete"
 *   NT + Psalms   → "2 chapters/day · ~9 months to complete"
 * Examples (random):
 *   NT + Psalms   → "2 random chapters/day across 2 tracks"
 */
export function dynamicPresetDesc(streams, style) {
  const totalPerDay = streams.length;
  const chpWord     = totalPerDay === 1 ? 'chapter' : 'chapters';

  if (style === 'random') {
    const trackWord = streams.length === 1 ? '1 track' : `${streams.length} tracks`;
    return `${totalPerDay} random ${chpWord}/day across ${trackWord}`;
  }

  // Longest track determines when the plan "completes" a full cycle
  // (1 chapter/day per stream, so days-to-complete equals its chapter count)
  const days = Math.max(...streams.map(s => s.books.reduce((n, b) => n + b.chapters, 0)));

  function fmt(d) {
    if (d < 60)  return `${d} days`;
    if (d < 365) return `~${Math.round(d / 30)} months`;
    const y = d / 365;
    return y < 2 ? `~${Math.round(y * 12)} months` : `~${y.toFixed(1)} years`;
  }

  return `${totalPerDay} ${chpWord}/day · ${fmt(days)} to complete`;
}

// ── Starting passage helpers ────────────────────────────────────────────────

/** Return the effective starting position, falling back to stream start if invalid */
export function getEffectiveStart(streamKey, books, startPassages) {
  const saved = startPassages[streamKey];
  if (saved) {
    const book = books.find(b => b.id === saved.bookId);
    if (book) {
      return { bookId: saved.bookId, chapter: Math.min(saved.chapter, book.chapters) };
    }
  }
  return { bookId: books[0].id, chapter: 1 };
}

/** Number of chapters before (bookId, chapter) in the book list — i.e. its absolute index */
export function calculateStreamOffset(books, bookId, chapter) {
  let offset = 0;
  for (const book of books) {
    if (book.id === bookId) return offset + Math.max(0, chapter - 1);
    offset += book.chapters;
  }
  return 0;
}
