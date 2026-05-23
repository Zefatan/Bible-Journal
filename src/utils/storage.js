const PREFIX = 'bj-entry-';

export function loadEntry(dateKey) {
  try {
    const raw = localStorage.getItem(PREFIX + dateKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveEntry(dateKey, entry) {
  localStorage.setItem(PREFIX + dateKey, JSON.stringify(entry));
}

export function listEntryDates() {
  const dates = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) dates.push(key.slice(PREFIX.length));
  }
  return dates.sort().reverse();
}
