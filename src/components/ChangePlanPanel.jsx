import { useState } from 'react';
import { PRESETS } from '../utils/readingPlan';
import {
  PACE_PRESETS, DEFAULT_PRESET_FOR_PACE, getEffectiveStart, calculateStreamOffset,
} from '../utils/planPresets';
import {
  ReadingStylePicker, PacePicker, PresetPicker, RepeatToggle, StreamStartPicker,
} from './PlanFields';

/** Is `preset` one of the pace's named options, or reachable via that pace's Customize picker? */
function validForPace(preset, pace) {
  const list = PACE_PRESETS[pace] || [];
  return list.includes(preset) || list.includes('__custom__');
}

export default function ChangePlanPanel({ profile, onSave, onCancel }) {
  const [readingStyle,   setReadingStyle]   = useState(profile?.readingStyle || 'sequential');
  const [chaptersPerDay, setChaptersPerDay] = useState(profile?.chaptersPerDay || 1);

  const initialPreset = validForPace(profile?.readingPreset, profile?.chaptersPerDay || 1)
    ? (profile?.readingPreset || 'nt_only')
    : DEFAULT_PRESET_FOR_PACE[profile?.chaptersPerDay || 1];

  const [readingPreset,   setReadingPreset]   = useState(initialPreset);
  const [isCustomPicking, setIsCustomPicking] = useState(false);
  const [customTracks,    setCustomTracks]    = useState(
    PRESETS[initialPreset]?.streams.map(s => s.key) || ['nt', 'ot', 'psalm']
  );
  const [repeatOnComplete, setRepeatOnComplete] = useState(profile?.repeatOnComplete || false);
  const [startPassages,    setStartPassages]    = useState({});

  const isSequential = readingStyle === 'sequential';

  function handlePaceChange(n) {
    setChaptersPerDay(n);
    const list        = PACE_PRESETS[n];
    const realPresets = list.filter(k => k !== '__custom__');
    if (!realPresets.includes(readingPreset)) {
      setReadingPreset(DEFAULT_PRESET_FOR_PACE[n]);
      setIsCustomPicking(false);
    }
  }

  // Streams that exist in the CURRENT (pre-change) plan keep their progress;
  // only genuinely new streams need a starting passage chosen.
  const oldStreamKeys = new Set((PRESETS[profile?.readingPreset]?.streams || []).map(s => s.key));
  const newStreams = (PRESETS[readingPreset]?.streams || []).filter(s => !oldStreamKeys.has(s.key));

  function handleSave() {
    const streamPositions = { ...(profile?.streamPositions || {}) };
    const streamStyles    = {};

    PRESETS[readingPreset].streams.forEach(stream => {
      if (!oldStreamKeys.has(stream.key)) {
        // New stream — start from the chosen (or default) starting passage
        const start = getEffectiveStart(stream.key, stream.books, startPassages);
        streamPositions[stream.key] = calculateStreamOffset(stream.books, start.bookId, start.chapter);
      }
      // Carry over any existing per-stream style override
      if (profile?.streamStyles?.[stream.key]) {
        streamStyles[stream.key] = profile.streamStyles[stream.key];
      }
    });

    onSave({
      ...profile,
      readingStyle,
      chaptersPerDay,
      readingPreset,
      repeatOnComplete: isSequential ? repeatOnComplete : false,
      streamPositions,
      streamStyles,
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel change-plan-panel">
        <h2 className="modal-title">📖 Change Reading Plan</h2>
        <p className="modal-sub">
          Your journal history stays exactly as it is — this only changes what you read next.
        </p>

        <ReadingStylePicker value={readingStyle} onChange={setReadingStyle} />
        <PacePicker value={chaptersPerDay} onChange={handlePaceChange} />

        <PresetPicker
          chaptersPerDay={chaptersPerDay}
          readingStyle={readingStyle}
          readingPreset={readingPreset}
          setReadingPreset={setReadingPreset}
          isCustomPicking={isCustomPicking}
          setIsCustomPicking={setIsCustomPicking}
          customTracks={customTracks}
          setCustomTracks={setCustomTracks}
        />

        {isSequential && (
          <RepeatToggle value={repeatOnComplete} onChange={setRepeatOnComplete} />
        )}

        {isSequential && newStreams.length > 0 && (
          <div className="onboard-field" style={{ marginTop: '1rem' }}>
            <label className="onboard-label">Starting point for new track{newStreams.length > 1 ? 's' : ''}</label>
            {newStreams.map(stream => (
              <StreamStartPicker
                key={stream.key}
                streamLabel={stream.label}
                books={stream.books}
                value={getEffectiveStart(stream.key, stream.books, startPassages)}
                onChange={val => setStartPassages(prev => ({ ...prev, [stream.key]: val }))}
              />
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-btn-save" onClick={handleSave}>Save Plan</button>
        </div>
      </div>
    </div>
  );
}
