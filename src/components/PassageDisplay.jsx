import { useState, useEffect } from 'react';
import { fetchChapter } from '../utils/bibleApi';

function PassageSection({ label, bookId, chapter, reference }) {
  const [state, setState] = useState({ status: 'idle', content: null, error: null });

  useEffect(() => {
    setState({ status: 'loading', content: null, error: null });
    fetchChapter(bookId, chapter)
      .then((data) => setState({ status: 'ok', content: data.content, error: null }))
      .catch((err) => setState({ status: 'error', content: null, error: err.message }));
  }, [bookId, chapter]);

  return (
    <section className="passage-section">
      <h2 className="passage-label">{label}</h2>
      <h3 className="passage-reference">{reference}</h3>

      {state.status === 'loading' && (
        <p className="passage-loading">Loading passage…</p>
      )}

      {state.status === 'error' && (
        <div className="passage-error">
          {state.error === 'NO_API_KEY' ? (
            <>
              <p>Add your API key to get started.</p>
              <ol>
                <li>Register for free at <strong>scripture.api.bible</strong></li>
                <li>Copy <code>.env.example</code> to <code>.env</code></li>
                <li>Paste your key as <code>VITE_BIBLE_API_KEY=…</code></li>
                <li>Restart the dev server</li>
              </ol>
            </>
          ) : (
            <p>Could not load passage. {state.error}</p>
          )}
        </div>
      )}

      {state.status === 'ok' && (
        <div
          className="passage-text"
          dangerouslySetInnerHTML={{ __html: state.content }}
        />
      )}
    </section>
  );
}

export default function PassageDisplay({ schedule }) {
  const ntRef = `${schedule.nt.bookName} ${schedule.nt.chapter}`;
  const psalmRef = `Psalm ${schedule.psalm}`;

  return (
    <div className="passages">
      <PassageSection
        label="New Testament"
        bookId={schedule.nt.bookId}
        chapter={schedule.nt.chapter}
        reference={ntRef}
      />
      <PassageSection
        label="Psalm"
        bookId="PSA"
        chapter={schedule.psalm}
        reference={psalmRef}
      />
    </div>
  );
}
