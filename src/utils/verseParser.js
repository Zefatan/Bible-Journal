/**
 * Parse the HTML chapter content from api.bible into an array of verse objects.
 * Each verse span looks like: <span data-number="1" data-sid="LUK 7:1" class="v">1</span>
 */
export function parseVerses(html) {
  const div = document.createElement('div');
  div.innerHTML = html;

  const verses = [];
  let currentVerse = null;

  function walk(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const num = node.getAttribute('data-number');
      const sid = node.getAttribute('data-sid');
      if (num && sid) {
        // Start a new verse; skip this span's children (they're just the number digit)
        currentVerse = { number: parseInt(num, 10), sid, text: '' };
        verses.push(currentVerse);
      } else {
        for (const child of node.childNodes) walk(child);
      }
    } else if (node.nodeType === Node.TEXT_NODE && currentVerse) {
      currentVerse.text += node.textContent;
    }
  }

  for (const child of div.childNodes) walk(child);

  return verses
    .map(v => ({ ...v, text: v.text.replace(/\s+/g, ' ').trim() }))
    .filter(v => v.text.length > 0);
}

/**
 * Parse a data-sid string like "LUK 7:1" or "PSA 1:6"
 */
export function parseSid(sid) {
  const [bookId, chapterVerse = ''] = sid.split(' ');
  const [chapter, verse] = chapterVerse.split(':');
  return { bookId, chapter: parseInt(chapter, 10), verse: parseInt(verse, 10) };
}

/** Map api.bible book IDs to Bible Hub URL slugs */
const BIBLEHUB_SLUGS = {
  LUK: 'luke', JHN: 'john', ACT: 'acts', ROM: 'romans',
  '1CO': '1_corinthians', '2CO': '2_corinthians', GAL: 'galatians',
  EPH: 'ephesians', PHP: 'philippians', COL: 'colossians',
  '1TH': '1_thessalonians', '2TH': '2_thessalonians',
  '1TI': '1_timothy', '2TI': '2_timothy', TIT: 'titus',
  PHM: 'philemon', HEB: 'hebrews', JAS: 'james',
  '1PE': '1_peter', '2PE': '2_peter', '1JN': '1_john',
  '2JN': '2_john', '3JN': '3_john', JUD: 'jude', REV: 'revelation',
  PSA: 'psalms',
};

export function bibleHubCommentaryUrl(sid) {
  const { bookId, chapter, verse } = parseSid(sid);
  const slug = BIBLEHUB_SLUGS[bookId] ?? bookId.toLowerCase();
  return `https://biblehub.com/commentaries/${slug}/${chapter}-${verse}.htm`;
}

export function bibleGatewayVerseUrl(sid, bookName) {
  const { chapter, verse } = parseSid(sid);
  const ref = `${bookName} ${chapter}:${verse}`;
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=NIV`;
}

/** Human-readable label for a sid, e.g. "Luke 7:1" */
export function sidToLabel(sid, bookName) {
  const { chapter, verse } = parseSid(sid);
  return `${bookName} ${chapter}:${verse}`;
}
