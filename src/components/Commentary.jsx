import { useState } from 'react';
import {
  bibleHubCommentaryUrl,
  bibleGatewayVerseUrl,
  sidToLabel,
} from '../utils/verseParser';

export default function Commentary({ selectedVerses, bookName }) {
  const [open, setOpen] = useState(false);
  const hasVerses = selectedVerses && selectedVerses.length > 0;

  // Derive button label from current selection so it always reflects the latest state
  function buttonLabel() {
    if (!hasVerses) return 'Search Commentary';
    if (selectedVerses.length === 1) {
      return `Search Commentary — ${sidToLabel(selectedVerses[0], bookName)}`;
    }
    return `Search Commentary — ${selectedVerses.length} verses`;
  }

  return (
    <div className="commentary">
      {!open ? (
        <button className="btn-commentary" onClick={() => setOpen(true)}>
          {buttonLabel()}
        </button>
      ) : (
        <div className="commentary-panel">
          <div className="commentary-header">
            <h3 className="section-heading" style={{ marginBottom: 0 }}>Commentary</h3>
            <button className="btn-close" onClick={() => setOpen(false)}>Hide</button>
          </div>

          {!hasVerses ? (
            <p className="commentary-empty">
              Select one or more verses above — commentary links will appear here automatically.
            </p>
          ) : (
            <div className="commentary-verses">
              {selectedVerses.map(sid => {
                const label = sidToLabel(sid, bookName);
                return (
                  <div key={sid} className="commentary-verse-block">
                    <h4 className="commentary-verse-ref">{label}</h4>
                    <ul className="commentary-links">
                      <li>
                        <a
                          href={bibleHubCommentaryUrl(sid)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Bible Hub Commentaries — {label}
                        </a>
                        <span className="commentary-source-note">
                          Matthew Henry · Spurgeon · Gill · Clarke & more
                        </span>
                      </li>
                      <li>
                        <a
                          href={bibleGatewayVerseUrl(sid, bookName)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Bible Gateway — {label} (NIV)
                        </a>
                      </li>
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
