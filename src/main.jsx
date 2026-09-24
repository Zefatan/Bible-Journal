import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { applyTheme, loadThemeLocal, applyBackground, loadBackgroundLocal } from './utils/theme';

// Apply the cached theme/background immediately so there's no flash before
// React mounts / the cloud profile loads.
applyTheme(loadThemeLocal());
const cachedBg = loadBackgroundLocal();
applyBackground(cachedBg.background, cachedBg.photoDataUrl);

// ── Dev-mode error display
if (import.meta.env.DEV) {
  const showErr = (msg) => {
    // Write to title (always visible in tab) + big yellow banner
    document.title = '❌ ERROR: ' + msg.slice(0, 60);
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:#fff176', 'color:#000', 'padding:1.5rem',
      'z-index:99999', 'font-size:14px', 'font-family:monospace',
      'white-space:pre-wrap', 'word-break:break-all', 'overflow:auto',
    ].join(';');
    el.textContent = '⚠️ APP ERROR:\n\n' + msg;
    document.body.innerHTML = '';
    document.body.appendChild(el);
  };
  window.onerror = (msg, src, line, col, err) =>
    showErr(`${msg}\n\nat ${src} ${line}:${col}\n\n${err?.stack || ''}`);
  window.onunhandledrejection = (e) =>
    showErr(`Unhandled Promise Rejection:\n\n${e.reason?.stack || String(e.reason)}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker only in production (skip in dev to avoid stale cache)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
