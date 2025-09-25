/**
 * WordPress API integration
 * 
 * This file contains functions to fetch data from WordPress REST API
 */

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://artfularchivestudio.local/wp-json/wp/v2';

/**
 * Fetch blog posts from WordPress
 */
export async function getBlogPosts(page = 1, perPage = 10) {
  try {
    console.log(`Fetching posts from WordPress API: ${WORDPRESS_API_URL}/posts`);
    
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?page=${page}&per_page=${perPage}&_embed=1`,
      { next: { revalidate: 30 } } // Reduce revalidation time for local development
    );
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }
    
    const posts = await response.json();
    console.log(`Fetched ${posts.length} posts successfully`);
    
    // Extract total posts and pages from headers
    const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);
    
    // Transform WordPress data to a cleaner structure
    const transformedPosts = posts.map(transformPost);
    
    return {
      posts: transformedPosts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
      }
    };
  } catch (error) {
    console.error('Error fetching blog posts from WordPress:', error);
    return {
      posts: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalPosts: 0,
      }
    };
  }
}

/**
 * Fetch a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string) {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?slug=${slug}&_embed=1`,
      { next: { revalidate: 60 } }
    );
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }
    
    const posts = await response.json();
    
    if (posts.length === 0) {
      return null;
    }
    
    return transformPost(posts[0]);
  } catch (error) {
    console.error(`Error fetching blog post with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Fetch blog categories from WordPress
 */
export async function getBlogCategories() {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/categories`,
      { next: { revalidate: 3600 } } // Revalidate every hour
    );
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }
    
    const categories = await response.json();
    
    return categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      count: category.count,
    }));
  } catch (error) {
    console.error('Error fetching blog categories from WordPress:', error);
    return [];
  }
}

/**
 * Transform a WordPress post to a cleaner structure
 */
function transformPost(post: any) {
  console.log(`Transforming post: ${post.title.rendered}`);
  
  // For local WordPress, the featured image might be structured differently
  let featuredImage = null;
  
  if (post._embedded && post._embedded['wp:featuredmedia']) {
    const media = post._embedded['wp:featuredmedia'][0];
    featuredImage = media.source_url || media.guid?.rendered || null;
    
    // For local WordPress setups, ensure the URL is using the correct domain
    if (featuredImage && featuredImage.includes('localhost')) {
      featuredImage = featuredImage.replace('localhost', 'artfularchivestudio.local');
    }
  }
  
  return {
    id: post.id,
    title: post.title.rendered,
    slug: post.slug,
    excerpt: post.excerpt.rendered,
    content: post.content.rendered,
    date: post.date,
    modified: post.modified,
    featuredImage: featuredImage,
    author: {
      id: post._embedded?.['author']?.[0]?.id || 0,
      name: post._embedded?.['author']?.[0]?.name || 'Unknown',
      avatar: post._embedded?.['author']?.[0]?.avatar_urls?.['96'] || null,
    },
    categories: post._embedded?.['wp:term']?.[0]?.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    })) || [],
    tags: post._embedded?.['wp:term']?.[1]?.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })) || [],
  };
} 