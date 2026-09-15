/**
 * progress.js — journaling progress, measured in verses actually journaled
 * rather than how far the reading schedule has advanced. A user who has read
 * ahead but skipped writing anything down shows little progress here; a user
 * who journals thoroughly on fewer chapters shows more — the metric tracks
 * engagement with the text, not position in it.
 */
import { parseSid } from './verseParser';
import { PRESETS } from './readingPlan';
import { getBooksVerseTotal } from './verseCounts';

const PREFIX = 'bj-entry-';

/** Every distinct verse sid ("BOOKID CHAPTER:VERSE") journaled across all saved entries. */
function allJournaledSids() {
  const sids = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    let data;
    try { data = JSON.parse(localStorage.getItem(key)); } catch { continue; }
    (data?.selectedVerses || []).forEach(sid => sids.add(sid));
  }
  return sids;
}

/**
 * Verse-based progress for a stream: { pct, current, total }
 *   total   — every verse in the stream's books (e.g. all of the NT)
 *   current — how many of those verses have been journaled (selected as a
 *             main verse in some saved entry, scheduled or custom)
 *   pct     — current / total, 0–100
 */
export function streamJournaledProgress(profile, streamKey) {
  const preset = PRESETS[profile?.readingPreset] || PRESETS.nt_psalms;
  const stream = preset.streams.find(s => s.key === streamKey);
  if (!stream) return { pct: 0, current: 0, total: 0 };

  const bookIds = new Set(stream.books.map(b => b.id));
  const total   = getBooksVerseTotal(stream.books);

  let current = 0;
  for (const sid of allJournaledSids()) {
    if (bookIds.has(parseSid(sid).bookId)) current++;
  }

  const pct = total ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return { pct, current, total };
}
