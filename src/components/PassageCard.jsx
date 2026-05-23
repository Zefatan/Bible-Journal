import { useState, useEffect } from 'react';
import { fetchChapter } from '../utils/bibleApi';
import { parseVerses, parseSid } from '../utils/verseParser';
import { loadEntry, saveEntry } from '../utils/storage';
import VerseSelector from './VerseSelector';
import Commentary from './Commentary';

const JOURNAL_FIELDS = [
  { key: 'argument',  label: 'My Argument',  placeholder: "What is the author's main point or argument?", rows: 3 },
  { key: 'gratitude', label: 'Gratitude',     placeholder: 'What are you thankful for today?',            rows: 3 },
  { key: 'apply',     label: 'Apply Today',   placeholder: 'One concrete way to apply this passage today…', rows: 3 },
  { key: 'notes',     label: 'Notes',         placeholder: 'Observations, questions, cross-references…',  rows: 4 },
];

// verseTexts persists verse content so History page can display it without re-fetching.
const EMPTY = { selectedVerses: [], verseTexts: {}, argument: '', gratitude: '', apply: '', notes: '' };

export default function PassageCard({ label, bookId, bookName, chapter, dateKey, passageKey }) {
  const storageKey = `${dateKey}-${passageKey}`;

  const [fetch_, setFetch] = useState({ status: 'idle', content: null, error: null });
  const [verses, setVerses]   = useState([]);
  const [entry, setEntry]     = useState(EMPTY);
  const [saved, setSaved]     = useState(false);

  // ── Fetch passage ────────────────────────────────────────────
  useEffect(() => {
    setFetch({ status: 'loading', content: null, error: null });
    setVerses([]);
    fetchChapter(bookId, chapter)
      .then(data => {
        setFetch({ status: 'ok', content: data.content, error: null });
        setVerses(parseVerses(data.content));
      })
      .catch(err => setFetch({ status: 'error', content: null, error: err.message }));
  }, [bookId, chapter]);

  // ── Load saved journal entry ─────────────────────────────────
  useEffect(() => {
    setEntry(loadEntry(storageKey) ?? EMPTY);
    setSaved(false);
  }, [storageKey]);

  function updateEntry(patch) {
    setSaved(false);
    setEntry(prev => ({ ...prev, ...patch }));
  }

  function handleSave(e) {
    e.preventDefault();
    saveEntry(storageKey, entry);
    setSaved(true);
  }

  const reference = `${bookName} ${chapter}`;

  return (
    <article className="passage-card">

      {/* ── Passage text ──────────────────────────────────────── */}
      <header className="passage-card-header">
        <p className="passage-label">{label}</p>
        <h2 className="passage-reference">{reference}</h2>
      </header>

      {fetch_.status === 'loading' && (
        <p className="passage-loading">Loading passage…</p>
      )}

      {fetch_.status === 'error' && (
        <div className="passage-error">
          {fetch_.error === 'NO_API_KEY' ? (
            <>
              <p>Add your API key to get started.</p>
              <ol>
                <li>Register for free at <strong>scripture.api.bible</strong></li>
                <li>Copy <code>.env.example</code> to <code>.env</code></li>
                <li>Paste your key as <code>VITE_BIBLE_API_KEY=…</code></li>
                <li>Restart the dev server</li>
              </ol>
            </>
          ) : (
            <p>Could not load passage — {fetch_.error}</p>
          )}
        </div>
      )}

      {fetch_.status === 'ok' && (
        <div
          className="passage-text"
          dangerouslySetInnerHTML={{ __html: fetch_.content }}
        />
      )}

      {/* ── Journal (only shown once passage is loaded) ───────── */}
      {fetch_.status === 'ok' && (
        <form className="journal-form" onSubmit={handleSave}>
          <h3 className="section-heading">Journal — {reference}</h3>

          {/* Verse selector */}
          <VerseSelector
            verses={verses}
            selected={entry.selectedVerses}
            onChange={sel => {
              // Also persist the verse text so History can show it without re-fetching
              const verseTexts = {};
              sel.forEach(sid => {
                const v = verses.find(x => x.sid === sid);
                if (v) verseTexts[sid] = v.text;
              });
              updateEntry({ selectedVerses: sel, verseTexts });
            }}
          />

          {/* Selected verse preview — shows selected text right in the journal */}
          {entry.selectedVerses.length > 0 && (
            <div className="selected-verses-preview">
              {entry.selectedVerses.map(sid => {
                const verse = verses.find(v => v.sid === sid);
                if (!verse) return null;
                const { chapter: ch, verse: vNum } = parseSid(sid);
                return (
                  <blockquote key={sid} className="svp-block">
                    <p className="svp-text">{verse.text}</p>
                    <cite className="svp-ref">{bookName} {ch}:{vNum} (NIV)</cite>
                  </blockquote>
                );
              })}
            </div>
          )}

          {JOURNAL_FIELDS.map(({ key, label: lbl, placeholder, rows }) => (
            <div key={key} className="field-group">
              <label htmlFor={`${passageKey}-${key}`} className="field-label">{lbl}</label>
              <textarea
                id={`${passageKey}-${key}`}
                className="field-input"
                placeholder={placeholder}
                value={entry[key]}
                rows={rows}
                onChange={e => updateEntry({ [key]: e.target.value })}
              />
            </div>
          ))}

          <div className="form-footer">
            <button type="submit" className="btn-save">Save Entry</button>
            {saved && <span className="save-confirm">Saved</span>}
          </div>
        </form>
      )}

      {/* ── Commentary ────────────────────────────────────────── */}
      {fetch_.status === 'ok' && (
        <Commentary
          selectedVerses={entry.selectedVerses}
          bookName={bookName}
        />
      )}

    </article>
  );
}
