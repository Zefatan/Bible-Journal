import { useState } from 'react';
import { PRESETS, dateKeyOf } from '../utils/readingPlan';
import { saveProfile }  from '../utils/profile';
import { requestNotificationPermission, notificationsSupported } from '../utils/notifications';
import { useAuth } from '../contexts/AuthContext';
import { getUsername } from '../utils/auth';
import {
  PACE_PRESETS, DEFAULT_PRESET_FOR_PACE, getEffectiveStart, calculateStreamOffset,
} from '../utils/planPresets';
import {
  ReadingStylePicker, PacePicker, PresetPicker, RepeatToggle, StreamStartPicker,
} from '../components/PlanFields';

const TOTAL_STEPS = 6;

// Popular IANA timezones grouped for the dropdown
const TIMEZONES = [
  'Pacific/Honolulu', 'America/Anchorage', 'America/Los_Angeles', 'America/Denver',
  'America/Chicago', 'America/New_York', 'America/Sao_Paulo', 'Atlantic/Reykjavik',
  'Europe/London', 'Europe/Paris', 'Europe/Moscow', 'Africa/Nairobi',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok',
  'Asia/Jakarta', 'Asia/Singapore', 'Asia/Manila', 'Asia/Shanghai',
  'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland',
];

function tzLabel(tz) {
  try {
    const offset = new Intl.DateTimeFormat('en', {
      timeZone: tz, timeZoneName: 'short',
    }).formatToParts().find(p => p.type === 'timeZoneName')?.value || '';
    return `${tz.replace(/_/g, ' ')} (${offset})`;
  } catch { return tz; }
}

