import { THEMES, themeAccent, applyTheme, derivePalette } from '../utils/theme';

/**
 * Theme colour picker — curated preset swatches plus a free custom colour.
 * Applies the chosen theme live (instant preview) and reports it up via
 * onChange so the parent can persist it to the profile.
 *
 * `value` is a preset key (string) or { custom: '#rrggbb' }.
 */
export default function ThemePicker({ value, onChange }) {
  const isCustom = value && typeof value === 'object' && !!value.custom;
  const currentAccent = themeAccent(value);

  function choosePreset(key) {
    applyTheme(key);      // live preview
    onChange(key);        // persist
  }

  function chooseCustom(hex) {
    const theme = { custom: hex };
    applyTheme(theme);
    onChange(theme);
  }

  return (
    <div className="theme-picker">
      <div className="theme-swatches">
        {Object.entries(THEMES).map(([key, t]) => {
          const active = !isCustom && (value ?? 'classic') === key;
          const accent = derivePalette(t.accent).accent;
          return (
            <button
              key={key}
              type="button"
              className={`theme-swatch ${active ? 'theme-swatch--active' : ''}`}
              style={{ background: accent }}
              title={t.label}
              aria-label={t.label}
              onClick={() => choosePreset(key)}
            >
              {active && <span className="theme-swatch-check">✓</span>}
            </button>
          );
        })}

        {/* Custom colour picker — the swatch IS the native colour input */}
        <label
          className={`theme-swatch theme-swatch--custom ${isCustom ? 'theme-swatch--active' : ''}`}
          style={isCustom ? { background: derivePalette(currentAccent).accent } : undefined}
          title="Custom colour"
        >
          {isCustom ? <span className="theme-swatch-check">✓</span> : '🎨'}
          <input
            type="color"
            className="theme-color-input"
            value={currentAccent}
            onChange={e => chooseCustom(e.target.value)}
          />
        </label>
      </div>
      <p className="settings-hint">
        {isCustom ? 'Custom colour' : THEMES[value ?? 'classic']?.label}
        {' '}· applies to every page. Tap 🎨 to pick your own.
      </p>
    </div>
  );
}
