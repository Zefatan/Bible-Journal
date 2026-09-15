const PREFIX = 'bj-entry-';

/**
 * Load every saved journal entry from localStorage, grouped by the calendar
 * date it was journaled on (entry._meta.savedDate), newest first. Each entry
 * carries its own label/reference in _meta, so History renders correctly
 * regardless of what the user's *current* plan looks like — switching plans
 * or resetting progress never breaks old entries.
 *
 * Legacy entries saved before _meta existed fall back to the date baked into
 * their old `{dateKey}-{passageKey}` storage key.
 *
 * Returns: [{ dateKey, items: [{ key, label, reference, entry }] }, …]
 */
export function getAllEntries() {
  const byDate = {};

  for (let i = 0; i < localStorage.length; i++) {
    const rawKey = localStorage.key(i);
    if (!rawKey?.startsWith(PREFIX)) continue;
    const key = rawKey.slice(PREFIX.length);

    let entry;
    try { entry = JSON.parse(localStorage.getItem(rawKey)); } catch { continue; }
    if (!entry) continue;

    const meta         = entry._meta || {};
    const legacyMatch  = key.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
    const savedDate    = meta.savedDate || legacyMatch?.[1];
    if (!savedDate) continue; // can't place it on the timeline — skip

    const reference = meta.bookName
      ? `${meta.bookName} ${meta.chapter}`
      : (legacyMatch?.[2] ?? 'Entry');
    const label = meta.label || reference;

    (byDate[savedDate] ??= []).push({ key, label, reference, entry });
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, items]) => ({
      dateKey,
      items: items.sort((a, b) => a.key.localeCompare(b.key)),
    }));
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
