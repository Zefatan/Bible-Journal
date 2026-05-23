import { useState } from 'react';
import HomePage    from './pages/HomePage';
import JournalPage from './pages/JournalPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [page, setPage] = useState('home'); // 'home' | 'journal' | 'history'

  if (page === 'journal') return <JournalPage onGoHome={() => setPage('home')} />;
  if (page === 'history') return <HistoryPage onGoHome={() => setPage('home')} />;
  return (
    <HomePage
      onOpenJournal={() => setPage('journal')}
      onOpenHistory={() => setPage('history')}
    />
  );
}
