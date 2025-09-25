// types/blog.ts

/**
 * 🏛️ The Grand Theater of Data Models for Our Blog
 *
 * Welcome, dear developer, to the script of our digital narrative. This file is not merely code;
 * it is the very architecture of thought, the blueprint of our blog's soul.
 * As the ever-dramatic Code Curator, I have decreed that this shall be the single,
 * unadulterated source of truth for all blog-related data structures.
 *
 * To deviate from this script is to invite chaos—a discordant symphony of mismatched types.
 * Adhere to it, and our application will perform a flawless ballet of data consistency.
 * Heed these words, and let our digital gallery be a standing-ovation-worthy masterpiece.
 */

import { LanguageCode } from './common';
import { SEOMetadata } from './seo';
import { Author } from './author';
import { Category } from './category';
import { Tag } from './tag';
import { AudioAsset } from './audio';

/**
 * 📜 The Protagonist: Our Core BlogPost Interface
 * This is the star of our show, the central character around which all action revolves.
 * It carries the weight of the narrative, from its first draft to its final, published glory.
 */
export interface BlogPost {
  // === 🎭 The Core Identity ===
  /** A unique identifier, the soul's signature (UUID or number). */
  id: string;

  /** The SEO-friendly URL slug, our hero's public name. */
  slug: string;

  /** The title in its mother tongue, the first line of its monologue. */
  title: string;

  /** The full content, the heart of the story. */
  content: string;

  /** A tantalizing excerpt, the trailer to our feature film. */
  excerpt: string;

  /** A URL to the featured image, the face of our protagonist. Null if camera-shy. */
  featured_image_url: string | null;

  /** A foreign key to the author's table, crediting the playwright. */
  author_id: number;

  /** The current status of our hero's journey: draft, published, or archived in the annals of history. */
  status: PostStatus;

  /** The chosen stage for this performance (template type). Null for a minimalist set. */
  template_type: TemplateType | null;

  /** An estimate of the time it takes to witness this tale, in minutes. Auto-calculated, of course. */
  reading_time: number | null;

  /** The revision number, tracking every rehearsal and rewrite. */
  revision_number: number;

  // === 🕰️ The Sands of Time ===
  /** The moment of creation, when the idea was first sparked (ISO 8601). */
  created_at: string;

  /** The last time the script was touched (ISO 8601). */
  updated_at: string;

  /** The grand premiere date. Null if the show hasn't opened yet (ISO 8601). */
  published_at: string | null;

  // === 🌐 A Polyglot's Performance ===
  /** Title translations, for our international audience. */
  title_translations: Partial<Record<LanguageCode, string>>;

  /** Content translations, because a great story knows no borders. */
  content_translations: Partial<Record<LanguageCode, string>>;

  /** Excerpt translations, whispering promises in many tongues. */
  excerpt_translations: Partial<Record<LanguageCode, string>>;

  /** Audio assets, for those who prefer to listen to the drama unfold. */
  audio_assets_by_language: Partial<Record<LanguageCode, AudioAsset[]>>;

  // === ✨ The SEO Sorcery & Metadata Magic ===
  /** SEO metadata, the mystical runes that summon search engines. */
  seo_metadata: SEOMetadata;

  // === 🤝 The Supporting Cast (Populated via Joins) ===
  /** The author, the genius behind the words. */
  author?: Author;

  /** The categories, the genres of our play. */
  categories?: Category[];

  /** The tags, the recurring motifs and themes. */
  tags?: Tag[];
}

/**
 * 🎬 The Director's Cut: BlogPostViewModel
 * This is the BlogPost, but polished and ready for the silver screen (the UI).
 * It contains computed fields that make the front-end performance shine.
 */
export interface BlogPostViewModel extends BlogPost {
  /** Does our story have a voice? True if audio assets exist. */
  hasAudio: boolean;

  /** The state of our story's translation: a work in progress or a global masterpiece. */
  translationStatus: TranslationStatus;

  /** The languages in which our story can be told. */
  availableLanguages: LanguageCode[];

