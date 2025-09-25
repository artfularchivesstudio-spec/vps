// __tests__/utils/blog-post.test.ts

import { describe, it, expect } from 'vitest';
import { toBlogPostViewModel } from '../../utils/blog-post';
import { BlogPost, PostStatus, TemplateType } from '../../types/blog';
import { LanguageCode } from '../../types/common';
import { AudioAsset } from '../../types/audio';

// 🎭 The Great Transformation Test - Verifying the alchemy of turning raw data into a masterpiece.
describe('toBlogPostViewModel', () => {
  // 🧪 A simple BlogPost, waiting for its glow-up.
  const basePost: BlogPost = {
    id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    slug: 'hello-world',
    title: 'Hello World',
    content: 'This is the content.',
    excerpt: 'This is the excerpt.',
    featured_image_url: 'https://example.com/featured.png',
    author_id: 1,
    status: 'published',
    template_type: 'standard',
    reading_time: 5,
    revision_number: 1,
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
    published_at: '2023-01-01T12:00:00Z',
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
        meta_description: "A post about saying hello.",
        og_title: "Hello World",
        og_description: "A post about saying hello.",
        og_image: "https://example.com/og.png",
        twitter_card: 'summary_large_image',
        twitter_title: "Hello World",
        twitter_description: "A post about saying hello.",
        twitter_image: "https://example.com/twitter.png",
        canonical_url: "https://example.com/hello-world",
    },
  };

  // 👉 Test Case 1: Basic Transformation
  it('should transform a basic BlogPost to a BlogPostViewModel', () => {
    const viewModel = toBlogPostViewModel(basePost);
    expect(viewModel).toBeDefined();
    expect(viewModel.slug).toBe('hello-world');
    expect(viewModel.primaryLanguage).toBe('en');
  });

  // 👉 Test Case 2: Audio Availability
  it('should correctly determine if audio is available', () => {
    const postWithAudio: BlogPost = {
      ...basePost,
      audio_assets_by_language: { 'en': [{ id: '1', url: 'audio.mp3', duration: 120, format: 'mp3', language: 'en', revision_number: 1, created_at: '2023-01-01T12:00:00Z', updated_at: '2023-01-01T12:00:00Z', is_chunk: false, chunk_order: null, parent_audio_id: null }] },
    };
    const postWithoutAudio: BlogPost = { ...basePost, audio_assets_by_language: {} };

    const viewModelWithAudio = toBlogPostViewModel(postWithAudio);
    const viewModelWithoutAudio = toBlogPostViewModel(postWithoutAudio);

    expect(viewModelWithAudio.hasAudio).toBe(true);
    expect(viewModelWithoutAudio.hasAudio).toBe(false);
  });

  // 👉 Test Case 3: Translation Status
  it('should calculate translation status correctly', () => {
    const noTranslations: BlogPost = { ...basePost };
    const partialTranslations: BlogPost = {
      ...basePost,
      title_translations: { es: 'Hola Mundo' },
    };
    const completeTranslations: BlogPost = {
      ...basePost,
      title_translations: { es: 'Hola Mundo' },
      content_translations: { es: 'Contenido' },
      excerpt_translations: { es: 'Extracto' },
    };

    const vmNone = toBlogPostViewModel(noTranslations);
    const vmPartial = toBlogPostViewModel(partialTranslations);
    const vmComplete = toBlogPostViewModel(completeTranslations);

    expect(vmNone.translationStatus).toBe('none');
    expect(vmPartial.translationStatus).toBe('partial');
    expect(vmComplete.translationStatus).toBe('complete');
  });

  // 👉 Test Case 4: Reading Time Formatting
  it('should format the reading time correctly', () => {
    const postWithTime: BlogPost = { ...basePost, reading_time: 10 };
    const postWithoutTime: BlogPost = { ...basePost, reading_time: null };

    const vmWithTime = toBlogPostViewModel(postWithTime);
    const vmWithoutTime = toBlogPostViewModel(postWithoutTime);

    expect(vmWithTime.formattedReadingTime).toBe('10 min read');
    expect(vmWithoutTime.formattedReadingTime).toBe('Quick read');
  });

  // 👉 Test Case 5: Update Status
  it('should correctly determine if the post has been updated', () => {
    const notUpdatedPost: BlogPost = { ...basePost, updated_at: basePost.created_at };
    const updatedPost: BlogPost = { ...basePost, updated_at: '2023-01-02T12:00:00Z' };

    const vmNotUpdated = toBlogPostViewModel(notUpdatedPost);
    const vmUpdated = toBlogPostViewModel(updatedPost);

    expect(vmNotUpdated.isUpdated).toBe(false);
    expect(vmUpdated.isUpdated).toBe(true);
  });
});