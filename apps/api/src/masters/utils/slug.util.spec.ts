import { generateSlug } from './slug.util';

describe('generateSlug()', () => {
  // ── Basic cases ────────────────────────────────────────────────────────────

  it('generates a simple slug from ASCII name', () => {
    expect(generateSlug('Jan', 'Novak', [])).toBe('jan-novak');
  });

  it('lowercases the result', () => {
    expect(generateSlug('JAN', 'NOVAK', [])).toBe('jan-novak');
  });

  // ── Slovak / Czech diacritics ──────────────────────────────────────────────

  it('strips diacritics: á é í ó ú ý', () => {
    expect(generateSlug('Ján', 'Novák', [])).toBe('jan-novak');
  });

  it('strips ľ ĺ š č ž ť ď ň ô ä', () => {
    expect(generateSlug('Ľubomír', 'Štefančík', [])).toBe('lubomir-stefancik');
  });

  it('handles ŕ', () => {
    expect(generateSlug('Ján', 'Matúšŕ', [])).toBe('jan-matusr');
  });

  it('handles ä and ô', () => {
    expect(generateSlug('Päter', 'Môrový', [])).toBe('pater-morovy');
  });

  // ── Uniqueness / suffixes ─────────────────────────────────────────────────

  it('appends -2 when base slug is taken', () => {
    expect(generateSlug('Jan', 'Novak', ['jan-novak'])).toBe('jan-novak-2');
  });

  it('appends -3 when -2 is also taken', () => {
    expect(generateSlug('Jan', 'Novak', ['jan-novak', 'jan-novak-2'])).toBe('jan-novak-3');
  });

  it('tries up to -11 before using random suffix', () => {
    const taken = ['jan-novak'];
    for (let i = 2; i <= 11; i++) taken.push(`jan-novak-${i}`);
    const result = generateSlug('Jan', 'Novak', taken);
    // Should NOT be any of the taken slugs
    expect(taken).not.toContain(result);
    // Should start with base
    expect(result.startsWith('jan-novak-')).toBe(true);
    // Random suffix is 4 hex chars
    const suffix = result.replace('jan-novak-', '');
    expect(suffix).toHaveLength(4);
  });

  // ── Special characters ────────────────────────────────────────────────────

  it('removes non-alphanumeric characters', () => {
    expect(generateSlug("O'Brien", 'Mac-Donnell', [])).toBe('obrien-mac-donnell');
  });

  it('collapses multiple spaces/hyphens into one hyphen', () => {
    expect(generateSlug('Jan  ', '  Novak', [])).toBe('jan-novak');
  });

  it('strips leading and trailing hyphens', () => {
    expect(generateSlug('-Jan-', '-Novak-', [])).toBe('jan-novak');
  });

  // ── Length truncation ─────────────────────────────────────────────────────

  it('truncates result to 60 chars', () => {
    const long = 'A'.repeat(40);
    const result = generateSlug(long, long, []);
    expect(result.length).toBeLessThanOrEqual(60);
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('handles very short names (min 2 chars)', () => {
    const result = generateSlug('Ed', 'Li', []);
    expect(result).toBe('ed-li');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to "majstr" when name produces empty slug', () => {
    // Name made entirely of unsupported chars
    const result = generateSlug('!!!', '???', []);
    expect(result).toBe('majstr');
  });

  it('does not duplicate existing slugs across many masters', () => {
    const slugs: string[] = [];
    const names = [
      ['Jan', 'Novak'],
      ['Jan', 'Novak'],
      ['Jan', 'Novak'],
      ['Peter', 'Kovac'],
      ['Peter', 'Kovac'],
    ];
    for (const [first, last] of names) {
      const s = generateSlug(first, last, slugs);
      expect(slugs).not.toContain(s);
      slugs.push(s);
    }
    expect(new Set(slugs).size).toBe(slugs.length); // all unique
  });

  it('slug contains only a-z, 0-9 and hyphens', () => {
    const cases = [
      ['Ján', 'Novák'],
      ['Ľubomír', 'Štefančík'],
      ['Ed', 'Li'],
      ["O'Brien", 'Mac'],
    ];
    for (const [first, last] of cases) {
      const result = generateSlug(first, last, []);
      expect(result).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