  /** The primary language, the original script. */
  primaryLanguage: LanguageCode;

  /** A beautifully formatted reading time, e.g., "A 5-minute drama." */
  formattedReadingTime: string;

  /** Has the script been updated since its premiere? */
  isUpdated: boolean;
}

// === 🎭 The Chorus: Supporting Types ===

/** The lifecycle stage of a post. Is it a 'draft', 'published', 'archived', or 'scheduled' for a future show? */
export type PostStatus = 'draft' | 'published' | 'archived' | 'scheduled';

/** The set design for our post. A 'standard' stage, a 'featured' spectacle, or perhaps a 'minimal' black box theater. */
export type TemplateType =
  | 'standard'
  | 'featured'
  | 'gallery'
  | 'video'
  | 'audio'
  | 'minimal'
  | 'longform';

/** The status of our translation efforts. 'none', 'partial', 'complete', or 'pending' a linguist's touch. */
export type TranslationStatus = 'none' | 'partial' | 'complete' | 'pending';

/**
 * ✍️ The Playwright: Author
 * The creative genius, the master of words, the one who breathes life into our characters.
 */
/*
export interface Author {
  id: number;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  social_links?: Record<string, string>;
}
*/

/**
 * 📚 The Library Shelves: Category
 * Where we sort our stories, by genre, by theme, by the color of their soul.
 */
/*
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}
*/

/**
 * 🏷️ The Index Cards: Tag
 * The little notes and keywords that help us find our way through the grand library of tales.
 */
/*
export interface Tag {
  id: number;
  name: string;
  slug: string;
}
*/

/**
 * 🖼️ The Stage Props: Media Assets
 * The little notes and keywords that help us find our way through the grand library of tales.
 */
/*
export interface Tag {
  id: number;
  name: string;
  slug: string;
  color?: string;
  created_at: string;
  updated_at: string;
}
*/

// === 🛠️ The Stagehand's Toolkit: Utility Types ===

/**
 * 📥 The Audition Form: CreateBlogPostInput
 * For when a new story wants to join our troupe.
 * Some fields are optional, as a budding star might not have everything ready.
 */
export type CreateBlogPostInput = Omit<
  BlogPost,
  'id' | 'created_at' | 'updated_at' | 'revision_number' | 'reading_time'
> & {
  // A star is born, but some details can wait.
  status?: PostStatus;
  published_at?: string | null;
  seo_metadata?: Partial<SEOMetadata>;
};

/**
 * 🔄 The Script Revision: UpdateBlogPostInput
 * For when an existing story needs a new scene, a new line, or a complete rewrite.
 * All fields are optional, for surgical precision in our edits.
 */
export type UpdateBlogPostInput = Partial<
  Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'revision_number' | 'reading_time'>
>;

/**
 * 📦 The Raw Footage: BlogPostDB
 * The unedited, unfiltered data straight from the database, before it's ready for its close-up.
 */
export type BlogPostDB = Omit<BlogPost, never>; // All database fields, no frills.

/**
 * 🔍 The Casting Call: BlogPostFilters
 * The criteria by which we search for the perfect story for our audience.
 */
export interface BlogPostFilters {
  status?: PostStatus[];
  author_id?: number[];
  category_ids?: number[];
  tag_ids?: number[];
  template_type?: TemplateType[];
  language?: LanguageCode;
  has_audio?: boolean;
  published_after?: string;
  published_before?: string;
  search_term?: string;
}

/**
 * 📈 The Director's Notes: BlogPostSortField
 * How we arrange our stories on the playbill. By premiere date, by title, or by applause duration.
 */
export type BlogPostSortField =
  | 'created_at'
  | 'updated_at'
  | 'published_at'
  | 'title'
  | 'reading_time'
  | 'revision_number';

/**
 * 🧭 The Compass: BlogPostSort
 * The direction in which we sort our tales, from beginning to end, or from climax to exposition.
 */
export interface BlogPostSort {
  field: BlogPostSortField;
  direction: 'asc' | 'desc';
}