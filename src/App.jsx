import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { scheduleNotification, cancelScheduledNotification } from './utils/notifications';
import { applyTheme, saveThemeLocal, DEFAULT_THEME, applyBackground, saveBackgroundLocal } from './utils/theme';
import AuthPage      from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage      from './pages/HomePage';
import JournalPage   from './pages/JournalPage';
import HistoryPage   from './pages/HistoryPage';

function AppRoutes() {
  const { user, syncing, profile, setProfile } = useAuth();
  const [page, setPage] = useState('home');

  // Schedule the daily reminder whenever profile changes — and cancel it
  // outright when notifications are off, so a stale timer never fires.
  useEffect(() => {
    if (profile?.notificationsEnabled && profile?.timezone) {
      scheduleNotification(profile.timezone, profile.reminderTime);
    } else {
      cancelScheduledNotification();
    }
  }, [profile?.notificationsEnabled, profile?.timezone, profile?.reminderTime]);

  // Apply the profile's theme across every page (and cache it for next load).
  useEffect(() => {
    const theme = profile?.theme ?? DEFAULT_THEME;
    applyTheme(theme);
    saveThemeLocal(theme);
  }, [profile?.theme]);

  // Apply the profile's background backdrop (Home/Sign In/Onboarding only —
  // the Journal/History reading surface intentionally stays plain).
  useEffect(() => {
    const background = profile?.background ?? 'none';
    const photoDataUrl = profile?.backgroundPhoto ?? null;
    applyBackground(background, photoDataUrl);
    saveBackgroundLocal(background, photoDataUrl);
  }, [profile?.background, profile?.backgroundPhoto]);

  // ── Checking Firebase auth ────────────────────────────────────
  if (user === undefined) {
    return (
      <div className="app-loading">
        <div className="app-loading-book">
          <img src="/icon.svg" alt="" style={{ width: 72, height: 72 }} />
        </div>
        <p className="app-loading-text">Bible Journal</p>
        <div className="app-loading-dots"><span /><span /><span /></div>
      </div>
    );
  }

  // ── Syncing from cloud ────────────────────────────────────────
  if (syncing) {
    return (
      <div className="app-loading">
        <div className="app-loading-book">☁️</div>
        <p className="app-loading-text">Syncing your journal…</p>
        <div className="app-loading-dots"><span /><span /><span /></div>
      </div>
    );
  }

  // ── Not logged in ─────────────────────────────────────────────
  if (!user) return <AuthPage />;

  // ── Logged in but onboarding not done ─────────────────────────
  if (!profile?.onboardingComplete) {
    return (
      <OnboardingPage
        onComplete={(newProfile) => {
          setProfile(newProfile);
          setPage('home');
        }}
      />
    );
  }

  // ── Normal app routing ────────────────────────────────────────
  if (page === 'journal') return <JournalPage onGoHome={() => setPage('home')} />;
  if (page === 'history') return <HistoryPage onGoHome={() => setPage('home')} />;
  return (
    <HomePage
      onOpenJournal={() => setPage('journal')}
      onOpenHistory={() => setPage('history')}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
