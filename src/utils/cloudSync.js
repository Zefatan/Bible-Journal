/**
 * cloudSync.js — Firestore sync helpers for the Bible Journal
 *
 * Strategy:
 *  • On login:    Pull ALL entries from Firestore → write to localStorage
 *                 Then push any localStorage-only entries up to Firestore
 *                 (handles first-time login on a device that already has data)
 *  • On save:     Write to localStorage AND push to Firestore simultaneously
 *  • On logout:   localStorage is cleared by App.jsx for privacy
 */

import {
  doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import { loadEntry, saveEntry, listEntryDates } from './storage';

// ── Save a single entry to Firestore ──────────────────────────────────────────
export async function cloudSave(uid, dateKey, entry) {
  if (!isConfigured || !db || !uid) return;
  try {
    const ref = doc(db, 'users', uid, 'entries', dateKey);
    await setDoc(ref, { ...entry, _savedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    // Non-fatal — local save already succeeded
    console.warn('[cloudSync] save failed:', err.message);
  }
}

// ── Delete a single entry from Firestore ──────────────────────────────────────
export async function cloudDeleteEntry(uid, key) {
  if (!isConfigured || !db || !uid) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'entries', key));
  } catch (err) {
    console.warn('[cloudSync] delete failed:', err.message);
  }
}

// ── Delete every entry from Firestore — used by "Reset Progress" ─────────────
export async function cloudDeleteAllEntries(uid) {
  if (!isConfigured || !db || !uid) return;
  try {
    const ref  = collection(db, 'users', uid, 'entries');
    const snap = await getDocs(ref);
    await Promise.allSettled(snap.docs.map(d => deleteDoc(d.ref)));
  } catch (err) {
    console.warn('[cloudSync] bulk delete failed:', err.message);
  }
}

// ── Pull all entries from Firestore and merge into localStorage ───────────────
export async function syncFromCloud(uid) {
  if (!isConfigured || !db || !uid) return;

  // 1. Fetch all cloud entries
  const ref  = collection(db, 'users', uid, 'entries');
  const snap = await getDocs(ref);

  const cloudKeys = new Set();

  snap.forEach(d => {
    const { _savedAt, ...entry } = d.data();
    cloudKeys.add(d.id);
    // Cloud always wins on login — ensures the same entries appear on every device
    saveEntry(d.id, entry);
  });

  // 2. Push any local-only entries to the cloud (e.g., entries created before
  //    the user created an account, or entries on a device that was offline)
  const localKeys = listEntryDates();
  await Promise.allSettled(
    localKeys
      .filter(k => !cloudKeys.has(k))
      .map(k => {
        const entry = loadEntry(k);
        return entry ? cloudSave(uid, k, entry) : Promise.resolve();
      })
  );
}
