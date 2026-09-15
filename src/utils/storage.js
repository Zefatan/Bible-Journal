const PREFIX = 'bj-entry-';
const OWNER_KEY = 'bj-owner-uid';

/**
 * Every piece of local data (entries, profile, theme cache, …) is namespaced
 * under the `bj-` prefix but NOT per-account — so on a shared device, data
 * left behind by one signed-in user could leak into the next account that
 * signs in (their local entries get uploaded to the new account; the new
 * account can even inherit the old profile as a fallback). `bj-owner-uid`
 * records which account the current local cache belongs to, so AuthContext
 * can wipe it before syncing whenever a different account signs in.
 */
export function getLocalOwner() {
  try { return localStorage.getItem(OWNER_KEY); } catch { return null; }
}

export function setLocalOwner(uid) {
  try { localStorage.setItem(OWNER_KEY, uid); } catch { /* ignore */ }
}

/** Wipe every bj-* key (entries, profile, theme, owner marker, …). */
export function clearAllLocalData() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('bj-')) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}

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

/** Remove a single saved entry by its full key (as returned by loadEntry/listEntryDates) */
export function deleteEntry(key) {
  localStorage.removeItem(PREFIX + key);
}

/** Remove every saved journal entry — used by "Reset Progress" */
export function deleteAllEntries() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}
