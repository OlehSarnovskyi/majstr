/** Slovak/Czech diacritics transliteration map */
const DIACRITICS: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ě: 'e',
  í: 'i', ì: 'i', î: 'i',
  ó: 'o', ò: 'o', ô: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ý: 'y',
  ľ: 'l', ĺ: 'l',
  ŕ: 'r',
  ň: 'n',
  š: 's',
  č: 'c',
  ž: 'z',
  ť: 't',
  ď: 'd',
  // Uppercase variants — lowercased first so these match after .toLowerCase()
};

const MAX_SLUG_LENGTH = 60;
const MAX_SUFFIX_ATTEMPTS = 10;

/**
 * Transliterate a single character — returns the ASCII equivalent or empty string.
 */
function transliterate(char: string): string {
  return DIACRITICS[char] ?? '';
}

/**
 * Convert a raw string to a URL-safe slug segment.
 * "Ján Novák" → "jan-novak"
 */
function toSlugBase(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => {
      if (/[a-z0-9]/.test(ch)) return ch;
      if (ch === ' ' || ch === '-' || ch === '_') return '-';
      return transliterate(ch);
    })
    .join('')
    .replace(/-{2,}/g, '-')  // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .slice(0, MAX_SLUG_LENGTH);
}

/**
 * Generate a unique URL slug from a master's first and last name.
 *
 * Rules:
 * - Source: firstName + " " + lastName → "jan-novak"
 * - Slovak/Czech diacritics are transliterated (á→a, š→s, ž→z, …)
 * - Spaces → hyphens; non-alphanumeric chars removed
 * - Max 60 chars
 * - If the base slug is taken, append -2, -3, … up to -10
 * - If all suffixes are taken, append a random 4-char hex suffix
 *
 * @param firstName - master's first name
 * @param lastName  - master's last name
 * @param existingSlugs - slugs already in the database (to check uniqueness)
 */
export function generateSlug(
  firstName: string,
  lastName: string,
  existingSlugs: string[],
): string {
  const taken = new Set(existingSlugs);
  const base = toSlugBase(`${firstName} ${lastName}`);

  // Fallback: if name produces an empty slug (edge case), use random
  const safeBase = base || 'majstr';

  if (!taken.has(safeBase)) return safeBase;

  // Try numeric suffixes: jan-novak-2 … jan-novak-10
  for (let i = 2; i <= MAX_SUFFIX_ATTEMPTS + 1; i++) {
    const candidate = `${safeBase}-${i}`.slice(0, MAX_SLUG_LENGTH);
    if (!taken.has(candidate)) return candidate;
  }

  // Last resort: random 4-char hex suffix (practically collision-free)
  const random = Math.random().toString(16).slice(2, 6);
  return `${safeBase}-${random}`.slice(0, MAX_SLUG_LENGTH);
}
