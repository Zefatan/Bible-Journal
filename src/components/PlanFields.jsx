import { PRESETS } from '../utils/readingPlan';
import {
  PACE_PRESETS, CUSTOM_TRACK_OPTIONS, resolveCustomPreset, dynamicPresetDesc,
} from '../utils/planPresets';

/**
 * Shared building blocks for "pick a reading plan" — used by both the
 * onboarding wizard and the Home page's Change Reading Plan panel, so the
 * two never drift out of sync.
 */

// ── Reading style (In Order vs Mixed) ───────────────────────────────────────
export function ReadingStylePicker({ value, onChange }) {
  return (
    <div className="onboard-field">
      <label className="onboard-label">Reading style</label>
      <div className="onboard-choice-group">
        <button
          type="button"
          className={`onboard-choice ${value === 'sequential' ? 'onboard-choice--active' : ''}`}
          onClick={() => onChange('sequential')}
        >
          <span className="onboard-choice-icon">📋</span>
          <span className="onboard-choice-title">In Order</span>
          <span className="onboard-choice-desc">Read books from beginning to end, chapter by chapter</span>
        </button>
        <button
          type="button"
          className={`onboard-choice ${value === 'random' ? 'onboard-choice--active' : ''}`}
          onClick={() => onChange('random')}
        >
          <span className="onboard-choice-icon">🎲</span>
          <span className="onboard-choice-title">Mixed</span>
          <span className="onboard-choice-desc">A different passage every day for variety</span>
        </button>
      </div>
    </div>
  );
}

// ── Chapters per day ─────────────────────────────────────────────────────────
export function PacePicker({ value, onChange }) {
  return (
    <div className="onboard-field">
      <label className="onboard-label">Chapters per day</label>
      <div className="onboard-number-group">
        {[1, 2, 3].map(n => (
          <button
            key={n}
            type="button"
            className={`onboard-num ${value === n ? 'onboard-num--active' : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="onboard-hint">
        {value === 1 && 'One reading track — 1 chapter a day, great for going deep.'}
        {value === 2 && 'Two reading tracks — 1 chapter from each, 2 chapters a day total.'}
        {value === 3 && 'Three reading tracks — 1 chapter from each, 3 chapters a day total.'}
      </p>
    </div>
  );
}

// ── Preset grid, pace-filtered, with a Customize track picker ──────────────
export function PresetPicker({
  chaptersPerDay, readingStyle, readingPreset, setReadingPreset,
  isCustomPicking, setIsCustomPicking, customTracks, setCustomTracks,
}) {
  return (
    <>
      <div className="onboard-preset-group">
        {PACE_PRESETS[chaptersPerDay].map(key => {
          if (key === '__custom__') {
            return (
              <button
                key="__custom__"
                type="button"
                className={`onboard-preset ${isCustomPicking ? 'onboard-preset--active' : ''}`}
                onClick={() => {
                  setIsCustomPicking(true);
                  setReadingPreset(resolveCustomPreset(customTracks));
                }}
              >
                <span className="onboard-preset-name">🎛 Customize</span>
                <span className="onboard-preset-desc">Mix and match NT, OT, and/or Psalms — 1 chapter from each you pick</span>
              </button>
            );
          }
          const preset = PRESETS[key];
          return (
            <button
              key={key}
              type="button"
              className={`onboard-preset ${readingPreset === key && !isCustomPicking ? 'onboard-preset--active' : ''}`}
              onClick={() => { setReadingPreset(key); setIsCustomPicking(false); }}
            >
              <span className="onboard-preset-name">{preset.label}</span>
              <span className="onboard-preset-desc">
                {dynamicPresetDesc(preset.streams, readingStyle)}
              </span>
              {key === 'nt_psalms' && (
                <span className="onboard-preset-badge">Most Popular</span>
              )}
            </button>
          );
        })}
      </div>

      {isCustomPicking && (
        <div className="onboard-custom-tracks">
          <p className="onboard-label">Choose your reading tracks:</p>
          <div className="onboard-track-toggles">
            {CUSTOM_TRACK_OPTIONS.map(track => {
              const isOn = customTracks.includes(track.key);
              return (
                <button
                  key={track.key}
                  type="button"
                  className={`onboard-track-toggle ${isOn ? 'onboard-track-toggle--active' : ''}`}
                  onClick={() => {
                    const next = isOn && customTracks.length > 1
                      ? customTracks.filter(k => k !== track.key)
                      : isOn
                        ? customTracks          // can't deselect the last one
                        : [...customTracks, track.key];
                    setCustomTracks(next);
                    setReadingPreset(resolveCustomPreset(next));
                  }}
                >
                  <span>{track.label}</span>
                  <span className="onboard-track-chapters">{track.chapters} chapters</span>
                </button>
              );
            })}
          </div>
          <p className="onboard-hint">
            → <strong>{PRESETS[readingPreset]?.label}</strong>
            {PRESETS[readingPreset] && (
              <> · {dynamicPresetDesc(PRESETS[readingPreset].streams, readingStyle)}</>
            )}
          </p>
        </div>
      )}
    </>
  );
}

// ── "When you finish a book…" (sequential only) ─────────────────────────────
export function RepeatToggle({ value, onChange }) {
  return (
    <div className="onboard-field" style={{ marginTop: '1.25rem' }}>
      <label className="onboard-label">When you finish a book…</label>
      <div className="onboard-choice-group">
        <button
          type="button"
          className={`onboard-choice ${!value ? 'onboard-choice--active' : ''}`}
          onClick={() => onChange(false)}
        >
          <span className="onboard-choice-icon">➡️</span>
          <span className="onboard-choice-title">Continue</span>
          <span className="onboard-choice-desc">Move on to the next book</span>
        </button>
        <button
          type="button"
          className={`onboard-choice ${value ? 'onboard-choice--active' : ''}`}
          onClick={() => onChange(true)}
        >
          <span className="onboard-choice-icon">🔄</span>
          <span className="onboard-choice-title">Repeat</span>
          <span className="onboard-choice-desc">Read the same book again</span>
        </button>
      </div>
    </div>
  );
}

// ── Single stream's starting book/chapter picker ────────────────────────────
export function StreamStartPicker({ streamLabel, books, value, onChange }) {
  const selectedBook = books.find(b => b.id === value.bookId) || books[0];
  const maxChapter   = selectedBook?.chapters || 1;
  const isDefault    = value.bookId === books[0].id && value.chapter === 1;

  return (
    <div className="onboard-field">
      <label className="onboard-label">{streamLabel}</label>
      <div className="onboard-start-row">
        <select
          className="onboard-select"
          value={value.bookId}
          onChange={e => onChange({ bookId: e.target.value, chapter: 1 })}
        >
          {books.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          className="onboard-select onboard-select--chapter"
          value={value.chapter}
          onChange={e => onChange({ bookId: value.bookId, chapter: Number(e.target.value) })}
        >
          {Array.from({ length: maxChapter }, (_, i) => i + 1).map(ch => (
            <option key={ch} value={ch}>Ch. {ch}</option>
          ))}
        </select>
      </div>
      <p
        className="onboard-hint"
        style={isDefault ? {} : { color: 'var(--accent)', fontWeight: 500 }}
      >
        {isDefault
          ? 'Starting from the beginning ✓'
          : `Continuing from ${selectedBook.name} ${value.chapter}`}
      </p>
    </div>
  );
}
