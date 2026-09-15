import { dateKeyOf } from './readingPlan';

const PREFIX = 'bj-entry-';

/**
 * Every calendar date that has at least one saved entry, read from each
 * entry's own _meta.savedDate (works regardless of plan/stream — no more
 * hardcoding which stream keys exist). Falls back to parsing a date out of
 * the storage key for entries saved before _meta existed.
 */
function activeDates() {
  const dates = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    let data;
    try { data = JSON.parse(localStorage.getItem(key)); } catch { continue; }
    if (!data) continue;

    if (data._meta?.savedDate) {
      dates.add(data._meta.savedDate);
    } else {
      const legacy = key.slice(PREFIX.length).match(/^(\d{4}-\d{2}-\d{2})-/);
      if (legacy) dates.add(legacy[1]);
    }
  }
  return dates;
}

// Compare using the user's own calendar day (per their profile timezone),
// not UTC — otherwise an early-morning devotion east of UTC (or a late-night
// one west of UTC) gets silently credited to the wrong day and can look like
// a missed/broken streak even though the user journaled every day.
function hasEntry(dates, date, timezone) {
  return dates.has(dateKeyOf(date, timezone));
}

/**
 * Returns the current streak in days.
 * If today has an entry, count from today backward.
 * If today is empty but yesterday has one, the streak is still "alive" — count from yesterday.
 * Otherwise 0.
 */
export function getStreak(timezone) {
  const dates = activeDates();
  const today = new Date();

  let cursor = new Date(today);
  if (!hasEntry(dates, cursor, timezone)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!hasEntry(dates, cursor, timezone)) return 0;
  }

  let streak = 0;
  while (hasEntry(dates, cursor, timezone)) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Total unique days with any saved journal entry. */
export function getTotalDays() {
  return activeDates().size;
}

/** Has the user already journaled today? */
export function journaledToday(timezone) {
  return hasEntry(activeDates(), new Date(), timezone);
}
