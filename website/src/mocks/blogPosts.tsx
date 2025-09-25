/**
 * @file This file contains mock data for blog posts.
 *
 * Some might call this a "data source." Others, a "treasure trove of digital musings."
 * We just call it `blogPosts.tsx`.
 *
 * This is where we keep the fake articles that make our site look busy.
 * It's like a Potemkin village, but for content.
 *
 * @overview This file exports an array of `BlogPost` objects. These objects are used for testing,
 * development, and populating the site with content before a real backend is in place.
 * Or, you know, if the real backend decides to take an unscheduled vacation.
 *
 * @example
 * ```typescript
 * import { blogPosts } from "@/mocks/blogPosts";
 *
 * const latestPost = blogPosts[0];
 * console.log(latestPost.title);
 * ```
 *
 * @see src/types/blog.ts For the `BlogPost` type definition. It's probably changed again since you last looked.
 */

import { BlogPost } from "@/types/blog";

/**
 * @description A collection of blog posts about art and artists.
 * Because every website needs a little culture. Even if it's just for show.
 */
export const artAndArtistsPosts: BlogPost[] = [
  {
    id: '1',
    slug: "the-renaissance-of-digital-art",
    title: "The Renaissance of Digital Art",
    excerpt: "Explore how digital tools are reshaping the landscape of contemporary art...",
    content: "Full article content here... It's probably lorem ipsum, let's be honest.",
    featured_image_url: "/digital-art.jpg",
    author_id: 1,
    status: 'published',
    template_type: 'standard',
    reading_time: 5,
    revision_number: 1,
    created_at: '2023-05-15T10:00:00.000Z',
    updated_at: '2023-05-15T10:00:00.000Z',
    published_at: '2023-05-15T10:00:00.000Z',
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      og_title: "The Renaissance of Digital Art",
      meta_description: "Explore how digital tools are reshaping the landscape of contemporary art...",
      focus_keywords: ["digital art", "contemporary art", "art techniques"]
    },
    // "In the beginning, there was a pixel. And it was good."
  },
  {
    id: '2',
    slug: "mastering-watercolor-techniques",
    title: "Mastering Watercolor Techniques",
    excerpt: "Discover the secrets to creating stunning watercolor paintings...",
    content: "Full article content here... Just add water.",
    featured_image_url: "/watercolor.jpg",
    author_id: 1,
    status: 'published',
    template_type: 'standard',
    reading_time: 7,
    revision_number: 1,
    created_at: '2023-05-20T10:00:00.000Z',
    updated_at: '2023-05-20T10:00:00.000Z',
    published_at: '2023-05-20T10:00:00.000Z',
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      og_title: "Mastering Watercolor Techniques",
      meta_description: "Discover the secrets to creating stunning watercolor paintings...",
      focus_keywords: ["watercolor", "painting", "art techniques"]
    },
    // "It's like painting with tears, but happier."
  }
];

/**
 * @description A more general collection of blog posts.
 * A veritable smorgasbord of intellectual delights. Or something like that.
 */
