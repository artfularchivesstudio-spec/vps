// src/types/seo.ts

/**
 * 🏛️ The Grand Theater of SEO Data Models
 *
 * This file contains types related to SEO.
 */

/**
 * ✨ The SEO Spellbook: SEOMetadata
 * These are the incantations we use to charm the great beasts of the internet (Google, Twitter, etc.).
 * Use them wisely, for they determine our story's reach.
 */
export interface SEOMetadata {
  /** A meta description, a siren's call to search engine users. */
  meta_description?: string;

  /** The Open Graph title, for a grand entrance on social media. */
  og_title?: string;

  /** The Open Graph description, a captivating summary for the scrolling masses. */
  og_description?: string;

  /** The Open Graph image, a picture worth a thousand clicks. */
  og_image?: string;

  /** The Twitter card type, choosing our costume for the Twitter masquerade. */
  twitter_card?: 'summary' | 'summary_large_image' | 'app' | 'player';

  /** The Twitter title, our 280-character headline. */
  twitter_title?: string;

  /** The Twitter description, our witty bio for the Twitterverse. */
  twitter_description?: string;

  /** The Twitter image, our profile picture for the bird app. */
  twitter_image?: string;

  /** The canonical URL, the one true address of our story. */
  canonical_url?: string;

  /** Focus keywords, the secret handshake for our SEO club. */
  focus_keywords?: string[];

  /** Custom meta tags, for when you need to write your own spells. */
  custom_meta?: Record<string, string>;
}