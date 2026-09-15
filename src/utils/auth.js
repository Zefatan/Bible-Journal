import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import { auth } from './firebase';

// ── Username → internal email ─────────────────────────────────────────────────
// Firebase Auth requires an email format. We map usernames to a fake local domain
// so users only ever see/type their username (not an email address).
const toEmail = (username) => `${username.toLowerCase().trim()}@bj.local`;

// ── Public username validation ────────────────────────────────────────────────
export function validateUsername(username) {
  if (!username || username.length < 3) return 'Username must be at least 3 characters.';
  if (username.length > 20)            return 'Username must be 20 characters or less.';
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return 'Username can only contain letters, numbers, and underscores.';
  return null; // valid
}

export function validatePassword(password) {
  if (!password || password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// ── Firebase error → human-readable message ───────────────────────────────────
export function parseAuthError(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use':   return 'That username is already taken.';
    case 'auth/user-not-found':          return 'Username not found. Check spelling or create an account.';
    case 'auth/wrong-password':          return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':      return 'Incorrect username or password.';
    case 'auth/invalid-email':           return 'Invalid username format.';
    case 'auth/too-many-requests':       return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':  return 'No internet connection. Please check your network.';
    case 'auth/weak-password':           return 'Password must be at least 6 characters.';
    default:                             return err?.message || 'Something went wrong. Please try again.';
  }
}

// ── Auth operations ───────────────────────────────────────────────────────────
export async function registerUser(username, password) {
  if (!auth) throw new Error('Firebase is not configured. See FIREBASE_SETUP.md.');
  const email = toEmail(username);
  const cred  = await createUserWithEmailAndPassword(auth, email, password);
  // Store the original (cased) username as the display name
  await updateProfile(cred.user, { displayName: username });
  return cred.user;
}

export async function loginUser(username, password) {
  if (!auth) throw new Error('Firebase is not configured. See FIREBASE_SETUP.md.');
  const email = toEmail(username);
  const cred  = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser() {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Permanently deletes the Firebase Auth account for the given user.
 * Throws auth/requires-recent-login if the session is stale — caller
 * should catch that and ask the user to sign out and back in first.
 */
export async function deleteAccount(user) {
  if (!user) return;
  await deleteUser(user);
}

// Returns an unsubscribe function
export function subscribeToAuth(callback) {
  if (!auth) {
    // Firebase not configured — treat as permanently logged-out
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Human-readable username from a Firebase user object
export function getUsername(user) {
  if (!user) return null;
  return user.displayName || user.email?.split('@')[0] || 'User';
}