export const blogPosts: BlogPost[] = [
  {
    id: '3',
    slug: "exploring-abstract-art",
    title: "Exploring Abstract Art",
    excerpt: "Dive into the world of abstract art and discover the creative expressions that defy traditional boundaries.",
    content: "Full article content here... It's abstract, you wouldn't get it.",
    featured_image_url: "/abstract-art.png",
    author_id: 2,
    status: 'published',
    template_type: 'standard',
    reading_time: 8,
    revision_number: 1,
    created_at: '2023-06-01T10:00:00.000Z',
    updated_at: '2023-06-01T10:00:00.000Z',
    published_at: '2023-06-01T10:00:00.000Z',
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      og_title: "Exploring Abstract Art",
      meta_description: "Dive into the world of abstract art and discover the creative expressions that defy traditional boundaries.",
      focus_keywords: ["abstract art", "art exploration", "modern art"]
    },
    // "My kid could paint that." - Every dad at a modern art museum.
  },
  {
    id: '4',
    slug: "artist-spotlight-jane-doe",
    title: "Artist Spotlight: Jane Doe",
    excerpt: "Get to know Jane Doe, an emerging artist known for her innovative techniques and captivating artworks.",
    content: "Full article content here... She's the next big thing. Or so her mom says.",
    featured_image_url: "/jane-doe.png",
    author_id: 2,
    status: 'published',
    template_type: 'standard',
    reading_time: 4,
    revision_number: 1,
    created_at: '2023-06-05T10:00:00.000Z',
    updated_at: '2023-06-05T10:00:00.000Z',
    published_at: '2023-06-05T10:00:00.000Z',
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      og_title: "Artist Spotlight: Jane Doe",
      meta_description: "Get to know Jane Doe, an emerging artist known for her innovative techniques and captivating artworks.",
      focus_keywords: ["jane doe", "artist spotlight", "emerging artist"]
    },
    // "Who is Jane Doe? A mystery wrapped in an enigma, covered in paint."
  },
  {
    id: '5',
    slug: 'the-art-of-sculpture',
    title: "The Art of Sculpture",
    excerpt: "Explore the intricate world of sculpture, from classical to contemporary, and learn about the artists behind these masterpieces.",
    content: "Full article content here... It's like 3D art, but without the funny glasses.",
    featured_image_url: "/sculpture.png",
    author_id: 1,
    status: 'published',
    template_type: 'standard',
    reading_time: 10,
    revision_number: 1,
    created_at: '2023-06-10T10:00:00.000Z',
    updated_at: '2023-06-10T10:00:00.000Z',
    published_at: '2023-06-10T10:00:00.000Z',
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      og_title: "The Art of Sculpture",
      meta_description: "Explore the intricate world of sculpture, from classical to contemporary, and learn about the artists behind these masterpieces.",
      focus_keywords: ["sculpture", "art techniques", "classical art"]
    },
    // "Some artists have a chip on their shoulder. Sculptors have a chisel."
  },
  {
    id: '6',
    slug: "street-art-creativity-unleashed",
    title: "Street Art: Creativity Unleashed",
    excerpt: "Discover the vibrant world of street art and meet the artists who turn public spaces into canvases for their creativity.",
    content: "Full article content here... The only art form where you can get arrested for your work.",
    featured_image_url: "/street-art.png",
    author_id: 3,
    status: 'published',
    template_type: 'standard',
    reading_time: 6,
    revision_number: 1,
    created_at: '2023-06-15T10:00:00.000Z',
    updated_at: '2023-06-15T10:00:00.000Z',
    published_at: '2023-06-15T10:00:00.000Z',
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      og_title: "Street Art: Creativity Unleashed",
      meta_description: "Discover the vibrant world of street art and meet the artists who turn public spaces into canvases for their creativity.",
      focus_keywords: ["street art", "art exploration", "graffiti"]
    },
    // "Is it art or is it vandalism? That's for the courts to decide."
  },
  {
    id: '7',
    slug: "impetus",
    title: "Impetus",
    excerpt: "Discover the vibrant world of street art and meet the artists who turn public spaces into canvases for their creativity.",
    content: "Full article content here... A single word, a world of meaning. Or maybe we just ran out of ideas.",
    featured_image_url: "/street-art.png", //TODO: Replace with Kandinsky
    author_id: 3,
    status: 'draft',
    template_type: 'standard',
    reading_time: 2,
    revision_number: 1,
    created_at: '2024-10-16T10:00:00.000Z',
    updated_at: '2024-10-16T10:00:00.000Z',
    published_at: null,
    title_translations: {},
    content_translations: {},
    excerpt_translations: {},
    audio_assets_by_language: {},
    seo_metadata: {
      og_title: "Impetus",
      meta_description: "Discover the vibrant world of street art and meet the artists who turn public spaces into canvases for their creativity.",
      focus_keywords: ["impetus", "art", "philosophy"]
    },
    // "TODO: Replace with Kandinsky. Or don't. Who's going to notice?"
  },
];
