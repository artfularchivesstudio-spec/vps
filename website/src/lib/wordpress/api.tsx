// src/lib/wordpress/api.ts
import type { WordPressPost } from '@/types/WordPress';

const WORDPRESS_API_URL = 'https://artfularchivesstudio.com/wp-json/wp/v2';

export async function getWordPressPosts(): Promise<WordPressPost[]> {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed`,
      { 
        next: { revalidate: 3600 },
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const posts = await response.json();
    console.log("API - Fetched posts:", posts.length);
    return posts;
  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    return [];
  }
}

export async function getWordPressPost(slug: string) {
    console.log("Fetching post for slug:", slug);
    try {
      const response = await fetch(
        `${WORDPRESS_API_URL}/posts?slug=${encodeURIComponent(slug)}&_embed`,
        { next: { revalidate: 60 } }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const posts = await response.json();
      console.log("API Response for slug:", slug, "Found:", !!posts[0]);
      return posts[0] || null;
    } catch (error) {
      console.error('Error fetching WordPress post:', error);
      return null;
    }
  }