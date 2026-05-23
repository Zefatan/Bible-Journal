/** A day "counts" if there is any saved entry for it (nt or psalm). */
function hasEntry(date) {
  const key = date.toISOString().slice(0, 10);
  return !!(
    localStorage.getItem(`bj-entry-${key}-nt`) ||
    localStorage.getItem(`bj-entry-${key}-psalm`)
  );
}

/**
 * Returns the current streak in days.
 * If today has an entry, count from today backward.
 * If today is empty but yesterday has one, the streak is still "alive" — count from yesterday.
 * Otherwise 0.
 */
export function getStreak() {
  const today = new Date();

  let cursor = new Date(today);
  if (!hasEntry(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!hasEntry(cursor)) return 0;
  }

  let streak = 0;
  while (hasEntry(cursor)) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Total unique days with any saved journal entry. */
export function getTotalDays() {
  const seen = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const m = k?.match(/^bj-entry-(\d{4}-\d{2}-\d{2})-/);
    if (m) seen.add(m[1]);
  }
  return seen.size;
}

/** Has the user already journaled today? */
export function journaledToday() {
  return hasEntry(new Date());
}
