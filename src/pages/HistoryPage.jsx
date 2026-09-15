import { useState, useMemo } from 'react';
import { getAllEntries, hasWrittenContent, formatEntryDate } from '../utils/history';
import { deleteEntry } from '../utils/storage';
import { cloudDeleteEntry } from '../utils/cloudSync';
import { useAuth } from '../contexts/AuthContext';
import { parseSid } from '../utils/verseParser';

const FIELD_LABELS = [
  { key: 'argument',  label: 'My Argument'  },
  { key: 'gratitude', label: 'Gratitude'    },
  { key: 'apply',     label: 'Apply Today'  },
  { key: 'notes',     label: 'Notes'        },
];

// ── Single passage entry inside an expanded card ──────────────────
function PassageSection({ item, onDelete }) {
  const { label, reference, entry } = item;
  const { selectedVerses = [], verseTexts = {} } = entry;
  const hasVerses  = selectedVerses.length > 0;
  const hasWritten = hasWrittenContent(entry);

  return (
    <div className="hist-passage">
      <div className="hist-passage-header">
        <span className="hist-passage-tag">{label}</span>
        <span className="hist-passage-ref">{reference}</span>
        <button className="hist-passage-delete" onClick={onDelete} title="Delete this entry">
          🗑
        </button>
      </div>

      {hasVerses && (
        <div className="hist-verses">
          {selectedVerses.map(sid => {
            const { chapter: ch, verse: vNum } = parseSid(sid);
            const text = verseTexts[sid];
            return (
              <blockquote key={sid} className="hist-verse-block">
                {text
                  ? <p className="hist-verse-text">{text}</p>
                  : <p className="hist-verse-sid-only">{sid}</p>
                }
                <cite className="hist-verse-ref">{reference.split(' ')[0]} {ch}:{vNum} (NIV)</cite>
              </blockquote>
            );
          })}
        </div>
      )}

      {hasWritten && (
        <dl className="hist-fields">
          {FIELD_LABELS.filter(f => entry[f.key]?.trim()).map(({ key, label: fLabel }) => (
            <div key={key} className="hist-field">
              <dt className="hist-field-label">{fLabel}</dt>
              <dd className="hist-field-value">{entry[key]}</dd>
            </div>
          ))}
        </dl>
      )}

      {!hasVerses && !hasWritten && (
        <p className="hist-empty-entry">No content written for this entry.</p>
      )}
    </div>
  );
}

// ── Single date card (may contain several passages that day) ──────
function EntryCard({ group, onDeleteItem }) {
  const [open, setOpen] = useState(false);
  const { dateKey, items } = group;

  const refsPreview = items.map(i => i.reference).join(' · ');

  const previewVerse = useMemo(() => {
    for (const item of items) {
      const { selectedVerses = [], verseTexts = {} } = item.entry;
      if (selectedVerses.length > 0 && verseTexts[selectedVerses[0]]) {
        return verseTexts[selectedVerses[0]];
      }
    }
    return null;
  }, [items]);

  return (
    <article className={`hist-card${open ? ' hist-card--open' : ''}`}>
      <button
        className="hist-card-header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="hist-card-meta">
          <span className="hist-card-date">{formatEntryDate(dateKey)}</span>
          <span className="hist-card-refs">{refsPreview}</span>
        </div>
        <span className="hist-card-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {!open && previewVerse && (
        <p className="hist-card-preview">"{previewVerse}"</p>
      )}
      {!open && !previewVerse && (
        <p className="hist-card-preview hist-card-preview--muted">Entry saved — click to expand.</p>
      )}

      {open && (
        <div className="hist-card-body">
          {items.map(item => (
            <PassageSection key={item.key} item={item} onDelete={() => onDeleteItem(item.key)} />
          ))}
        </div>
      )}
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function HistoryPage({ onGoHome }) {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const groups = useMemo(() => getAllEntries(), [refreshKey]);

  function handleDeleteItem(key) {
    if (!window.confirm('Delete this journal entry? This cannot be undone.')) return;
    deleteEntry(key);
    if (user?.uid) cloudDeleteEntry(user.uid, key);
    setRefreshKey(k => k + 1);
  }

  return (
    <div className="app">
      <header className="app-header" style={{ position: 'relative' }}>
        <button className="btn-back" onClick={onGoHome}>← Home</button>
        <h1 className="app-title">Journal History</h1>
        {groups.length > 0 && (
          <p className="app-date">
            {groups.length} day{groups.length !== 1 ? 's' : ''} on record
          </p>
        )}
        <p className="hist-storage-note">
          Entries are stored in your browser's local storage on this device
          {user ? ' and synced to your account' : ''}.
        </p>
      </header>

      <main className="app-main">
        {groups.length === 0 ? (
          <div className="hist-empty">
            <p className="hist-empty-icon">📖</p>
            <p className="hist-empty-title">No entries yet</p>
            <p className="hist-empty-body">
              Save your first journal entry today — it will appear here.
            </p>
          </div>
        ) : (
          <div className="hist-list">
            {groups.map(group => (
              <EntryCard key={group.dateKey} group={group} onDeleteItem={handleDeleteItem} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
