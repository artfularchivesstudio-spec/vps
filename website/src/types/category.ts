// src/types/category.ts

/**
 * 🏛️ The Grand Theater of Category Data Models
 *
 * This file contains types related to categories.
 */

/**
 * 📚 The Library Shelves: Category
 * Where we sort our stories, by genre, by theme, by the color of their soul.
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}