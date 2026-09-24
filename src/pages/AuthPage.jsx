import { useState } from 'react';
import {
  registerUser, loginUser,
  validateUsername, validatePassword, parseAuthError,
} from '../utils/auth';
import { isConfigured } from '../utils/firebase';

export default function AuthPage() {
  const [mode, setMode]              = useState('login');   // 'login' | 'register'
  const [username, setUsername]      = useState('');
  const [password, setPassword]      = useState('');
  const [confirmPw, setConfirmPw]    = useState('');
  const [showPw, setShowPw]          = useState(false);
  const [error, setError]            = useState('');
  const [loading, setLoading]        = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function switchMode(m) {
    setMode(m);
    setError('');
    setFieldErrors({});
    setPassword('');
    setConfirmPw('');
  }

  function validate() {
    const errs = {};
    const uErr = validateUsername(username);
    if (uErr) errs.username = uErr;
    const pErr = validatePassword(password);
    if (pErr) errs.password = pErr;
    if (mode === 'register' && password !== confirmPw)
      errs.confirmPw = 'Passwords do not match.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'register') {
        await registerUser(username, password);
      } else {
        await loginUser(username, password);
      }
      // AuthContext picks up the user change via onAuthStateChanged
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">

      {/* ── App branding ─────────────────────────────────── */}
      <div className="auth-brand">
        <div className="auth-icon">📖</div>
        <h1 className="auth-app-title">Bible Journal</h1>
        <p className="auth-app-sub">Your personal devotion companion</p>
      </div>

      {/* ── Card ─────────────────────────────────────────── */}
      <div className="auth-card">

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => switchMode('register')}
            type="button"
          >
            Create Account
          </button>
        </div>

        {/* Firebase not configured warning */}
        {!isConfigured && (
          <div className="auth-banner auth-banner--warn">
            <strong>Firebase not set up.</strong> See <code>FIREBASE_SETUP.md</code> to
            connect a free database. Until then the app works locally only.
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Username */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-username">
              Username
            </label>
            <input
              id="auth-username"
              className={`auth-input ${fieldErrors.username ? 'auth-input--error' : ''}`}
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              placeholder="e.g. john_doe"
              value={username}
              maxLength={20}
              onChange={e => { setUsername(e.target.value); setFieldErrors(p => ({ ...p, username: null })); }}
              disabled={loading}
            />
            {fieldErrors.username && (
              <p className="auth-field-error">{fieldErrors.username}</p>
            )}
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">
              Password
            </label>
            <div className="auth-input-wrap">
              <input
                id="auth-password"
                className={`auth-input ${fieldErrors.password ? 'auth-input--error' : ''}`}
                type={showPw ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: null })); }}
                disabled={loading}
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="auth-field-error">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-confirm">
                Confirm Password
              </label>
              <input
                id="auth-confirm"
                className={`auth-input ${fieldErrors.confirmPw ? 'auth-input--error' : ''}`}
                type={showPw ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setFieldErrors(p => ({ ...p, confirmPw: null })); }}
                disabled={loading}
              />
              {fieldErrors.confirmPw && (
                <p className="auth-field-error">{fieldErrors.confirmPw}</p>
              )}
            </div>
          )}

          {/* Global error */}
          {error && (
            <div className="auth-error-box" role="alert">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit"
            disabled={loading || !isConfigured}
          >
            {loading
              ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

        </form>

        {/* Footer note */}
        <p className="auth-note">
          {mode === 'login'
            ? 'New here? '
            : 'Already have an account? '}
          <button
            type="button"
            className="auth-link"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Create an account →' : 'Sign in →'}
          </button>
        </p>

        {mode === 'register' && (
          <p className="auth-privacy-note">
            Your journal entries are private and encrypted in transit.
            Only you can read them.
          </p>
        )}

      </div>

      <p className="auth-footer">
        Sync your journal across all your devices
      </p>
    </div>
  );
}
