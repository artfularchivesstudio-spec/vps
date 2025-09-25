import { describe, it, expect } from 'vitest';
import {
  updateTranslationMemory,
  generateSocialVariants,
  markTranslationsStale,
  TranslationMemory
} from '@/lib/localizedMediaPipeline';

/**
 * 🧪 Tests for the localized media helpers—small but mighty, like a chihuahua with a test runner.
 */
describe('localized media pipeline', () => {
  it('updates translation memory and flags for review', () => {
    const memory: TranslationMemory = {};
    const updated = updateTranslationMemory(memory, 'post-1', 'es', 'hola mundo');
    expect(updated['post-1'].es.text).toBe('hola mundo');
    expect(updated['post-1'].es.needsReview).toBe(true);
  });

  it('marks existing translations as stale when source updates', () => {
    /**
     * When the English copy gets a glow-up, every other locale should raise its hand for review ✋.
     * This test makes sure the "needsReview" flag flips for our polyglot pals.
     */
    const memory: TranslationMemory = {
      'post-1': {
        en: { text: 'hello world', needsReview: false },
        es: { text: 'hola mundo', needsReview: false },
        hi: { text: 'नमस्ते दुनिया', needsReview: false }
      }
    };
    const flagged = markTranslationsStale(memory, 'post-1');
    expect(flagged['post-1'].en.needsReview).toBe(false);
    expect(flagged['post-1'].es.needsReview).toBe(true);
    expect(flagged['post-1'].hi.needsReview).toBe(true);
  });

  it('generates social variants of different lengths', () => {
    const variants = generateSocialVariants('abcdefghij');
    expect(variants.long.length).toBe(10);
    expect(variants.medium.length).toBe(5);
    expect(variants.short.length).toBe(2);
  });
});
