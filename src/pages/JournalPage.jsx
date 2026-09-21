import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getDailyReadings, formatReadingsSummary, ALL_BOOKS,
  PRESETS, getStreamPosition, getStreamTotal,
} from '../utils/readingPlan';
import { saveProfile } from '../utils/profile';
import { loadEntry } from '../utils/storage';
import PassageCard from '../components/PassageCard';

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function JournalPage({ onGoHome }) {
  const today = useMemo(() => new Date(), []);

  const { profile, user, setProfile } = useAuth();
  const readings = useMemo(() => getDailyReadings(profile, today), [profile, today]);
  const summary  = formatReadingsSummary(readings);

  // Group readings by stream (preserving stream order)
  const streamGroups = useMemo(() => {
    const map   = {};
    const order = [];
    for (const r of readings) {
      if (!map[r.streamKey]) {
        map[r.streamKey] = { streamKey: r.streamKey, label: r.label, entries: [] };
        order.push(r.streamKey);
      }
      map[r.streamKey].entries.push(r);
    }
    return order.map(k => map[k]);
  }, [readings]);

  // Build stream → books lookup for edit pickers
  const preset = PRESETS[profile?.readingPreset] || PRESETS.nt_psalms;
  const streamBooksMap = useMemo(() => {
    const m = {};
    preset.streams.forEach(s => { m[s.key] = s.books; });
    return m;
  }, [preset]);

  function effectiveStyle(streamKey) {
    return (profile?.streamStyles || {})[streamKey] || profile?.readingStyle || 'sequential';
  }

  // ── Edit state ─────────────────────────────────────────────────────────────
  const [editingKey,     setEditingKey]     = useState(null);
  const [editPickerBook, setEditPickerBook] = useState('');
  const [editPickerCh,   setEditPickerCh]   = useState(1);
  const [editPickerStyle, setEditPickerStyle] = useState('sequential'); // per-stream style during edit

  function startEdit(group) {
    const books        = streamBooksMap[group.streamKey] || [];
    const firstEntry   = group.entries[0];
    const bookId       = firstEntry.bookId;
    const chapter      = firstEntry.chapter;
    const validId      = books.find(b => b.id === bookId) ? bookId : books[0]?.id;

    setEditingKey(group.streamKey);
    setEditPickerBook(validId || '');
    setEditPickerCh(chapter);
    setEditPickerStyle(effectiveStyle(group.streamKey));
  }

  function cancelEdit() { setEditingKey(null); }

  async function confirmEdit(streamKey) {
    const books = streamBooksMap[streamKey] || [];
    const book  = books.find(b => b.id === editPickerBook);

    const firstEntry = readings.find(r => r.streamKey === streamKey);
    if (!firstEntry) return;

    let newProfile = {
      ...profile,
      streamStyles: { ...(profile?.streamStyles || {}), [streamKey]: editPickerStyle },
    };

    // Sequential: jump the stream's absolute position straight to the chosen chapter
    if (editPickerStyle === 'sequential' && book) {
      const chapter    = Math.min(editPickerCh, book.chapters);
      const editedPos  = getStreamPosition(books, editPickerBook, chapter);

      newProfile = {
        ...newProfile,
        streamPositions: { ...(profile?.streamPositions || {}), [streamKey]: editedPos },
      };
    }

    setProfile(newProfile);
    if (user?.uid) saveProfile(user.uid, newProfile);
    setEditingKey(null);
  }

  /**
   * Sequential streams don't advance with the calendar — each one moves to
   * its next chapter only once its current chapter has a saved journal
   * entry. Random streams already change daily and are untouched by this gate.
   */
  function handlePassageSubmitted(group) {
    if (effectiveStyle(group.streamKey) !== 'sequential') return;

    const allDone = group.entries.every(r => !!loadEntry(r.passageKey));
    if (!allDone) return;

    const books   = streamBooksMap[group.streamKey] || [];
    const total   = getStreamTotal(books);
    const current = profile?.streamPositions?.[group.streamKey] || 0;
    const nextPos = (current + 1) % total;

    const newProfile = {
      ...profile,
      streamPositions: { ...(profile?.streamPositions || {}), [group.streamKey]: nextPos },
    };
    setProfile(newProfile);
    if (user?.uid) saveProfile(user.uid, newProfile);
  }

  // ── Custom passages (persisted on the profile) ─────────────────────────────
  const customPassages = profile?.customPassages || [];

  const [pickerBook,    setPickerBook]    = useState(ALL_BOOKS[0].id);
  const [pickerChapter, setPickerChapter] = useState(1);

  const pickerBookObj = ALL_BOOKS.find(b => b.id === pickerBook);
  const maxChapter    = pickerBookObj?.chapters || 1;

  function handlePickerBookChange(bookId) {
    setPickerBook(bookId);
    setPickerChapter(1);
  }

  function addCustomPassage() {
    const book = ALL_BOOKS.find(b => b.id === pickerBook);
    if (!book) return;
    const passageKey = `custom_${pickerBook}_${pickerChapter}`;
    if (customPassages.some(p => p.passageKey === passageKey)) return;

    const next = [...customPassages, {
      label:      'Custom Passage',
      bookId:     pickerBook,
      bookName:   book.name,
      chapter:    pickerChapter,
      passageKey,
    }];
    const newProfile = { ...profile, customPassages: next };
    setProfile(newProfile);
    if (user?.uid) saveProfile(user.uid, newProfile);
  }

  function removeCustomPassage(passageKey) {
    // Only removes it from today's view — the journal entry itself (if any)
    // is untouched and still visible in History; use the card's own
    // "Clear" action to actually delete the written content.
    const next = customPassages.filter(p => p.passageKey !== passageKey);
    const newProfile = { ...profile, customPassages: next };
    setProfile(newProfile);
    if (user?.uid) saveProfile(user.uid, newProfile);
  }

  return (
    <div className="app">

      <header className="app-header">
        <button className="btn-back" onClick={onGoHome}>← Home</button>
        <h1 className="app-title">Daily Bible Journal</h1>
        <p className="app-date">{formatDisplayDate(today)}</p>
        <p className="app-readings">{summary}</p>
      </header>

      <main className="app-main">

        {/* ── Scheduled readings (grouped by stream) ──────────── */}
        {streamGroups.map(group => {
          const isEditing  = editingKey === group.streamKey;
          const editBooks  = streamBooksMap[group.streamKey] || [];
          const editBookObj = editBooks.find(b => b.id === editPickerBook);
          const editMaxCh  = editBookObj?.chapters || 1;
          const isSequentialEdit = editPickerStyle === 'sequential';
          const isSequentialGroup = effectiveStyle(group.streamKey) === 'sequential';

          return (
            <div key={group.streamKey} className="journal-sched-wrap">

              {/* Stream header */}
              <div className="journal-sched-header">
                <div className="journal-sched-header-text">
                  <span className="journal-sched-label">{group.label}</span>
                  <span className="journal-sched-hint">
                    {isSequentialGroup
                      ? '📌 Holds until journaled'
                      : '🎲 New passage daily'}
                  </span>
                </div>
                {!isEditing && (
                  <button className="journal-edit-btn" onClick={() => startEdit(group)}>
                    ✏️ Edit
                  </button>
                )}
              </div>

              {/* Inline edit panel */}
              {isEditing && (
                <div className="journal-edit-panel">

                  {/* Reading style toggle */}
                  <div className="journal-edit-style-row">
                    <span className="journal-edit-style-label">Reading style:</span>
                    <div className="journal-edit-style-btns">
                      <button
                        className={`journal-edit-style-opt ${editPickerStyle === 'sequential' ? 'journal-edit-style-opt--active' : ''}`}
                        onClick={() => setEditPickerStyle('sequential')}
                      >
                        📋 In Order
                      </button>
                      <button
                        className={`journal-edit-style-opt ${editPickerStyle === 'random' ? 'journal-edit-style-opt--active' : ''}`}
                        onClick={() => setEditPickerStyle('random')}
                      >
                        🎲 Random
                      </button>
                    </div>
                  </div>

                  {/* Book / chapter picker — only for sequential */}
                  {isSequentialEdit && (
                    <>
                      <div className="journal-edit-row">
                        <select
                          className="journal-add-select"
                          value={editPickerBook}
                          onChange={e => {
                            setEditPickerBook(e.target.value);
                            setEditPickerCh(1);
                          }}
                        >
                          {editBooks.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        <select
                          className="journal-add-chapter"
                          value={editPickerCh}
                          onChange={e => setEditPickerCh(Number(e.target.value))}
                        >
                          {Array.from({ length: editMaxCh }, (_, i) => i + 1).map(ch => (
                            <option key={ch} value={ch}>Ch. {ch}</option>
                          ))}
                        </select>
                      </div>
                      <p className="journal-edit-hint">
                        This passage will hold here until you journal it — then it moves on.
                      </p>
                    </>
                  )}

                  {!isSequentialEdit && (
                    <p className="journal-edit-hint">
                      A fresh random passage will be picked for this track each day.
                    </p>
                  )}

                  <div className="journal-edit-actions">
                    <button className="journal-edit-cancel" onClick={cancelEdit}>
                      ✕ Cancel
                    </button>
                    <button
                      className="journal-edit-confirm"
                      onClick={() => confirmEdit(group.streamKey)}
                    >
                      ✓ Save
                    </button>
                  </div>
                </div>
              )}

              {/* All chapters for this stream */}
              {group.entries.map(r => {
                return (
                  <PassageCard
                    key={r.passageKey}
                    label={group.label}
                    bookId={r.bookId}
                    bookName={r.bookName}
                    chapter={r.chapter}
                    passageKey={r.passageKey}
                    onSaved={() => handlePassageSubmitted(group)}
                  />
                );
              })}
            </div>
          );
        })}

        {/* ── Custom passages ─────────────────────────────────── */}
        {customPassages.map(r => (
          <div key={r.passageKey} className="journal-custom-wrap">
            <div className="journal-custom-header">
              <span className="journal-custom-tag">📖 Custom Passage</span>
              <button
                className="journal-custom-remove"
                onClick={() => removeCustomPassage(r.passageKey)}
              >
                ✕ Remove
              </button>
            </div>
            <PassageCard
              label={r.label && r.label !== r.bookName ? r.label : 'Custom Passage'}
              bookId={r.bookId}
              bookName={r.bookName}
              chapter={r.chapter}
              passageKey={r.passageKey}
            />
          </div>
        ))}

        {/* ── Add custom passage ──────────────────────────────── */}
        <div className="journal-add-passage">
          <p className="journal-add-label">Add a passage</p>
          <div className="journal-add-row">
            <select
              className="journal-add-select"
              value={pickerBook}
              onChange={e => handlePickerBookChange(e.target.value)}
            >
              {ALL_BOOKS.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              className="journal-add-chapter"
              value={pickerChapter}
              onChange={e => setPickerChapter(Number(e.target.value))}
            >
              {Array.from({ length: maxChapter }, (_, i) => i + 1).map(ch => (
                <option key={ch} value={ch}>Ch. {ch}</option>
              ))}
            </select>
            <button className="journal-add-btn" onClick={addCustomPassage}>
              + Add
            </button>
          </div>
        </div>

      </main>

      <footer className="app-footer">
        <p>
          NIV text via{' '}
          <a href="https://scripture.api.bible" target="_blank" rel="noopener noreferrer">
            api.bible
          </a>
        </p>
        <button className="btn-back btn-home-bottom" onClick={onGoHome}>
          ← Back to Home
        </button>
      </footer>

    </div>
  );
}
