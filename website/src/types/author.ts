// src/types/author.ts

/**
 * 🏛️ The Grand Theater of Author Data Models
 *
 * This file contains types related to authors.
 */

/**
 * ✍️ The Playwright: Author
 * The creative genius, the master of words, the one who breathes life into our characters.
 */
export interface Author {
  id: number;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  social_links?: Record<string, string>;
}