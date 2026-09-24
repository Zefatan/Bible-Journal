import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { app, db, isConfigured } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const TOKEN_KEY = 'bj-push-token';

async function swRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  // Only the production build registers /sw.js; in dev `ready` never resolves.
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise(resolve => setTimeout(() => resolve(null), 5000)),
  ]);
}

/**
 * Subscribes this device to closed-app reminders. Returns true when the
 * device has a push token saved to Firestore; false means the caller should
 * fall back to the in-page timer.
 */
export async function registerPush(uid) {
  if (!isConfigured || !uid || !VAPID_KEY) return false;
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    if (!(await isSupported())) return false;
    const reg = await swRegistration();
    if (!reg) return false;

    const token = await getToken(getMessaging(app), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: reg,
    });
    if (!token) return false;

    await setDoc(doc(db, 'users', uid, 'pushTokens', token), {
      token,
      userAgent: navigator.userAgent.slice(0, 200),
      updatedAt: serverTimestamp(),
    });
    localStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (err) {
    console.warn('[push] registration failed:', err.message);
    return false;
  }
}

/** Detaches this device so a later account on it doesn't get the old user's reminders. */
export async function unregisterPush(uid) {
  const token = localStorage.getItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  if (!isConfigured || !token) return;
  try {
    if (uid) await deleteDoc(doc(db, 'users', uid, 'pushTokens', token));
    if (await isSupported()) await deleteToken(getMessaging(app));
  } catch (err) {
    console.warn('[push] unregister failed:', err.message);
  }
}
