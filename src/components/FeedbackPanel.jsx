import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FEEDBACK_CATEGORIES, gatherContext, buildFeedbackText,
  whatsappUrl, mailtoUrl,
} from '../utils/feedback';

/**
 * Feedback modal. Both send buttons are real <a> elements (not window.open)
 * so the Flutter WebView's shouldOverrideUrlLoading reliably launches
 * WhatsApp / the mail app externally, and normal browsers follow the link too.
 */
export default function FeedbackPanel({ onClose }) {
  const { user, profile } = useAuth();
  const [category, setCategory] = useState('bug');
  const [message,  setMessage]  = useState('');
  const [sent,     setSent]     = useState(false);

  const context   = gatherContext(user, profile);
  const canSend   = message.trim().length >= 3;
  const text      = canSend ? buildFeedbackText({ message, category, context }) : '';
  const subject   = 'Bible Journal Feedback';

  const waHref   = canSend ? whatsappUrl(text)          : undefined;
  const mailHref = canSend ? mailtoUrl(subject, text)   : undefined;

  // Give a light "thanks" confirmation once a channel is chosen
  function markSent() {
    setSent(true);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel feedback-panel">
        <button className="feedback-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="modal-title">💬 Send Feedback</h2>
        <p className="modal-sub">
          Found a bug or have an idea? It goes straight to the maker's WhatsApp or email.
        </p>

        {/* Category */}
        <div className="feedback-cats">
          {FEEDBACK_CATEGORIES.map(c => (
            <button
              key={c.key}
              type="button"
              className={`feedback-cat ${category === c.key ? 'feedback-cat--active' : ''}`}
              onClick={() => setCategory(c.key)}
            >
              <span className="feedback-cat-emoji">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Message */}
        <textarea
          className="feedback-textarea"
          placeholder="Tell us what happened, or what you'd like to see…"
          value={message}
          maxLength={2000}
          rows={5}
          onChange={e => { setMessage(e.target.value); setSent(false); }}
          autoFocus
        />

        {/* What gets attached */}
        <details className="feedback-context">
          <summary>What we'll include with your message</summary>
          <ul>
            <li>From: {context.user}</li>
            <li>Platform: {context.platform} · v{context.version}</li>
            <li>Plan: {context.plan} ({context.pace})</li>
          </ul>
        </details>

        {/* Send channels */}
        <div className="feedback-actions">
          <a
            className={`feedback-send feedback-send--wa ${!canSend ? 'feedback-send--disabled' : ''}`}
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => { if (!canSend) e.preventDefault(); else markSent(); }}
          >
            <span>🟢</span> WhatsApp
          </a>
          <a
            className={`feedback-send feedback-send--mail ${!canSend ? 'feedback-send--disabled' : ''}`}
            href={mailHref}
            onClick={e => { if (!canSend) e.preventDefault(); else markSent(); }}
          >
            <span>✉️</span> Email
          </a>
        </div>

        {sent && (
          <p className="feedback-thanks">
            Thanks! Your message app should have opened — tap <strong>send</strong> there to deliver it. 🙏
          </p>
        )}
        {!canSend && (
          <p className="feedback-hint">Write a few words first, then pick a channel.</p>
        )}
      </div>
    </div>
  );
}
