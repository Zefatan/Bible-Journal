const BIBLE_ID = '78a9f6124f344018-01'; // NIV
const BASE_URL = 'https://rest.api.bible/v1';

function getApiKey() {
  return import.meta.env.VITE_BIBLE_API_KEY ?? '';
}

/**
 * Fetches a single chapter from api.bible.
 * Returns { content: string (HTML), reference: string } or throws on error.
 */
export async function fetchChapter(bookId, chapter) {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('NO_API_KEY');
  }

  const chapterId = `${bookId}.${chapter}`;
  const params = new URLSearchParams({
    'content-type': 'html',
    'include-notes': 'false',
    'include-titles': 'true',
    'include-chapter-numbers': 'false',
    'include-verse-numbers': 'true',
    'include-verse-spans': 'false',
  });

  const res = await fetch(
    `${BASE_URL}/bibles/${BIBLE_ID}/chapters/${chapterId}?${params}`,
    { headers: { 'api-key': apiKey } }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API_ERROR:${res.status}:${body}`);
  }

  const json = await res.json();
  return {
    content: json.data.content,
    reference: json.data.reference,
    copyright: json.data.copyright,
  };
}
