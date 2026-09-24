import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import { PRESETS, getDayIndex, getStreamTotal, dateKeyOf } from './readingPlan';

const KEY = 'bj-profile';

export const DEFAULT_PROFILE = {
  nickname:          '',
  timezone:          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  readingPreset:     'nt_only',
  chaptersPerDay:    1,
  readingStyle:      'sequential',
  repeatOnComplete:  false,
  streamPositions:   {},   // per-stream absolute chapter index (sequential progress)
  streamStyles:      {},   // per-stream 'sequential'|'random' overrides
  customPassages:    [],   // user-added one-off passages, persisted across sessions
  notificationsEnabled: false,
  reminderTime:      '06:00', // 24h "HH:MM", customizable reminder hour
  theme:             'classic', // preset key or { custom: '#rrggbb' }
  background:        'none',    // 'none' | 'sunrise' | 'photo'
  backgroundPhoto:   null,      // compressed data URL when background === 'photo'
  onboardingComplete: false,
  startDate: new Date().toISOString().slice(0, 10),
};

// ── Legacy migration ──────────────────────────────────────────────────────────
/**
 * Older profiles stored sequential progress as `streamOffsets`, a correction
 * added to a date-derived position (position = dayIndex*chapPerDay + offset).
 * The reading engine now advances only when the user submits a journal entry,
 * so progress lives in `streamPositions` (an absolute chapter index) instead.
 * This runs once per profile: it freezes "today's" date-derived position as
 * the new starting point, so an existing reader's place is preserved exactly
 * — it just stops moving with the calendar from here on.
 */
function migrateStreamPositions(profile) {
  if (!profile || profile.streamPositions) return profile;

  const preset      = PRESETS[profile.readingPreset] || PRESETS.nt_psalms;
  const chapPerDay  = Math.max(1, profile.chaptersPerDay || 1);
  const dayIndex    = getDayIndex(
    profile.startDate || new Date().toISOString().slice(0, 10),
    new Date(),
    profile.timezone || 'UTC'
  );

  const streamPositions = {};
  preset.streams.forEach(stream => {
    const total  = getStreamTotal(stream.books);
    const legacy = profile.streamOffsets?.[stream.key] || 0;
    streamPositions[stream.key] = ((dayIndex * chapPerDay + legacy) % total + total) % total;
  });

  return { ...profile, streamPositions };
}

// ── Local ─────────────────────────────────────────────────────────────────────
export function loadProfileLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveProfileLocal(profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

// ── Cloud ─────────────────────────────────────────────────────────────────────
export async function saveProfileCloud(uid, profile) {
  if (!isConfigured || !db || !uid) return;
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'settings'), profile, { merge: true });
  } catch (err) {
    console.warn('[profile] cloud save failed:', err.message);
  }
}

export async function loadProfileCloud(uid) {
  if (!isConfigured || !db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'settings'));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

// ── Delete cloud profile ──────────────────────────────────────────────────────
export async function deleteProfileCloud(uid) {
  if (!isConfigured || !db || !uid) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'profile', 'settings'));
  } catch (err) {
    console.warn('[profile] cloud delete failed:', err.message);
  }
}

// ── Combined: save locally and to cloud ──────────────────────────────────────
export async function saveProfile(uid, profile) {
  saveProfileLocal(profile);
  await saveProfileCloud(uid, profile);
}

// ── Load: cloud wins if available (ensures multi-device sync) ─────────────────
export async function loadProfile(uid) {
  const raw = (await loadProfileCloud(uid)) || loadProfileLocal();
  if (!raw) return null;

  const migrated = migrateStreamPositions(raw);
  if (migrated !== raw) {
    // Persist the one-time migration so it doesn't recompute (and can't drift)
    saveProfileLocal(migrated);
    saveProfileCloud(uid, migrated);
    return migrated;
  }
  saveProfileLocal(migrated); // cache locally
  return migrated;
}

// ── Reset progress (keeps plan + settings, wipes reading position) ───────────
/**
 * Returns a copy of the profile with every current stream's position reset
 * to the start, and per-stream style overrides cleared. Journal entries and
 * activity history are cleared separately by the caller (Home page) — this
 * only resets the *plan position*, not the account or its settings.
 */
export function resetProgressProfile(profile) {
  const preset = PRESETS[profile?.readingPreset] || PRESETS.nt_psalms;
  const streamPositions = {};
  preset.streams.forEach(stream => { streamPositions[stream.key] = 0; });

  return {
    ...profile,
    streamPositions,
    streamStyles: {},
    customPassages: [],
    startDate: dateKeyOf(new Date(), profile?.timezone),
  };
}