/** Format "HH:MM" (24h) as "6:00 AM" for display */
function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function OnboardingPage({ onComplete }) {
  const { user } = useAuth();
  const username  = getUsername(user);

  const [step, setStep]         = useState(1);
  const [saving, setSaving]     = useState(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [nickname,       setNickname]       = useState(username || '');
  const [timezone,       setTimezone]       = useState(detectedTz);
  const [readingStyle,   setReadingStyle]   = useState('sequential');
  const [readingPreset,  setReadingPreset]  = useState('nt_only');
  const [chaptersPerDay, setChaptersPerDay] = useState(1);
  const [isCustomPicking, setIsCustomPicking] = useState(false);
  const [customTracks,    setCustomTracks]    = useState(['nt', 'ot', 'psalm']);
  const [repeatOnComplete, setRepeatOnComplete] = useState(false);
  const [startPassages,  setStartPassages]  = useState({});
  const [notifEnabled,   setNotifEnabled]   = useState(false);
  const [reminderTime,   setReminderTime]   = useState('06:00');

  const isSequential = readingStyle === 'sequential';

  // ── Step validation ─────────────────────────────────────────────────────────
  function canNext() {
    if (step === 1) return nickname.trim().length >= 2;
    return true;
  }

  function next() {
    if (!canNext()) return;
    // When leaving Step 3, reset preset if it's invalid for the newly chosen pace
    if (step === 3) {
      const paceList    = PACE_PRESETS[chaptersPerDay];
      const realPresets = paceList.filter(k => k !== '__custom__');
      const validViaCustom = paceList.includes('__custom__') && isCustomPicking;
      if (!realPresets.includes(readingPreset) && !validViaCustom) {
        setReadingPreset(DEFAULT_PRESET_FOR_PACE[chaptersPerDay]);
        setIsCustomPicking(false);
      }
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  }
  function back() { setStep(s => Math.max(s - 1, 1)); }

  // ── Finish ──────────────────────────────────────────────────────────────────
  async function handleFinish() {
    setSaving(true);

    // Request notification permission if user opted in
    let notifGranted = false;
    if (notifEnabled && notificationsSupported()) {
      notifGranted = await requestNotificationPermission();
    }

    // Starting position becomes each stream's initial absolute chapter index
    // (sequential only — progress now advances on submission, not by date)
    const streamPositions = {};
    if (isSequential) {
      for (const stream of PRESETS[readingPreset].streams) {
        const start = getEffectiveStart(stream.key, stream.books, startPassages);
        streamPositions[stream.key] = calculateStreamOffset(stream.books, start.bookId, start.chapter);
      }
    } else {
      for (const stream of PRESETS[readingPreset].streams) {
        streamPositions[stream.key] = 0;
      }
    }

    const profile = {
      nickname: nickname.trim(),
      timezone,
      readingStyle,
      readingPreset,
      chaptersPerDay,
      repeatOnComplete: isSequential ? repeatOnComplete : false,
      streamPositions,
      streamStyles: {},
      customPassages: [],
      notificationsEnabled: notifGranted,
      reminderTime,
      onboardingComplete: true,
      startDate: dateKeyOf(new Date(), timezone),
    };

    await saveProfile(user?.uid, profile);
    onComplete(profile);
  }

  // ── Progress bar ────────────────────────────────────────────────────────────
  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="onboard-page">
      <div className="onboard-logo">
        <img src="/icon.svg" alt="Bible Journal" className="onboard-logo-img" />
      </div>

      <div className="onboard-card">
        {/* Progress */}
        <div className="onboard-progress-bar">
          <div className="onboard-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="onboard-step-label">Step {step} of {TOTAL_STEPS}</p>

        {/* ── Step 1: Nickname ── */}
        {step === 1 && (
          <div className="onboard-step">
            <h2 className="onboard-title">Welcome, {username}! 👋</h2>
            <p className="onboard-sub">Let's personalise your Bible Journal.</p>
            <div className="onboard-field">
              <label className="onboard-label">What should we call you?</label>
              <input
                className="onboard-input"
                type="text"
                placeholder="Your nickname"
                value={nickname}
                maxLength={20}
                onChange={e => setNickname(e.target.value)}
                autoFocus
              />
              <p className="onboard-hint">This is how the app will greet you each day.</p>
            </div>
          </div>
        )}

        {/* ── Step 2: Location / Timezone ── */}
        {step === 2 && (
          <div className="onboard-step">
            <h2 className="onboard-title">Where are you reading from? 🌍</h2>
            <p className="onboard-sub">We'll use this to send reminders at the right time.</p>
            <div className="onboard-field">
              <label className="onboard-label">Your timezone</label>
              <select
                className="onboard-select"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
              >
                {/* Auto-detected at top */}
                {!TIMEZONES.includes(detectedTz) && (
                  <option value={detectedTz}>{tzLabel(detectedTz)} (detected)</option>
                )}
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tzLabel(tz)}</option>
                ))}
              </select>
              <p className="onboard-hint">Auto-detected: {tzLabel(detectedTz)}</p>
            </div>
          </div>
        )}

        {/* ── Step 3: Reading Style + Pace ── */}
        {step === 3 && (
          <div className="onboard-step">
            <h2 className="onboard-title">How do you like to read? 📖</h2>
            <p className="onboard-sub">Choose your reading style and daily pace.</p>

            <ReadingStylePicker value={readingStyle} onChange={setReadingStyle} />
            <PacePicker value={chaptersPerDay} onChange={setChaptersPerDay} />
          </div>
        )}

        {/* ── Step 4: Book Selection ── */}
        {step === 4 && (
          <div className="onboard-step">
            <h2 className="onboard-title">What do you want to read? 📚</h2>
            <p className="onboard-sub">
              {readingStyle === 'random'
                ? 'Each track gives you a fresh random passage every day.'
                : <>Each track advances <strong>1 chapter a day</strong> once you've journaled it — want more? Add extra passages anytime from the Journal page.</>
              }
            </p>

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
          </div>
        )}

        {/* ── Step 5: Starting Passage ── */}
        {step === 5 && (
          <div className="onboard-step">
            <h2 className="onboard-title">Where are you starting? 📍</h2>

            {isSequential ? (
              <>
                <p className="onboard-sub">
                  Already partway through? Pick up right where you left off.
                </p>
                {PRESETS[readingPreset].streams.map(stream => (
                  <StreamStartPicker
                    key={stream.key}
                    streamLabel={stream.label}
                    books={stream.books}
                    value={getEffectiveStart(stream.key, stream.books, startPassages)}
                    onChange={val =>
                      setStartPassages(prev => ({ ...prev, [stream.key]: val }))
                    }
                  />
                ))}
                <p className="onboard-hint" style={{ marginTop: '0.25rem' }}>
                  Leave at the first book &amp; chapter 1 to start fresh from the beginning.
                </p>
              </>
            ) : (
              <>
                <p className="onboard-sub">
                  You've chosen <strong>Mixed</strong> reading — each day's passage is
                  randomly selected, so there's no fixed starting point.
                </p>
                <div className="onboard-summary">
                  <p className="onboard-summary-title">🎲 Random selection active</p>
                  <ul className="onboard-summary-list">
                    <li>A fresh passage awaits you every day</li>
                    <li>No starting point needed</li>
                    <li>Switch to "In Order" on the previous step for sequential reading</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 6: Notifications ── */}
        {step === 6 && (
          <div className="onboard-step">
            <h2 className="onboard-title">Stay consistent 🔔</h2>
            <p className="onboard-sub">
              A daily reminder helps build a lasting habit.
            </p>

            <button
              type="button"
              className={`onboard-notif-toggle ${notifEnabled ? 'onboard-notif-toggle--on' : ''}`}
              onClick={() => setNotifEnabled(v => !v)}
            >
              <span className="onboard-notif-icon">{notifEnabled ? '🔔' : '🔕'}</span>
              <div className="onboard-notif-text">
                <span className="onboard-notif-title">
                  {notifEnabled ? 'Reminders ON' : 'Reminders OFF'}
                </span>
                <span className="onboard-notif-desc">
                  {notifEnabled
                    ? `Reminder every day at ${formatTime(reminderTime)} (${tzLabel(timezone)})`
                    : 'Tap to enable a daily reminder'}
                </span>
              </div>
              <div className={`onboard-toggle-switch ${notifEnabled ? 'onboard-toggle-switch--on' : ''}`} />
            </button>

            {notifEnabled && (
              <div className="onboard-field" style={{ marginTop: '0.85rem' }}>
                <label className="onboard-label">Reminder time</label>
                <input
                  type="time"
                  className="onboard-input onboard-time-input"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value || '06:00')}
                />
                <p className="onboard-hint">Pick whatever hour fits your routine — not just the morning.</p>
              </div>
            )}

            {!notificationsSupported() && (
              <p className="onboard-hint" style={{ color: '#c0392b', marginTop: '0.75rem' }}>
                Your browser doesn't support notifications.
              </p>
            )}

            <div className="onboard-summary">
              <p className="onboard-summary-title">Your reading plan</p>
              <ul className="onboard-summary-list">
                <li>👤 {nickname}</li>
                <li>🌍 {tzLabel(timezone)}</li>
                <li>📖 {PRESETS[readingPreset]?.label}</li>
                <li>{readingStyle === 'sequential' ? '📋 In Order' : '🎲 Mixed'} · {chaptersPerDay} chapter{chaptersPerDay > 1 ? 's' : ''}/day</li>
                {isSequential && PRESETS[readingPreset].streams.map(stream => {
                  const start = getEffectiveStart(stream.key, stream.books, startPassages);
                  const isDefault = start.bookId === stream.books[0].id && start.chapter === 1;
                  if (isDefault) return null;
                  const bookName = stream.books.find(b => b.id === start.bookId)?.name || start.bookId;
                  return (
                    <li key={stream.key}>
                      📍 {stream.label}: starting at {bookName} {start.chapter}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="onboard-nav">
          {step > 1 && (
            <button className="onboard-btn-back" onClick={back} disabled={saving}>
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < TOTAL_STEPS ? (
            <button
              className="onboard-btn-next"
              onClick={next}
              disabled={!canNext()}
            >
              Next →
            </button>
          ) : (
            <button
              className="onboard-btn-finish"
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? 'Saving…' : "Let's Go! 🎉"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
