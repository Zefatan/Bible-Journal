import { getScheduleForDate } from './schedule';

/**
 * Load every saved journal entry from localStorage, grouped by date.
 * Returns an array sorted newest-first:
 * [{ dateKey, schedule, nt: entryObj|null, psalm: entryObj|null }, …]
 */
export function getAllEntries() {
  const dateMap = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const match = key?.match(/^bj-entry-(\d{4}-\d{2}-\d{2})-(nt|psalm)$/);
    if (!match) continue;

    const [, dateKey, passageKey] = match;
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (!data) continue;
      if (!dateMap[dateKey]) dateMap[dateKey] = {};
      dateMap[dateKey][passageKey] = data;
    } catch {
      // skip malformed entries
    }
  }

  return Object.entries(dateMap)
    .sort(([a], [b]) => b.localeCompare(a))   // newest first
    .map(([dateKey, passages]) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      const schedule = getScheduleForDate(new Date(y, m - 1, d));
      return { dateKey, schedule, ...passages };
    });
}

/** True if an entry has any written content (beyond just selecting verses). */
export function hasWrittenContent(entry) {
  if (!entry) return false;
  return ['argument', 'gratitude', 'apply', 'notes'].some(k => entry[k]?.trim());
}

/** Format dateKey as a readable string. */
export function formatEntryDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

/** Delete a single passage entry; returns true if deleted. */
export function deleteEntry(dateKey, passageKey) {
  const key = `bj-entry-${dateKey}-${passageKey}`;
  if (!localStorage.getItem(key)) return false;
  localStorage.removeItem(key);
  return true;
}
