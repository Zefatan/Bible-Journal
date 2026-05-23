import { useState, useMemo } from 'react';
import {
  getAllEntries,
  hasWrittenContent,
  formatEntryDate,
} from '../utils/history';
import { parseSid } from '../utils/verseParser';

// ── Single passage section inside an expanded card ──────────────
function PassageSection({ title, reference, entry }) {
  if (!entry) return null;

  const { selectedVerses = [], verseTexts = {}, argument, gratitude, apply, notes } = entry;
  const hasVerses  = selectedVerses.length > 0;
  const hasWritten = hasWrittenContent(entry);

  if (!hasVerses && !hasWritten) return null;

  return (
    <div className="hist-passage">
      <div className="hist-passage-header">
        <span className="hist-passage-tag">{title}</span>
        <span className="hist-passage-ref">{reference}</span>
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
          {[
            { key: 'argument',  label: 'My Argument'  },
            { key: 'gratitude', label: 'Gratitude'    },
            { key: 'apply',     label: 'Apply Today'  },
            { key: 'notes',     label: 'Notes'        },
          ].filter(f => entry[f.key]?.trim()).map(({ key, label }) => (
            <div key={key} className="hist-field">
              <dt className="hist-field-label">{label}</dt>
              <dd className="hist-field-value">{entry[key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

// ── Single date entry card ───────────────────────────────────────
function EntryCard({ item }) {
  const [open, setOpen] = useState(false);
  const { dateKey, schedule, nt, psalm } = item;

  const ntRef    = `${schedule.nt.bookName} ${schedule.nt.chapter}`;
  const psalmRef = `Psalm ${schedule.psalm}`;

  const hasAnyContent =
    hasWrittenContent(nt)   || (nt?.selectedVerses?.length   > 0) ||
    hasWrittenContent(psalm) || (psalm?.selectedVerses?.length > 0);

  // Preview: first selected verse text from either passage
  const previewVerse = useMemo(() => {
    for (const entry of [nt, psalm]) {
      if (!entry) continue;
      const { selectedVerses = [], verseTexts = {} } = entry;
      if (selectedVerses.length > 0 && verseTexts[selectedVerses[0]]) {
        return verseTexts[selectedVerses[0]];
      }
    }
    return null;
  }, [nt, psalm]);

  return (
    <article className={`hist-card${open ? ' hist-card--open' : ''}`}>
      <button
        className="hist-card-header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="hist-card-meta">
          <span className="hist-card-date">{formatEntryDate(dateKey)}</span>
          <span className="hist-card-refs">{ntRef} · {psalmRef}</span>
        </div>
        <span className="hist-card-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {/* Collapsed preview */}
      {!open && previewVerse && (
        <p className="hist-card-preview">"{previewVerse}"</p>
      )}
      {!open && !previewVerse && hasAnyContent && (
        <p className="hist-card-preview hist-card-preview--muted">Entry saved — click to expand.</p>
      )}

      {/* Expanded content */}
      {open && (
        <div className="hist-card-body">
          <PassageSection title="New Testament" reference={ntRef}    entry={nt}    />
          <PassageSection title="Psalm"         reference={psalmRef} entry={psalm} />

          {!hasAnyContent && (
            <p className="hist-empty-entry">No content written for this day yet.</p>
          )}
        </div>
      )}
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function HistoryPage({ onGoHome }) {
  const entries = useMemo(() => getAllEntries(), []);

  return (
    <div className="app">
      <header className="app-header" style={{ position: 'relative' }}>
        <button className="btn-back" onClick={onGoHome}>← Home</button>
        <h1 className="app-title">Journal History</h1>
        {entries.length > 0 && (
          <p className="app-date">
            {entries.length} day{entries.length !== 1 ? 's' : ''} on record
          </p>
        )}
        <p className="hist-storage-note">
          Entries are stored in your browser's local storage on this device.
        </p>
      </header>

      <main className="app-main">
        {entries.length === 0 ? (
          <div className="hist-empty">
            <p className="hist-empty-icon">📖</p>
            <p className="hist-empty-title">No entries yet</p>
            <p className="hist-empty-body">
              Save your first journal entry today — it will appear here.
            </p>
          </div>
        ) : (
          <div className="hist-list">
            {entries.map(item => (
              <EntryCard key={item.dateKey} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
