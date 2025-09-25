/**
 * Strapi CMS API integration for Artful Archives
 * 
 * This file provides a comprehensive client for the self-hosted Strapi CMS
 * with fallback to WordPress when Strapi is unavailable
 */

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337/api';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

interface StrapiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  cache?: RequestInit['cache'];
  next?: NextFetchRequestConfig;
}

/**
 * Make an authenticated request to Strapi API
 */
async function strapiRequest<T>(endpoint: string, options: StrapiRequestOptions = {}): Promise<T> {
  const url = `${STRAPI_API_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (STRAPI_API_TOKEN) {
    headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    cache: options.cache || 'no-store',
    next: options.next || { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch blog posts from Strapi
 */
export async function getBlogPosts(page = 1, pageSize = 10) {
  try {
    const data = await strapiRequest<any>(
      `/articles?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate[]=featuredImage&populate[]=categories&populate[]=tags&populate[]=author&populate[]=author.avatar`
    );
    
    return {
      posts: data.data.map(transformStrapiPost),
      pagination: {
        currentPage: data.meta.pagination.page,
        totalPages: data.meta.pagination.pageCount,
        totalPosts: data.meta.pagination.total,
      }
    };
  } catch (error) {
    console.error('Error fetching blog posts from Strapi:', error);
    
    // Fallback to WordPress if Strapi is not available
    const { getBlogPosts } = await import('./wordpress');
    return getBlogPosts(page, pageSize);
  }
}

/**
 * Fetch a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string) {
  try {
    const data = await strapiRequest<any>(
      `/articles?filters[slug][$eq]=${slug}&populate[]=featuredImage&populate[]=categories&populate[]=tags&populate[]=author&populate[]=author.avatar&populate[]=seo&populate[]=gallery`
    );
    
    if (data.data.length === 0) {
      return null;
    }
    
    return transformStrapiPost(data.data[0]);
  } catch (error) {
    console.error(`Error fetching blog post with slug "${slug}" from Strapi:`, error);
    
    // Fallback to WordPress if Strapi is not available
    const { getBlogPostBySlug } = await import('./wordpress');
    return getBlogPostBySlug(slug);
  }
}

/**
 * Fetch blog categories from Strapi
 */
export async function getBlogCategories() {
  try {
    const data = await strapiRequest<any>(
      `/categories?sort=orderIndex:asc&populate[]=featuredImage`,
      { next: { revalidate: 3600 } }
    );
    
    return data.data.map((category: any) => ({
      id: category.id,
      name: category.attributes.name,
      slug: category.attributes.slug,
      description: category.attributes.description,
      color: category.attributes.color,
      icon: category.attributes.icon,
      orderIndex: category.attributes.orderIndex,
      count: category.attributes.articles?.data?.length || 0,
      featuredImage: category.attributes.featuredImage?.data?.attributes?.url 
        ? getMediaUrl(category.attributes.featuredImage.data.attributes.url)
        : null,
    }));
  } catch (error) {
    console.error('Error fetching blog categories from Strapi:', error);
    
    // Fallback to WordPress if Strapi is not available
    const { getBlogCategories } = await import('./wordpress');
    return getBlogCategories();
  }
}

/**
 * Fetch featured articles from Strapi
 */
export async function getFeaturedPosts() {
  try {
    const data = await strapiRequest<any>(
      `/articles?filters[featured][$eq]=true&sort=createdAt:desc&populate[]=featuredImage&populate[]=categories&populate[]=author`
    );
    
    return data.data.map(transformStrapiPost);
  } catch (error) {
    console.error('Error fetching featured posts from Strapi:', error);
    
    // Fallback to WordPress featured posts
    const { getBlogPosts } = await import('./wordpress');
    const posts = await getBlogPosts(1, 6);
    return posts.posts.slice(0, 3); // Return first 3 as featured
  }
}

/**
 * Search articles in Strapi
 */
export async function searchArticles(query: string) {
  try {
    const data = await strapiRequest<any>(
      `/articles?filters[$or][0][title][$containsi]=${query}&filters[$or][1][excerpt][$containsi]=${query}&filters[$or][2][content][$containsi]=${query}&populate[]=featuredImage&populate[]=categories&populate[]=author`
    );
    
    return data.data.map(transformStrapiPost);
  } catch (error) {
    console.error('Error searching articles in Strapi:', error);
    
    // Fallback to WordPress search
    const { getBlogPosts } = await import('./wordpress');
    const posts = await getBlogPosts();
    return posts.posts.filter((post: any) => 
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(query.toLowerCase())
    );
  }
}

/**
 * Fetch articles by category
 */
export async function getPostsByCategory(categorySlug: string) {
  try {
    const data = await strapiRequest<any>(
      `/articles?filters[categories][slug][$eq]=${categorySlug}&sort=createdAt:desc&populate[]=featuredImage&populate[]=categories&populate[]=author`
    );
    
    return data.data.map(transformStrapiPost);
  } catch (error) {
    console.error(`Error fetching posts by category "${categorySlug}" from Strapi:`, error);
    
    // Fallback to WordPress category posts
    const { getBlogPosts } = await import('./wordpress');
    const posts = await getBlogPosts();
    return posts.posts; // WordPress API would need category filtering
  }
}

/**
 * Fetch blog tags from Strapi
 */
export async function getBlogTags() {
  try {
    const data = await strapiRequest<any>(
      `/tags?sort=usageCount:desc`,
      { next: { revalidate: 3600 } }
    );
    
    return data.data.map((tag: any) => ({
      id: tag.id,
      name: tag.attributes.name,
      slug: tag.attributes.slug,
      description: tag.attributes.description,
      color: tag.attributes.color,
      usageCount: tag.attributes.usageCount || 0,
    }));
  } catch (error) {
    console.error('Error fetching blog tags from Strapi:', error);
    return [];
  }
}

/**
 * Fetch articles by tag
 */
export async function getPostsByTag(tagSlug: string) {
  try {
    const data = await strapiRequest<any>(
      `/articles?filters[tags][slug][$eq]=${tagSlug}&sort=createdAt:desc&populate[]=featuredImage&populate[]=categories&populate[]=author`
    );
    
    return data.data.map(transformStrapiPost);
  } catch (error) {
    console.error(`Error fetching posts by tag "${tagSlug}" from Strapi:`, error);
    return [];
  }
}

/**
 * Fetch authors from Strapi
 */
export async function getAuthors() {
  try {
    const data = await strapiRequest<any>(
      `/authors?filters[active][$eq]=true&populate[]=avatar&populate[]=socialMedia`,
      { next: { revalidate: 3600 } }
    );
    
    return data.data.map((author: any) => ({
      id: author.id,
      name: author.attributes.name,
      slug: author.attributes.slug,
      bio: author.attributes.bio,
      role: author.attributes.role,
      avatar: author.attributes.avatar?.data?.attributes?.url 
        ? getMediaUrl(author.attributes.avatar.data.attributes.url)
        : null,
      socialMedia: author.attributes.socialMedia || {},
    }));
  } catch (error) {
    console.error('Error fetching authors from Strapi:', error);
    return [];
  }
}

/**
 * Get media URL with proper base URL
 */
function getMediaUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return `${STRAPI_API_URL.replace('/api', '')}${path}`;
}

/**
 * 🌐 Harmonize Strapi posts into our house style.
 * Keeps WordPress + Strapi friends talking without awkward silences.
 * Psst… no translation needed, just JSON diplomacy. 😏
 */
function transformStrapiPost(post: any) {
  const attributes = post.attributes;
  
  return {
    id: post.id,
    title: attributes.title,
    slug: attributes.slug,
    excerpt: attributes.excerpt,
    content: attributes.content,
    date: attributes.publishedAt,
    modified: attributes.updatedAt,
    featuredImage: attributes.featuredImage?.data?.attributes?.url 
      ? getMediaUrl(attributes.featuredImage.data.attributes.url)
      : null,
    gallery: attributes.gallery?.data?.map((img: any) => ({
      url: getMediaUrl(img.attributes.url),
      alt: img.attributes.alternativeText || '',
      caption: img.attributes.caption || '',
      width: img.attributes.width,
      height: img.attributes.height,
    })) || [],
    // 🎧 Turn the optional Strapi audio file into a friendly URL.
    audioUrl: attributes.audioFile?.data?.attributes?.url
      ? getMediaUrl(attributes.audioFile.data.attributes.url)
      : null, // If there's silence, it's on Strapi, not us 🎤
    // Legacy alias for any code still expecting the old field name
    audioFile: attributes.audioFile?.data?.attributes?.url
      ? getMediaUrl(attributes.audioFile.data.attributes.url)
      : null,
    author: {
      id: attributes.author?.data?.id || 0,
      name: attributes.author?.data?.attributes?.name || 'Unknown',
      slug: attributes.author?.data?.attributes?.slug || '',
      bio: attributes.author?.data?.attributes?.bio || '',
      avatar: attributes.author?.data?.attributes?.avatar?.data?.attributes?.url 
        ? getMediaUrl(attributes.author.data.attributes.avatar.data.attributes.url)
        : null,
    },
    categories: attributes.categories?.data?.map((cat: any) => ({
      id: cat.id,
      name: cat.attributes.name,
      slug: cat.attributes.slug,
      color: cat.attributes.color,
      description: cat.attributes.description,
    })) || [],
    tags: attributes.tags?.data?.map((tag: any) => ({
      id: tag.id,
      name: tag.attributes.name,
      slug: tag.attributes.slug,
      color: tag.attributes.color,
      description: tag.attributes.description,
    })) || [],
    // Strapi-specific enhancements
    featured: attributes.featured || false,
    viewCount: attributes.viewCount || 0,
    readingTime: attributes.readingTime || 0,
    seo: attributes.seo || {},
    aiAnalysis: attributes.aiAnalysis || null,
    audioMetadata: attributes.audioMetadata || null,
    // Add metadata for system identification
    metaData: {
      source: 'strapi',
      strapiId: post.id,
      wordpressId: attributes.wordpressId || null,
      lastSynced: new Date().toISOString(),
    }
  };
}

/**
 * Check if Strapi is available and healthy
 */
export async function checkStrapiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${STRAPI_API_URL.replace('/api', '')}/_health`, {
      method: 'GET',
      cache: 'no-store',
    });
    
    return response.ok;
  } catch (error) {
    console.warn('Strapi health check failed:', error);
    return false;
  }
}

/**
 * Get Strapi CMS status and statistics
 */
export async function getStrapiStats() {
  try {
    const [articlesData, categoriesData, tagsData, authorsData] = await Promise.all([
      strapiRequest<any>('/articles?pagination[pageSize]=1'),
      strapiRequest<any>('/categories?pagination[pageSize]=1'),
      strapiRequest<any>('/tags?pagination[pageSize]=1'),
      strapiRequest<any>('/authors?pagination[pageSize]=1'),
    ]);

    return {
      articles: articlesData.meta?.pagination?.total || 0,
      categories: categoriesData.meta?.pagination?.total || 0,
      tags: tagsData.meta?.pagination?.total || 0,
      authors: authorsData.meta?.pagination?.total || 0,
      isHealthy: true,
    };
  } catch (error) {
    console.error('Error fetching Strapi stats:', error);
    return {
      articles: 0,
      categories: 0,
      tags: 0,
      authors: 0,
      isHealthy: false,
    };
  }
} 