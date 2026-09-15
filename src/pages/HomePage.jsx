import { useMemo, useState } from 'react';
import { getDailyVerse }  from '../utils/dailyVerse';
import { getStreak, getTotalDays, journaledToday } from '../utils/streak';
import { getDailyReadings, formatReadingsSummary, streamProgressInfo } from '../utils/readingPlan';
import { useAuth }        from '../contexts/AuthContext';
import { logoutUser, getUsername, deleteAccount } from '../utils/auth';
import { deleteProfileCloud, saveProfile, resetProgressProfile } from '../utils/profile';
import { deleteAllEntries, clearAllLocalData } from '../utils/storage';
import { cloudDeleteAllEntries } from '../utils/cloudSync';
import {
  requestNotificationPermission, notificationsSupported, sendTestNotification,
  getPermissionState, cancelScheduledNotification,
} from '../utils/notifications';
import ChangePlanPanel from '../components/ChangePlanPanel';
import FeedbackPanel from '../components/FeedbackPanel';
import ThemePicker from '../components/ThemePicker';
import BackgroundPicker from '../components/BackgroundPicker';
import { applyTheme, applyBackground, DEFAULT_THEME } from '../utils/theme';

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Format "HH:MM" (24h) as "6:00 AM" for display */
function formatTime(hhmm) {
  const [h, m] = (hhmm || '06:00').split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function HomePage({ onOpenJournal, onOpenHistory }) {
  const today = useMemo(() => new Date(), []);
  const verse = useMemo(() => getDailyVerse(today), [today]);

  const { user, profile, setProfile } = useAuth();
  const username  = getUsername(user);
  const nickname  = profile?.nickname || username;
  const readings  = useMemo(() => getDailyReadings(profile, today), [profile, today]);
  const summary   = formatReadingsSummary(readings);

  // Bumped after Reset Progress wipes entries, so streak/totalDays recompute
  const [refreshKey, setRefreshKey] = useState(0);
  const streak    = useMemo(() => getStreak(profile?.timezone), [refreshKey, profile?.timezone]);
  const totalDays = useMemo(() => getTotalDays(), [refreshKey]);
  const done      = useMemo(() => journaledToday(profile?.timezone), [refreshKey, profile?.timezone]);

  const [signingOut, setSigningOut] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [reminderDraft, setReminderDraft] = useState(profile?.reminderTime || '06:00');
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifTestMsg, setNotifTestMsg] = useState(null);
  const [notifToggleMsg, setNotifToggleMsg] = useState(null);

  const [showFeedback, setShowFeedback] = useState(false);

  const [showChangePlan, setShowChangePlan] = useState(false);

  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleSignOut() {
    if (!window.confirm('Sign out? Your entries are safely saved to your account.')) return;
    setSigningOut(true);
    clearAllLocalData();
    // Reset appearance immediately so the Sign In screen doesn't briefly
    // show this account's colour/photo before the next reload picks defaults.
    applyTheme(DEFAULT_THEME);
    applyBackground('none', null);
    await logoutUser();
  }

  // ── Reminder time ────────────────────────────────────────────────────────
  async function handleToggleNotif() {
    setNotifBusy(true);
    setNotifToggleMsg(null);
    try {
      if (profile?.notificationsEnabled) {
        // Turning off — also kill the pending timer so it doesn't fire anyway
        cancelScheduledNotification();
        const newProfile = { ...profile, notificationsEnabled: false };
        setProfile(newProfile);
        if (user?.uid) await saveProfile(user.uid, newProfile);
        return;
      }

      if (!notificationsSupported()) {
        setNotifToggleMsg("This browser doesn't support notifications.");
        return;
      }

      const granted = await requestNotificationPermission();
      if (!granted) {
        // Browsers never re-show the permission prompt once denied — the
        // toggle can look "stuck off" with no explanation unless we say so.
        setNotifToggleMsg(
          getPermissionState() === 'denied'
            ? '🚫 Notifications are blocked for this site. Open your browser/app\'s site settings → Notifications → Allow, then try the toggle again.'
            : 'Permission wasn\'t granted — try again and choose "Allow" when prompted.'
        );
        return;
      }

      const newProfile = { ...profile, notificationsEnabled: true, reminderTime: reminderDraft };
      setProfile(newProfile);
      if (user?.uid) await saveProfile(user.uid, newProfile);
    } finally {
      setNotifBusy(false);
    }
  }

  async function handleSaveReminderTime() {
    const newProfile = { ...profile, reminderTime: reminderDraft };
    setProfile(newProfile);
    if (user?.uid) await saveProfile(user.uid, newProfile);
  }

  async function handleThemeChange(theme) {
    const newProfile = { ...profile, theme };
    setProfile(newProfile);
    if (user?.uid) await saveProfile(user.uid, newProfile);
  }

  async function handleBackgroundChange({ background, photoDataUrl }) {
    const newProfile = { ...profile, background, backgroundPhoto: photoDataUrl };
    setProfile(newProfile);
    if (user?.uid) await saveProfile(user.uid, newProfile);
  }

  async function handleTestNotification() {
    setNotifTestMsg('…');
    const res = await sendTestNotification();
    setNotifTestMsg(res.ok ? '✓ Sent — check your notifications.' : res.reason);
    setTimeout(() => setNotifTestMsg(null), 6000);
  }

  // ── Change reading plan ──────────────────────────────────────────────────
  async function handleSavePlan(newProfile) {
    setProfile(newProfile);
    if (user?.uid) await saveProfile(user.uid, newProfile);
    setShowChangePlan(false);
  }

  // ── Reset progress ───────────────────────────────────────────────────────
  async function handleResetProgress() {
    setResetting(true);
    try {
      const reset = resetProgressProfile(profile);
      deleteAllEntries();
      if (user?.uid) {
        await cloudDeleteAllEntries(user.uid);
        await saveProfile(user.uid, reset);
      }
      setProfile(reset);
      setRefreshKey(k => k + 1);
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  }

  // ── Delete account ───────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      clearAllLocalData();
      applyTheme(DEFAULT_THEME);
      applyBackground('none', null);

      if (user?.uid) await deleteProfileCloud(user.uid);
      await deleteAccount(user);
      // Auth state listener in AuthContext will detect user=null and redirect
    } catch (err) {
      setDeleting(false);
      setShowDeleteConfirm(false);
      if (err?.code === 'auth/requires-recent-login') {
        alert('For security, please sign out and sign back in before deleting your account.');
      } else {
        alert('Could not delete account: ' + (err?.message || 'Unknown error'));
      }
    }
  }

  return (
    <div className="home">

      {/* ── Brand header ──────────────────────────────────────── */}
      <header className="home-header">
        <img src="/icon.svg" alt="Bible Journal" className="home-logo" />
        <h1 className="home-title">Bible Journal</h1>
        <p className="home-greeting">{greeting()}, {nickname} 👋</p>
        <p className="home-date">{formatDate(today)}</p>
      </header>

      {/* ── User bar ──────────────────────────────────────────── */}
      {user && (
        <div className="user-bar">
          <span className="user-bar-name">👤 {username}</span>
          <button
            className="user-bar-signout"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
          <button
            className="user-bar-settings-toggle"
            onClick={() => setShowSettings(v => !v)}
            title="Settings"
          >
            ⚙
          </button>
        </div>
      )}

      {/* ── Settings panel ─────────────────────────────────────── */}
      {user && showSettings && (
        <div className="settings-panel">

          {/* Appearance: accent colour + background backdrop */}
          <div className="settings-section">
            <p className="settings-section-title">🎨 Appearance</p>
            <ThemePicker
              value={profile?.theme ?? 'classic'}
              onChange={handleThemeChange}
            />
            <BackgroundPicker
              background={profile?.background ?? 'none'}
              photoDataUrl={profile?.backgroundPhoto}
              onChange={handleBackgroundChange}
            />
          </div>

          {/* Reminder time */}
          <div className="settings-section">
            <p className="settings-section-title">🔔 Daily Reminder</p>
            <div className="settings-reminder-row">
              <button
                className={`settings-notif-toggle ${profile?.notificationsEnabled ? 'settings-notif-toggle--on' : ''}`}
                onClick={handleToggleNotif}
                disabled={notifBusy}
              >
                {profile?.notificationsEnabled ? 'ON' : 'OFF'}
              </button>
              <input
                type="time"
                className="settings-time-input"
                value={reminderDraft}
                onChange={e => setReminderDraft(e.target.value || '06:00')}
                onBlur={handleSaveReminderTime}
              />
              {profile?.notificationsEnabled && (
                <span className="settings-reminder-desc">at {formatTime(profile?.reminderTime)}</span>
              )}
            </div>
            {notifToggleMsg && (
              <p className="settings-hint settings-hint--warn">{notifToggleMsg}</p>
            )}
            {notificationsSupported() && (
              <button className="settings-link-btn" onClick={handleTestNotification}>
                Send a test reminder now
              </button>
            )}
            {notifTestMsg && <p className="settings-hint">{notifTestMsg}</p>}
            {!notificationsSupported() && (
              <p className="settings-hint settings-hint--warn">Your browser doesn't support notifications.</p>
            )}
            <p className="settings-hint">
              Note: reminders fire while the app is open in the background. Closing it fully may stop the timer.
            </p>
          </div>

          {/* Change plan */}
          <div className="settings-section">
            <p className="settings-section-title">📖 Reading Plan</p>
            <button className="settings-action-btn" onClick={() => setShowChangePlan(true)}>
              Change Reading Plan
            </button>
            <p className="settings-hint">Switch tracks, pace, or style — your history is kept.</p>
          </div>

          {/* Reset progress */}
          <div className="settings-section">
            <p className="settings-section-title">🔄 Reset</p>
            {!showResetConfirm ? (
              <button className="settings-action-btn settings-action-btn--warn" onClick={() => setShowResetConfirm(true)}>
                Reset Progress
              </button>
            ) : (
              <div className="settings-confirm-box">
                <p className="settings-confirm-text">
                  This clears every journal entry and restarts your reading tracks from
                  the beginning. Your plan and account stay the same.
                  <strong> This cannot be undone.</strong>
                </p>
                <div className="settings-confirm-actions">
                  <button className="settings-confirm-cancel" onClick={() => setShowResetConfirm(false)} disabled={resetting}>
                    Cancel
                  </button>
                  <button className="settings-confirm-danger" onClick={handleResetProgress} disabled={resetting}>
                    {resetting ? 'Resetting…' : 'Yes, reset progress'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Feedback */}
          <div className="settings-section">
            <p className="settings-section-title">💬 Feedback</p>
            <button className="settings-action-btn" onClick={() => setShowFeedback(true)}>
              Send Feedback
            </button>
            <p className="settings-hint">Report a bug or share an idea — goes to the maker directly.</p>
          </div>

          {/* Delete account */}
          <div className="settings-section">
            <p className="settings-section-title">⚠️ Danger Zone</p>
            {!showDeleteConfirm ? (
              <button className="settings-action-btn settings-action-btn--danger" onClick={() => setShowDeleteConfirm(true)}>
                Delete Account
              </button>
            ) : (
              <div className="settings-confirm-box">
                <p className="settings-confirm-text">
                  This permanently deletes your profile and all reading data.
                  <strong> This cannot be undone.</strong>
                </p>
                <div className="settings-confirm-actions">
                  <button className="settings-confirm-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                    Cancel
                  </button>
                  <button className="settings-confirm-danger" onClick={handleDeleteAccount} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Yes, delete my account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Change Reading Plan modal ───────────────────────────── */}
      {showChangePlan && (
        <ChangePlanPanel
          profile={profile}
          onSave={handleSavePlan}
          onCancel={() => setShowChangePlan(false)}
        />
      )}

      {/* ── Feedback modal ──────────────────────────────────────── */}
      {showFeedback && (
        <FeedbackPanel onClose={() => setShowFeedback(false)} />
      )}

      {/* ── Streak stats ──────────────────────────────────────── */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-icon">🔥</span>
          <span className="stat-number">{streak}</span>
          <span className="stat-label">day streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📖</span>
          <span className="stat-number">{totalDays}</span>
          <span className="stat-label">days journaled</span>
        </div>
      </div>

      {streak === 0 && (
        <p className="home-nudge">Start your streak — open today's journal below.</p>
      )}
      {streak > 0 && !done && (
        <p className="home-nudge">Keep your {streak}-day streak alive — journal today!</p>
      )}
      {done && (
        <p className="home-nudge home-nudge--done">✓ You've journaled today. Great work!</p>
      )}

      {/* ── Verse of the day ──────────────────────────────────── */}
      <div className="home-card verse-of-day">
        <p className="home-card-label">Verse of the Day</p>
        <blockquote className="vod-text">"{verse.text}"</blockquote>
        <cite className="vod-ref">— {verse.ref} (NIV)</cite>
      </div>

      {/* ── Today's reading plan ──────────────────────────────── */}
      <div className="home-card today-card">
        <p className="home-card-label">Today's Reading</p>
        <p className="today-refs">{summary}</p>
        <div className="today-progress">
          {/* Deduplicate: show one progress row per stream, not per chapter */}
          {[...new Map(readings.map(r => [r.streamKey, r])).values()].map(r => {
            const info = streamProgressInfo(profile, r.streamKey);
            const isRandom = (profile?.streamStyles?.[r.streamKey] || profile?.readingStyle) === 'random';
            return (
              <div key={r.streamKey} className="progress-row">
                <div className="progress-row-top">
                  <span className="progress-label">{r.label}</span>
                  {isRandom
                    ? <span className="progress-pct">🎲 Random</span>
                    : <span className="progress-pct">{info.current} / {info.total} chp ({info.pct}%)</span>
                  }
                </div>
                {!isRandom && (
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${info.pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <button className="btn-open-journal" onClick={onOpenJournal}>
        Devotion Journal
      </button>

      <button className="btn-history" onClick={onOpenHistory}>
        📋 Past Entries
      </button>

      {/* Floating feedback button — prominent during user testing */}
      {user && (
        <button
          className="feedback-fab"
          onClick={() => setShowFeedback(true)}
          title="Send feedback"
          aria-label="Send feedback"
        >
          💬 Feedback
        </button>
      )}

    </div>
  );
}
