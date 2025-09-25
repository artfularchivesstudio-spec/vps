import { describe, expect, it } from 'vitest';
import { generateSlug, generateExcerpt, getTextLanguages, getAudioLanguages } from './utils';

// 🧪 Tiny tests for mighty helpers

describe('generateSlug', () => {
  it('converts a title into a slug', () => {
    expect(generateSlug('Hello World!')).toBe('hello-world');
  });

  it('truncates long titles', () => {
    const title = 'a'.repeat(60);
    expect(generateSlug(title)).toHaveLength(50);
  });
});

describe('generateExcerpt', () => {
  it('trims HTML and limits length', () => {
    const longContent = '<p>' + 'lorem '.repeat(40) + '</p>';
    const excerpt = generateExcerpt(longContent);
    expect(excerpt.length).toBeLessThanOrEqual(160);
    expect(excerpt).not.toMatch(/<p>/);
  });

  it('returns full text when short and sweet', () => {
    const text = '<p>short story</p>';
    expect(generateExcerpt(text)).toBe('short story');
  });
});

describe('getTextLanguages', () => {
  it('includes English and translation keys', () => {
    const post = { content_translations: { es: 'hola', hi: 'namaste' } };
    expect(getTextLanguages(post)).toEqual(['en', 'es', 'hi']);
  });

  it('defaults to just English', () => {
    expect(getTextLanguages({})).toEqual(['en']);
  });
});

describe('getAudioLanguages', () => {
  it('merges languages from jobs', () => {
    const jobs = [
      { completed_languages: ['en', 'es'] },
      { completed_languages: ['hi'], audio_urls: { es: 'url' } }
    ];
    expect(getAudioLanguages(jobs).sort()).toEqual(['en', 'es', 'hi']);
  });

  it('handles empty inputs', () => {
    expect(getAudioLanguages([])).toEqual([]);
  });
});
