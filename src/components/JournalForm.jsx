import { useState, useEffect } from 'react';
import { loadEntry, saveEntry } from '../utils/storage';

const FIELDS = [
  { key: 'mainVerse',   label: 'Main Verse',   placeholder: 'Which verse stood out most?', multiline: false },
  { key: 'argument',    label: 'My Argument',  placeholder: "What is the author's main point or argument?", multiline: true },
  { key: 'gratitude',   label: 'Gratitude',    placeholder: 'What are you thankful for today?', multiline: true },
  { key: 'apply',       label: 'Apply Today',  placeholder: 'One concrete way to apply this passage today…', multiline: true },
  { key: 'notes',       label: 'Notes',        placeholder: 'Observations, questions, cross-references…', multiline: true },
];

const EMPTY = Object.fromEntries(FIELDS.map((f) => [f.key, '']));

export default function JournalForm({ dateKey }) {
  const [entry, setEntry] = useState(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadEntry(dateKey);
    setEntry(stored ?? EMPTY);
    setSaved(false);
  }, [dateKey]);

  function handleChange(key, value) {
    setSaved(false);
    setEntry((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e) {
    e.preventDefault();
    saveEntry(dateKey, entry);
    setSaved(true);
  }

  return (
    <form className="journal-form" onSubmit={handleSave}>
      <h2 className="section-heading">Journal</h2>

      {FIELDS.map(({ key, label, placeholder, multiline }) => (
        <div key={key} className="field-group">
          <label htmlFor={key} className="field-label">{label}</label>
          {multiline ? (
            <textarea
              id={key}
              className="field-input"
              placeholder={placeholder}
              value={entry[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={4}
            />
          ) : (
            <input
              id={key}
              type="text"
              className="field-input"
              placeholder={placeholder}
              value={entry[key]}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          )}
        </div>
      ))}

      <div className="form-footer">
        <button type="submit" className="btn-save">Save Entry</button>
        {saved && <span className="save-confirm">Saved</span>}
      </div>
    </form>
  );
}
