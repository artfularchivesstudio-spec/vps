/**
 * Unified API client
 * 
 * This file exports functions that abstract away the data source.
 * It will use Strapi as the primary source and fall back to WordPress
 * if needed. Eventually, this could be replaced by calls to Swift Vapor.
 */

// Import data sources
import * as strapiClient from './strapi';
import * as wordpressClient from './wordpress';
import * as supabaseClient from './supabase';

// 🎭 The Grand Data Source Selection - Our Theatrical Director's Choice
// This can be changed based on environment variables or feature flags
const USE_STRAPI = process.env.USE_STRAPI === 'true' || true; // Default to Strapi for mystical content management!
const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || false; // Keep Supabase for authentication only

const primaryClient = USE_STRAPI ? strapiClient : (USE_SUPABASE ? supabaseClient : wordpressClient);

/**
 * Get blog posts with pagination
 */
export async function getBlogPosts(page = 1, pageSize = 10) {
  if (USE_SUPABASE) {
    const posts = await supabaseClient.getAllPosts();
    return {
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(posts.length / pageSize),
        totalPosts: posts.length,
      }
    };
  }
  const client = USE_STRAPI ? strapiClient : wordpressClient;
  return client.getBlogPosts(page, pageSize);
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string) {
  if (USE_SUPABASE) {
    return supabaseClient.getPostBySlug(slug);
  }
  const client = USE_STRAPI ? strapiClient : wordpressClient;
  return client.getBlogPostBySlug(slug);
}

/**
 * Get blog categories
 */
export async function getBlogCategories() {
  if (USE_SUPABASE) {
    // TODO: Implement getBlogCategories for Supabase
    return [];
  }
  const client = USE_STRAPI ? strapiClient : wordpressClient;
  return client.getBlogCategories();
}

/**
 * Get featured blog posts
 */
export async function getFeaturedPosts() {
  if (USE_STRAPI && 'getFeaturedPosts' in strapiClient) {
    return strapiClient.getFeaturedPosts();
  }
  
  // Fallback: get first few posts as featured
  const posts = await getBlogPosts(1, 6);
  return posts.posts.slice(0, 3);
}

/**
 * Search articles
 */
export async function searchArticles(query: string) {
  if (USE_STRAPI && 'searchArticles' in strapiClient) {
    return strapiClient.searchArticles(query);
  }
  
  // Fallback: basic search in WordPress
  const posts = await getBlogPosts(1, 50);
  return posts.posts.filter((post: any) => 
    post.title.toLowerCase().includes(query.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(categorySlug: string) {
  if (USE_STRAPI && 'getPostsByCategory' in strapiClient) {
    return strapiClient.getPostsByCategory(categorySlug);
  }
  
  // Fallback: filter posts by category
  const posts = await getBlogPosts(1, 50);
  return posts.posts.filter((post: any) => 
    post.categories?.some((cat: any) => cat.slug === categorySlug)
  );
}

/**
 * Get blog tags
 */
export async function getBlogTags() {
  if (USE_STRAPI && 'getBlogTags' in strapiClient) {
    return strapiClient.getBlogTags();
  }
  
  return [];
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tagSlug: string) {
  if (USE_STRAPI && 'getPostsByTag' in strapiClient) {
    return strapiClient.getPostsByTag(tagSlug);
  }
  
  return [];
}

/**
 * Get authors
 */
export async function getAuthors() {
  if (USE_STRAPI && 'getAuthors' in strapiClient) {
    return strapiClient.getAuthors();
  }
  
  return [];
}

/**
 * Check if the API is healthy and responding
 * This can be used for health checks and monitoring
 */
export async function healthCheck() {
  const results = {
    strapi: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
    wordpress: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
    primarySource: USE_STRAPI ? 'strapi' : 'wordpress',
    stats: null as any,
  };

  // Check Strapi health
  try {
    if ('checkStrapiHealth' in strapiClient) {
      const isHealthy = await strapiClient.checkStrapiHealth();
      results.strapi = isHealthy ? 'healthy' : 'unhealthy';
      
      if (isHealthy && 'getStrapiStats' in strapiClient) {
        results.stats = await strapiClient.getStrapiStats();
      }
    } else {
      const strapiResponse = await fetch(
        process.env.STRAPI_API_URL || 'http://localhost:1337/api',
        { method: 'HEAD', next: { revalidate: 300 } }
      );
      results.strapi = strapiResponse.ok ? 'healthy' : 'unhealthy';
    }
  } catch (error) {
    console.log('Strapi health check failed:', error);
    results.strapi = 'unhealthy';
  }
  
  // Check WordPress health
  try {
    const wpResponse = await fetch(
      process.env.WORDPRESS_API_URL || 'https://artfularchivesstudio.com/wp-json/wp/v2',
      { method: 'HEAD', next: { revalidate: 300 } }
    );
    results.wordpress = wpResponse.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    console.log('WordPress health check failed:', error);
    results.wordpress = 'unhealthy';
  }
  
  return results;
}

/**
 * API configuration and status information
 */
export function getApiConfig() {
  return {
    primarySource: USE_STRAPI ? 'strapi' : 'wordpress',
    endpoints: {
      strapi: process.env.STRAPI_API_URL || 'http://localhost:1337/api',
      wordpress: process.env.WORDPRESS_API_URL || 'https://artfularchivesstudio.com/wp-json/wp/v2',
      vapor: process.env.VAPOR_API_URL || null,
    },
    vaporEnabled: process.env.USE_VAPOR === 'true',
  };
}