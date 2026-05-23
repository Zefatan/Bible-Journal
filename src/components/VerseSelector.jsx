export default function VerseSelector({ verses, selected, onChange }) {
  if (!verses || verses.length === 0) return null;

  function toggle(sid) {
    onChange(
      selected.includes(sid)
        ? selected.filter(s => s !== sid)
        : [...selected, sid]
    );
  }

  return (
    <div className="verse-selector">
      <p className="vs-heading">
        Main Verse(s)
        <span className="vs-hint">Click to select · multi-select allowed</span>
      </p>

      <div className="vs-list">
        {verses.map(v => {
          const isSelected = selected.includes(v.sid);
          return (
            <button
              key={v.sid}
              type="button"
              className={`vs-item${isSelected ? ' vs-item--on' : ''}`}
              onClick={() => toggle(v.sid)}
              aria-pressed={isSelected}
            >
              <span className="vs-num">{v.number}</span>
              <span className="vs-text">{v.text}</span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="vs-count">
          {selected.length} verse{selected.length > 1 ? 's' : ''} selected
          <button
            type="button"
            className="vs-clear"
            onClick={() => onChange([])}
          >
            Clear
          </button>
        </p>
      )}
    </div>
  );
}
