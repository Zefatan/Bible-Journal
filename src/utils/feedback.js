/**
 * feedback.js — routes user feedback straight to the maintainer's WhatsApp
 * or email. Both channels open a PRE-FILLED compose window (WhatsApp / mail
 * app) that the tester taps "send" on — no backend, no API keys, and it works
 * identically in the browser and inside the Flutter WebView (whose
 * shouldOverrideUrlLoading launches wa.me / mailto externally).
 */

// Maintainer contacts. WhatsApp needs full international format:
// 085236177067 (Indonesia) → drop leading 0, prefix 62 → 6285236177067
export const WHATSAPP_NUMBER = '6285236177067';
export const FEEDBACK_EMAIL  = 'zefatan04@gmail.com';

// Bump when shipping a build so incoming feedback is tagged with the version.
export const APP_VERSION = '1.0.0';

export const FEEDBACK_CATEGORIES = [
  { key: 'bug',   emoji: '🐛', label: 'Bug' },
  { key: 'idea',  emoji: '💡', label: 'Idea' },
  { key: 'other', emoji: '💬', label: 'Other' },
];

/** Which shell are we running in? (browser tab, installed PWA, or Flutter app) */
export function detectPlatform() {
  const ua = navigator.userAgent || '';
  if (ua.includes('BibleJournal')) return 'App (Flutter)';
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  return standalone ? 'Web (installed PWA)' : 'Web (browser)';
}

/** Compact snapshot of the tester's setup, auto-attached so reports are actionable. */
export function gatherContext(user, profile) {
  const pace  = profile?.chaptersPerDay;
  const style = profile?.readingStyle === 'random' ? 'Mixed' : 'In Order';
  return {
    user:     profile?.nickname || user?.displayName || 'Guest',
    platform: detectPlatform(),
    version:  APP_VERSION,
    plan:     profile?.readingPreset || '—',
    pace:     pace ? `${pace} chapter${pace > 1 ? 's' : ''}/day · ${style}` : '—',
    timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/** Build the plain-text body sent through either channel. */
export function buildFeedbackText({ message, category, context }) {
  const cat = FEEDBACK_CATEGORIES.find(c => c.key === category);
  const lines = [
    `Bible Journal feedback — ${cat ? `${cat.emoji} ${cat.label}` : 'Feedback'}`,
    '',
    message.trim(),
    '',
    '———',
    `From: ${context.user}`,
    `Platform: ${context.platform} · v${context.version}`,
    `Plan: ${context.plan} (${context.pace})`,
    `Timezone: ${context.timezone}`,
    `Sent: ${new Date().toLocaleString()}`,
  ];
  return lines.join('\n');
}

/** wa.me deep link with the message pre-filled. */
export function whatsappUrl(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/** mailto: link with subject + body pre-filled. */
export function mailtoUrl(subject, body) {
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
