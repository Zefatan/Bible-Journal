/**
 * theme.js — user-customizable colour themes.
 *
 * The app is built on a small set of CSS custom properties. A theme only needs
 * to override the "accent" family (buttons, headings, highlights, progress) plus
 * the three dark gradient stops used on the Home/Auth/Onboarding backgrounds.
 * The parchment reading surface (--cream, --ink, --parchment) stays constant so
 * journal text is always comfortable to read, whatever accent is chosen.
 *
 * A theme is either:
 *   • a preset key (see THEMES), or
 *   • { custom: '#rrggbb' } — a user-picked accent from which we derive the palette.
 */

// ── hex ↔ hsl helpers ───────────────────────────────────────────────────────
function hexToHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4;
    }
    hue /= 6;
  }
  return { h: hue * 360, s: sat * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h /= 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  const k = n => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * Derive a full, always-readable palette from a single accent hex.
 * Normalises lightness/saturation so even a very light or very dark pick
 * yields usable buttons, tints, and a dark gradient.
 */
export function derivePalette(hex) {
  const { h, s } = hexToHsl(hex);
  const sat = Math.max(28, Math.min(70, s)); // clamp so it never looks washed out or neon
  return {
    accent:        hslToHex(h, sat, 34),
    accentLight:   hslToHex(h, Math.max(22, sat - 10), 64),
    accentBg:      hslToHex(h, Math.min(45, sat), 94),
    selectedBorder: hslToHex(h, sat, 54),
    grad1:         hslToHex(h, Math.min(80, sat + 20), 11),
    grad2:         hslToHex(h, Math.min(75, sat + 12), 24),
    grad3:         hslToHex(h, Math.min(70, sat + 8), 36),
  };
}

// ── Curated presets ─────────────────────────────────────────────────────────
// Each is just an accent hex; the palette is derived the same way as custom
// picks, so presets and custom colours are perfectly consistent.
export const THEMES = {
  classic:   { label: 'Classic',   accent: '#6b4c2a' }, // warm brown (original)
  terracotta:{ label: 'Terracotta',accent: '#b5532e' },
  ocean:     { label: 'Ocean',     accent: '#2a5c8a' },
  teal:      { label: 'Teal',      accent: '#1f7a6d' },
  forest:    { label: 'Forest',    accent: '#3a6644' },
  plum:      { label: 'Plum',      accent: '#7a3f6b' },
  rose:      { label: 'Rose',      accent: '#b23a63' },
  slate:     { label: 'Slate',     accent: '#4a5468' },
};

export const DEFAULT_THEME = 'classic';

/** Resolve a stored theme value (preset key or {custom}) → accent hex. */
export function themeAccent(theme) {
  if (theme && typeof theme === 'object' && theme.custom) return theme.custom;
  return THEMES[theme]?.accent || THEMES[DEFAULT_THEME].accent;
}

/** Write the derived palette onto :root so every page updates instantly. */
export function applyTheme(theme) {
  const p = derivePalette(themeAccent(theme));
  const root = document.documentElement.style;
  root.setProperty('--accent', p.accent);
  root.setProperty('--accent-light', p.accentLight);
  root.setProperty('--accent-bg', p.accentBg);
  root.setProperty('--selected-border', p.selectedBorder);
  root.setProperty('--home-grad-1', p.grad1);
  root.setProperty('--home-grad-2', p.grad2);
  root.setProperty('--home-grad-3', p.grad3);
}

// ── Local cache so the theme is applied instantly on load (no colour flash) ──
const KEY = 'bj-theme';

export function loadThemeLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT_THEME;
  } catch { return DEFAULT_THEME; }
}

export function saveThemeLocal(theme) {
  try { localStorage.setItem(KEY, JSON.stringify(theme)); } catch { /* ignore */ }
}

// ── Background backdrop (Home / Sign In / Onboarding / loading screen) ──────
/**
 * Independent of the accent colour above. `background` is:
 *   'none'          → just the coloured gradient (default)
 *   'sunrise'       → a built-in scenic SVG backdrop (no image file needed)
 *   a key in BUILTIN_BACKGROUNDS → a curated photo bundled with the app
 *   'photo'         → a user-uploaded image (profile.backgroundPhoto)
 *
 * Deliberately NOT applied to the Journal/History reading surface — that
 * stays plain parchment so scripture text is always easy to read regardless
 * of how the rest of the app is dressed up.
 */

