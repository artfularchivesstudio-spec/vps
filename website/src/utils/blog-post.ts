// utils/blog-post.ts

import { BlogPost, BlogPostViewModel, TranslationStatus } from '../types/blog';
import { LanguageCode } from '../types/common';

/**
 * 🚀 Transform to ViewModel - Converts raw data into a presentable masterpiece.
 *
 * This function takes a database-centric `BlogPost` object and enriches it
 * with computed properties, making it ready for the UI. It’s the bridge
 * between raw data and a delightful user experience.
 *
 * @param post The raw `BlogPost` object from the database.
 * @param primaryLanguage The primary language to use for defaults.
 * @returns A `BlogPostViewModel` ready for display.
 */
export function toBlogPostViewModel(
  post: BlogPost,
  primaryLanguage: LanguageCode = 'en'
): BlogPostViewModel {
  // 🎯 Determine available languages
  const availableLanguages = [
    primaryLanguage,
    ...Object.keys(post.title_translations || {}),
    ...Object.keys(post.content_translations || {}),
    ...Object.keys(post.excerpt_translations || {}),
    ...Object.keys(post.audio_assets_by_language || {}),
  ].filter((v, i, a) => a.indexOf(v) === i) as LanguageCode[];

  // 📈 Calculate translation status
  const translationStatus = calculateTranslationStatus(post, availableLanguages);

  // 💡 Format reading time
  const formattedReadingTime = post.reading_time
    ? `${post.reading_time} min read`
    : 'Quick read';

  // ✨ Assemble the view model
  return {
    ...post,
    hasAudio: Object.keys(post.audio_assets_by_language || {}).length > 0,
    translationStatus,
    availableLanguages,
    primaryLanguage,
    formattedReadingTime,
    isUpdated: new Date(post.updated_at) > new Date(post.published_at || post.created_at),
  };
}

/**
 * 📊 Translation Status Calculator - Assesses the completeness of translations.
 *
 * This helper determines if a post's translations are non-existent,
 * partial, or complete based on the available languages.
 *
 * @param post The `BlogPost` object.
 * @param availableLanguages A list of all languages with any content.
 * @returns The calculated `TranslationStatus`.
 */
function calculateTranslationStatus(
  post: BlogPost,
  availableLanguages: LanguageCode[]
): TranslationStatus {
  if (availableLanguages.length <= 1) {
    return 'none';
  }

  type TranslatableField = 'title_translations' | 'content_translations' | 'excerpt_translations';
  const requiredFields: TranslatableField[] = ['title_translations', 'content_translations', 'excerpt_translations'];
  const totalLanguages = availableLanguages.length;

  for (const lang of availableLanguages) {
    if (lang === 'en') continue; // Skip primary language check for this logic

    const isPartiallyTranslated = requiredFields.some(field => post[field]?.[lang]);
    const isFullyTranslated = requiredFields.every(field => post[field]?.[lang]);

    if (!isFullyTranslated && isPartiallyTranslated) {
      return 'partial';
    }
    if (!isFullyTranslated) {
      return 'pending';
    }
  }

  return 'complete';
}