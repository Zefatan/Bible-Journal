/**
 * notifications.js — daily reminder scheduling at a user-chosen hour
 *
 * Uses the browser Notifications API + service worker.
 * The notification fires at profile.reminderTime (default 06:00) in the
 * user's local timezone.
 * Note: requires the browser (or PWA) to be running in the background.
 */

let _scheduledTimer = null;

/** Request permission to show notifications. Returns true if granted. */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Returns true if the browser supports and has granted notifications */
export function notificationsSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function notificationsGranted() {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Raw permission state: 'granted' | 'denied' | 'default' | 'unsupported'.
 * Once a user (or browser) sets it to 'denied', no amount of in-app toggling
 * can re-prompt — that's a hard browser restriction. The UI needs to detect
 * this and point the user at their browser/site settings instead of silently
 * failing to turn back on.
 */
export function getPermissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Calculate milliseconds until the next occurrence of reminderTime ("HH:MM",
 * 24h) in the given IANA timezone.
 */
function msUntilNextReminder(timezone, reminderTime = '06:00') {
  const now = new Date();
  const [targetH, targetM] = reminderTime.split(':').map(Number);

  // Get current time components in the user's timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour:   'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const h = parseInt(parts.find(p => p.type === 'hour').value,   10);
  const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
  const s = parseInt(parts.find(p => p.type === 'second').value, 10);

  const nowSec    = h * 3600 + m * 60 + s;
  const targetSec = (targetH || 0) * 3600 + (targetM || 0) * 60;

  const delta = nowSec < targetSec
    ? targetSec - nowSec                // today's reminder hasn't passed
    : 86400 - nowSec + targetSec;       // schedule for tomorrow's reminder

  return delta * 1000;
}

/**
 * Show the notification using the service worker (works even when tab is in background).
 */
async function showNotification() {
  try {
    // navigator.serviceWorker.ready never resolves if no SW is registered
    // (e.g. dev mode, where registration is PROD-only) — race it so the
    // fallback Notification API kicks in instead of hanging forever.
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('no service worker')), 1500)),
    ]);
    await reg.showNotification('Daily Bible Journal', {
      body:    '📖 Your daily devotion is waiting.',
      icon:    '/icon.svg',
      badge:   '/icon.svg',
      tag:     'daily-reminder',
      vibrate: [200, 100, 200],
      actions: [{ action: 'open', title: 'Open Journal' }],
      requireInteraction: false,
    });
  } catch {
    // Fallback to basic Notification API
    new Notification('Daily Bible Journal', {
      body: '📖 Your daily devotion is waiting.',
      icon: '/icon.svg',
    });
  }
}

/**
 * Schedule (or re-schedule) the daily reminder notification at reminderTime.
 * Call this once when the app loads if notifications are enabled, and again
 * whenever the timezone or reminder time changes. It auto-reschedules every day.
 */
export function scheduleNotification(timezone = 'UTC', reminderTime = '06:00') {
  if (!notificationsGranted()) return;

  // Clear any previously scheduled timer
  if (_scheduledTimer) clearTimeout(_scheduledTimer);

  const ms = msUntilNextReminder(timezone, reminderTime);
  const hrs = (ms / 3600000).toFixed(1);
  console.log(`[notifications] Next reminder in ${hrs}h (${timezone} @ ${reminderTime})`);

  _scheduledTimer = setTimeout(async () => {
    await showNotification();
    // Reschedule for the following day
    scheduleNotification(timezone, reminderTime);
  }, ms);
}

/** Cancel the scheduled notification timer */
export function cancelScheduledNotification() {
  if (_scheduledTimer) {
    clearTimeout(_scheduledTimer);
    _scheduledTimer = null;
  }
}

/**
 * Fire a reminder immediately so the user can confirm notifications actually
 * work on their device/browser. Requests permission first if needed.
 * Returns { ok, reason } — reason explains any failure for the UI to show.
 */
export async function sendTestNotification() {
  if (!('Notification' in window)) {
    return { ok: false, reason: 'This browser has no notification support.' };
  }
  const granted = await requestNotificationPermission();
  if (!granted) {
    return { ok: false, reason: 'Notifications are blocked. Enable them in your browser/app settings.' };
  }
  await showNotification();
  return { ok: true };
}