// Curated devotional photos bundled with the app (public/backgrounds/) —
// served as plain static files, so unlike an uploaded photo these never
// touch the profile document or localStorage at all.
export const BUILTIN_BACKGROUNDS = {
  'devotion-window':   { label: 'Morning Devotion', url: '/backgrounds/devotion-window.jpg' },
  'river-cross':       { label: 'River & Cross',    url: '/backgrounds/river-cross.jpg' },
  'sunset-bible':      { label: 'Bible at Sunset',  url: '/backgrounds/sunset-bible.jpg' },
  'christ-silhouette': { label: 'Christ',           url: '/backgrounds/christ-silhouette.jpg' },
};
const SUNRISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1200' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='#2b1608'/>
      <stop offset='35%' stop-color='#7a3d16'/>
      <stop offset='62%' stop-color='#d17a2e'/>
      <stop offset='100%' stop-color='#f2b25c'/>
    </linearGradient>
    <radialGradient id='sun' cx='50%' cy='100%' r='75%'>
      <stop offset='0%' stop-color='#fff3d6' stop-opacity='0.95'/>
      <stop offset='45%' stop-color='#ffcf7d' stop-opacity='0.55'/>
      <stop offset='100%' stop-color='#ffcf7d' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='800' height='1200' fill='url(#sky)'/>
  <circle cx='400' cy='760' r='420' fill='url(#sun)'/>
  <circle cx='400' cy='760' r='95' fill='#fff6e3' opacity='0.9'/>
  <path d='M0 900 Q200 820 400 870 T800 850 L800 1200 L0 1200 Z' fill='#1c0f06' opacity='0.88'/>
  <path d='M0 960 Q220 900 420 940 T800 920 L800 1200 L0 1200 Z' fill='#140a04'/>
  <rect x='393' y='700' width='14' height='110' fill='#140a04'/>
  <rect x='363' y='732' width='74' height='14' fill='#140a04'/>
</svg>`;

function svgDataUrl(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Write the background layer onto :root so every hero page updates instantly. */
export function applyBackground(background, photoDataUrl) {
  const root = document.documentElement.style;
  const builtin = BUILTIN_BACKGROUNDS[background];
  if (background === 'sunrise') {
    root.setProperty('--bg-image', svgDataUrl(SUNRISE_SVG));
    root.setProperty('--bg-overlay', 'linear-gradient(180deg, rgba(15,8,4,0.35), rgba(15,8,4,0.75))');
  } else if (builtin) {
    root.setProperty('--bg-image', `url("${builtin.url}")`);
    root.setProperty('--bg-overlay', 'linear-gradient(180deg, rgba(10,6,3,0.4), rgba(10,6,3,0.78))');
  } else if (background === 'photo' && photoDataUrl) {
    root.setProperty('--bg-image', `url("${photoDataUrl}")`);
    root.setProperty('--bg-overlay', 'linear-gradient(180deg, rgba(10,6,3,0.45), rgba(10,6,3,0.8))');
  } else {
    root.setProperty('--bg-image', 'none');
    root.setProperty('--bg-overlay', 'none');
  }
}

const BG_KEY = 'bj-background';

export function loadBackgroundLocal() {
  try {
    const raw = localStorage.getItem(BG_KEY);
    return raw ? JSON.parse(raw) : { background: 'none', photoDataUrl: null };
  } catch { return { background: 'none', photoDataUrl: null }; }
}

export function saveBackgroundLocal(background, photoDataUrl) {
  try {
    localStorage.setItem(BG_KEY, JSON.stringify({ background, photoDataUrl: photoDataUrl || null }));
  } catch { /* quota exceeded — cloud copy (if any) remains the source of truth */ }
}

/**
 * Compress an uploaded image client-side (resize + re-encode as JPEG) so it's
 * small enough to store as a string field on the profile document (Firestore
 * documents cap at 1MB total) and loads fast. Falls back to a smaller/lower
 * quality pass if the first attempt is still large.
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const render = (maxDim, quality) => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        return canvas.toDataURL('image/jpeg', quality);
      };
      let out = render(1000, 0.72);
      if (out.length > 700_000) out = render(700, 0.6); // second, smaller pass
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}
