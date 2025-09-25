// src/types/tag.ts

/**
 * 🏛️ The Grand Theater of Tag Data Models
 *
 * This file contains types related to tags.
 */

/**
 * 🏷️ The Index Cards: Tag
 * The little notes and keywords that help us find our way through the grand library of tales.
 */
export interface Tag {
  id: number;
  name: string;
  slug: string;
  color?: string;
  created_at: string;
  updated_at: string;
}