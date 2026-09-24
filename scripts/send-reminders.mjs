// Sends closed-app daily reminders via FCM. Runs on a GitHub Actions cron
// (.github/workflows/reminders.yml) so the Firebase project can stay on the
// free Spark plan. Needs FIREBASE_SERVICE_ACCOUNT (the service-account JSON).
//
// Cron runs are often late, so a user is "due" any time within WINDOW_MIN
// after their reminder time, and users/{uid}/push/state records which local
// day was already handled so nobody gets two reminders.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const WINDOW_MIN = 180;
const DRY_RUN = process.argv.includes('--dry-run');

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();
const messaging = getMessaging();

function localParts(date, timezone) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(date).map(x => [x.type, x.value])
  );
  return { dateKey: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

/** Returns the local date of the reminder occurrence being handled, or null if not due. */
function dueReminderDate(now, timezone, reminderTime) {
  const [h, m] = (reminderTime || '06:00').split(':').map(Number);
  let local;
  try { local = localParts(now, timezone); } catch { return null; }
  const since = (local.minutes - (h * 60 + m) + 1440) % 1440;
  if (since >= WINDOW_MIN) return null;
  return localParts(new Date(now.getTime() - since * 60000), timezone).dateKey;
}

async function processUser(uid, profile, now) {
  const dateKey = dueReminderDate(now, profile.timezone || 'UTC', profile.reminderTime);
  if (!dateKey) return 'not-due';

  const userRef  = db.collection('users').doc(uid);
  const stateRef = userRef.collection('push').doc('state');
  if ((await stateRef.get()).data()?.lastSentFor === dateKey) return 'already-sent';

  const markHandled = () => DRY_RUN ? null : stateRef.set({ lastSentFor: dateKey }, { merge: true });

  const journaled = await userRef.collection('entries')
    .where('_meta.savedDate', '==', dateKey).limit(1).get();
  if (!journaled.empty) { await markHandled(); return 'journaled'; }

  const tokenSnap = await userRef.collection('pushTokens').get();
  const tokens = tokenSnap.docs.map(d => d.id);
  if (!tokens.length) return 'no-tokens';
  if (DRY_RUN) return `would-send(${tokens.length})`;

  const name = profile.nickname ? `, ${profile.nickname}` : '';
  const res = await messaging.sendEachForMulticast({
    tokens,
    data: { title: 'Daily Bible Journal', body: `📖 Your daily devotion is waiting${name}.` },
    webpush: { headers: { Urgency: 'high', TTL: String(WINDOW_MIN * 60) } },
  });

  const stale = res.responses
    .map((r, i) => (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']
      .includes(r.error?.code) ? tokens[i] : null))
    .filter(Boolean);
  await Promise.all(stale.map(t => userRef.collection('pushTokens').doc(t).delete()));

  if (res.successCount > 0) await markHandled();
  return `sent(${res.successCount}/${tokens.length}, removed ${stale.length})`;
}

const now = new Date();
const profiles = await db.collectionGroup('profile').get();
const tally = {};
for (const snap of profiles.docs) {
  const profile = snap.data();
  if (snap.id !== 'settings' || !profile.notificationsEnabled) continue;
  const uid = snap.ref.parent.parent.id;
  let outcome;
  try { outcome = await processUser(uid, profile, now); }
  catch (err) { outcome = 'error'; console.error(`[${uid}]`, err.message); }
  const bucket = outcome.split('(')[0];
  tally[bucket] = (tally[bucket] || 0) + 1;
  if (bucket !== 'not-due') console.log(`[${uid}] ${outcome}`);
}
console.log(`${now.toISOString()}${DRY_RUN ? ' (dry run)' : ''}`, tally);
if (tally.error) process.exitCode = 1;
