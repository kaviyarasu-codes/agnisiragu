// src/common/utils/tamil-transliterate.ts
//
// Lightweight phonetic Tamil -> Latin transliteration, used ONLY to build a
// fuzzy search index (Article.searchText) — never for display. This lets a
// reader searching Archive/Search in plain English letters or "Thanglish"
// (Tamil words typed with the Latin alphabet, e.g. "mazhai" for மழை) still
// find Tamil-only articles. It is not a linguistically precise romanization
// scheme (no diacritics, several Tamil letters collapse to the same Latin
// sound on purpose) — it only needs to be *consistent*, so the same word
// transliterates the same way whether it came from stored content or a
// user's search query.

// Independent vowels (உயிர் எழுத்து) — used when a vowel appears on its own,
// not attached to a consonant.
const INDEPENDENT_VOWELS: Record<string, string> = {
  'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ii', 'உ': 'u', 'ஊ': 'uu',
  'எ': 'e', 'ஏ': 'ee', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'oo', 'ஔ': 'au', 'ஃ': 'h',
};

// Consonants (மெய் எழுத்து), bare sound with no vowel — the inherent 'அ' is
// appended separately when no vowel sign or pulli follows.
const CONSONANTS: Record<string, string> = {
  'க': 'k', 'ங': 'ng', 'ச': 'ch', 'ஜ': 'j', 'ஞ': 'nj',
  'ட': 't', 'ண': 'n', 'த': 'th', 'ந': 'n', 'ப': 'p',
  'ம': 'm', 'ய': 'y', 'ர': 'r', 'ல': 'l', 'வ': 'v',
  'ழ': 'zh', 'ள': 'l', 'ற': 'r', 'ன': 'n',
  'ஷ': 'sh', 'ஸ': 's', 'ஹ': 'h', 'க்ஷ': 'ksh',
};

// Dependent vowel signs (சேர்க்கை உயிர்க்குறி) — attach to the preceding
// consonant, replacing its inherent 'அ'.
const VOWEL_SIGNS: Record<string, string> = {
  'ா': 'aa', 'ி': 'i', 'ீ': 'ii', 'ு': 'u', 'ூ': 'uu',
  'ெ': 'e', 'ே': 'ee', 'ை': 'ai', 'ொ': 'o', 'ோ': 'oo', 'ௌ': 'au',
};

const PULLI = '்'; // virama — mutes the consonant's inherent vowel entirely

export function transliterateTamilToLatin(input: string): string {
  if (!input) return '';
  let out = '';
  const chars = Array.from(input);

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const consonant = CONSONANTS[c];

    if (consonant) {
      const next = chars[i + 1];
      if (next === PULLI) {
        out += consonant;
        i += 1;
      } else if (next && VOWEL_SIGNS[next]) {
        out += consonant + VOWEL_SIGNS[next];
        i += 1;
      } else {
        out += consonant + 'a'; // inherent vowel
      }
      continue;
    }

    if (INDEPENDENT_VOWELS[c]) {
      out += INDEPENDENT_VOWELS[c];
      continue;
    }

    // Not Tamil script (Latin letters, digits, punctuation, spaces) — keep
    // as-is so English/mixed-language text passes through untouched.
    out += c;
  }

  return out;
}

// Canonicalizes text (transliterated Tamil OR plain English/Thanglish
// search input) so common spelling variance doesn't prevent a match —
// e.g. "mazhai" vs "mazhaii", "vaanam" vs "vanam", "cinema" vs "cinnema".
// Applied to BOTH the stored search index and the incoming query, so it
// only needs to be consistent, not "correct".
export function canonicalizeForSearch(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[^a-z0-9஀-௿\s]/g, ' ')
    .replace(/zh/g, 'z')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/sh/g, 's')
    .replace(/(.)\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Builds the precomputed Article.searchText blob at create/update time.
export function buildArticleSearchText(fields: {
  titleTa?: string | null;
  bodyTa?: string | null;
  titleEn?: string | null;
  excerpt?: string | null;
  byline?: string | null;
  categoryNameEn?: string | null;
}): string {
  const parts = [
    transliterateTamilToLatin(fields.titleTa ?? ''),
    transliterateTamilToLatin((fields.bodyTa ?? '').slice(0, 400)),
    fields.titleEn ?? '',
    fields.excerpt ?? '',
    fields.byline ?? '',
    fields.categoryNameEn ?? '',
  ].join(' ');
  return canonicalizeForSearch(parts);
}
