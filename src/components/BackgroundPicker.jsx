import { useState, useRef } from 'react';
import { applyBackground, compressImage, BUILTIN_BACKGROUNDS } from '../utils/theme';

// Every selectable backdrop except "My Photo" (handled separately below,
// since it needs an upload rather than a fixed thumbnail).
const OPTIONS = [
  { key: 'none', label: 'Plain' },
  { key: 'sunrise', label: 'Sunrise' },
  ...Object.entries(BUILTIN_BACKGROUNDS).map(([key, b]) => ({ key, label: b.label, url: b.url })),
];

/**
 * Backdrop picker for the Home / Sign In / Onboarding screens: Plain, a
 * built-in Sunrise scenic backdrop, a handful of curated devotional photos
 * bundled with the app, or a photo the user uploads themselves. Applies live
 * and reports the choice up via onChange({ background, photoDataUrl }) for
 * the parent to persist.
 */
export default function BackgroundPicker({ background = 'none', photoDataUrl, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  function choose(bg) {
    setError(null);
    applyBackground(bg, photoDataUrl);
    onChange({ background: bg, photoDataUrl: bg === 'photo' ? photoDataUrl : null });
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await compressImage(file);
      applyBackground('photo', dataUrl);
      onChange({ background: 'photo', photoDataUrl: dataUrl });
    } catch {
      setError("Couldn't read that image — try a different file.");
    } finally {
      setBusy(false);
    }
  }

  function removePhoto() {
    const next = background === 'photo' ? 'none' : background;
    applyBackground(next, null);
    onChange({ background: next, photoDataUrl: null });
  }

  const currentLabel = background === 'photo'
    ? 'My Photo'
    : OPTIONS.find(o => o.key === background)?.label ?? 'Plain';

  return (
    <div className="bg-picker">
      <div className="bg-grid">
        {OPTIONS.map(opt => (
          <button
            key={opt.key}
            type="button"
            className={[
              'bg-thumb',
              opt.key === 'none' && 'bg-thumb--plain',
              opt.key === 'sunrise' && 'bg-thumb--sunrise',
              background === opt.key && 'bg-thumb--active',
            ].filter(Boolean).join(' ')}
            style={opt.url ? { backgroundImage: `url(${opt.url})` } : undefined}
            title={opt.label}
            aria-label={opt.label}
            onClick={() => choose(opt.key)}
          >
            {background === opt.key && <span className="bg-thumb-check">✓</span>}
          </button>
        ))}

        {/* Uploaded photo — its own thumbnail slot once one exists */}
        <button
          type="button"
          className={`bg-thumb bg-thumb--upload ${background === 'photo' ? 'bg-thumb--active' : ''}`}
          style={photoDataUrl ? { backgroundImage: `url(${photoDataUrl})` } : undefined}
          title="My Photo"
          aria-label="My Photo"
          onClick={() => photoDataUrl ? choose('photo') : fileRef.current?.click()}
        >
          {!photoDataUrl && '📤'}
          {background === 'photo' && <span className="bg-thumb-check">✓</span>}
        </button>
      </div>

      <div className="bg-upload-row">
        <button
          type="button"
          className="settings-link-btn"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Processing…' : photoDataUrl ? 'Change my photo' : 'Upload your own photo'}
        </button>
        {photoDataUrl && (
          <button type="button" className="settings-link-btn settings-link-btn--danger" onClick={removePhoto}>
            Remove
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="bg-file-input"
          onChange={handleFile}
        />
      </div>

      {error && <p className="settings-hint settings-hint--warn">{error}</p>}
      <p className="settings-hint">{currentLabel} · shows behind Home, Sign In &amp; Onboarding — the journal page stays plain for easy reading.</p>
    </div>
  );
}
