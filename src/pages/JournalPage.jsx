import { useMemo } from 'react';
import { getScheduleForDate, formatNtRef, formatPsalmRef } from '../utils/schedule';
import PassageCard from '../components/PassageCard';

function formatDisplayDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function JournalPage({ onGoHome }) {
  const schedule = useMemo(() => getScheduleForDate(new Date()), []);

  return (
    <div className="app">

      <header className="app-header">
        <button className="btn-back" onClick={onGoHome}>← Home</button>
        <h1 className="app-title">Daily Bible Journal</h1>
        <p className="app-date">{formatDisplayDate(schedule.dateKey)}</p>
        <p className="app-readings">
          {formatNtRef(schedule.nt)}&nbsp;·&nbsp;{formatPsalmRef(schedule.psalm)}
        </p>
      </header>

      <main className="app-main">
        <PassageCard
          label="New Testament"
          bookId={schedule.nt.bookId}
          bookName={schedule.nt.bookName}
          chapter={schedule.nt.chapter}
          dateKey={schedule.dateKey}
          passageKey="nt"
        />
        <PassageCard
          label="Psalm"
          bookId="PSA"
          bookName="Psalm"
          chapter={schedule.psalm}
          dateKey={schedule.dateKey}
          passageKey="psalm"
        />
      </main>

      <footer className="app-footer">
        <p>
          NIV text via{' '}
          <a href="https://scripture.api.bible" target="_blank" rel="noopener noreferrer">
            api.bible
          </a>
        </p>
      </footer>

    </div>
  );
}
