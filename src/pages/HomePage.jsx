import { useMemo } from 'react';
import { getDailyVerse } from '../utils/dailyVerse';
import { getStreak, getTotalDays, journaledToday } from '../utils/streak';
import { getScheduleForDate, formatNtRef, formatPsalmRef } from '../utils/schedule';

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function HomePage({ onOpenJournal, onOpenHistory }) {
  const today      = useMemo(() => new Date(), []);
  const verse      = useMemo(() => getDailyVerse(today), [today]);
  const streak     = useMemo(() => getStreak(), []);
  const totalDays  = useMemo(() => getTotalDays(), []);
  const done       = useMemo(() => journaledToday(), []);
  const schedule   = useMemo(() => getScheduleForDate(today), [today]);

  return (
    <div className="home">

      {/* ── Brand header ──────────────────────────────────────── */}
      <header className="home-header">
        <p className="home-eyebrow">Daily</p>
        <h1 className="home-title">Bible Journal</h1>
        <p className="home-date">{formatDate(today)}</p>
      </header>

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
        <p className="today-refs">
          {formatNtRef(schedule.nt)}
          <span className="today-dot">·</span>
          {formatPsalmRef(schedule.psalm)}
        </p>
      </div>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <button className="btn-open-journal" onClick={onOpenJournal}>
        Devotion Journal
      </button>

      <button className="btn-history" onClick={onOpenHistory}>
        📋 Past Entries
      </button>

    </div>
  );
}
