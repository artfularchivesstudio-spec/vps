// 🌟 The Data Migration Script - From Supabase to Strapi Magic ✨
// 🎭 The Spellbinding Museum Director's Data Porting Ritual

const { Blob } = require('node:buffer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.STRAPI_ADMIN_API_TOKEN;
// Resolve Strapi URL based on environment
const STRAPI_URL = process.env.STRAPI_URL || (process.env.NODE_ENV === 'production' ? 'http://strapi:1337' : 'http://localhost:1337');
let blogPostsData = require('./blogPostsData.json');

// Function to check if Strapi is ready
async function checkStrapiReady(url, retries = 15, delay = 3000) { // Increased retries and delay
  for (let i = 0; i < retries; i++) {
    try {
      // Use a more reliable endpoint like /api/content-type-builder/content-types to check if Strapi is ready
      const headers = {};
      if (STRAPI_API_TOKEN) {
        headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
      }
      const response = await fetch(`${url}/api/content-type-builder/content-types`, { 
        method: 'GET',
        headers: headers
      });
      if (response.ok) {
        console.log('Strapi is ready!');
        return true;
      }
    } catch (error) {
      console.warn(`Strapi not ready yet. Attempt ${i + 1}/${retries}. Retrying in ${delay / 1000}s...`);
    }
    await new Promise(res => setTimeout(res, delay));
  }
  throw new Error(`Strapi did not become ready after ${retries} attempts.`);
}

const CONFIG = {
  STRAPI_URL,
  API_TOKEN: process.env.STRAPI_API_TOKEN || 'your-api-token-here',
  POSTS_PATH: 'api-gateway/supabase-export/blog_posts.json',
  CONTENT_TYPES: {
    blog_posts: 'blog-posts',
    categories: 'categories', 
    tags: 'tags'
  },
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

if (!CONFIG.API_TOKEN) {
  console.warn('⚠️  No Strapi API token detected. Requests may be rejected with HTTP 401.');
} else {
  CONFIG.HEADERS.Authorization = `Bearer ${CONFIG.API_TOKEN}`;
}

// Add function to download and upload media to Strapi
async function downloadAndUploadMedia(strapiUrl, authToken, mediaUrl, filename) {
  try {
    console.log(`Downloading media from: ${mediaUrl}`);
    const response = await retryFetch(mediaUrl);
    if (!response.ok) {
      console.warn(`Failed to download media from ${mediaUrl}: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const mediaFormData = new FormData();
    mediaFormData.append('files', new Blob([buffer]), filename);

    const uploadResponse = await retryFetch(`${strapiUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: mediaFormData,
    });

    if (!uploadResponse.ok) {
      console.warn(`Failed to upload media to Strapi: ${uploadResponse.status}`);
      return null;
    }

    const uploadResult = await uploadResponse.json();
    return uploadResult[0]; // Return the uploaded media object
  } catch (error) {
    console.error(`Error downloading/uploading media: ${error.message}`);
    return null;
  }
}

// Enhanced transformation function with translations and media handling
function transformAudioJobToArticle(blogPost, strapiUrl, authToken) {
  return async () => {
    const baseData = {
      title: blogPost.title,
      slug: blogPost.slug || generateSlug(blogPost.title),
      excerpt: blogPost.excerpt,
      content: blogPost.content,
      status: blogPost.status || 'draft',
      aiGenerated: blogPost.origin_source === 'ai' || false,
      aiProvider: blogPost.selected_ai_provider || 'openai',
      aiPrompt: 'Migrated from existing blog post system',
      publishedAt: blogPost.published_at,
      audioFilesByLanguage: Object.entries(blogPost.audio_by_language || {}).map(([lang, audioData]) => ({
        language: lang,
        audioUrl: audioData.url || audioData,
        status: 'completed',
        voice: audioData.voice || 'default'
      })),
      seo: {
        metaTitle: (blogPost.seo_title || blogPost.title).substring(0, 60),
        metaDescription: (blogPost.seo_description || blogPost.excerpt).substring(0, 160),
        keywords: extractKeywords(blogPost.content)
      }
    };

    // Handle featured image
    if (blogPost.featured_image_url) {
      const imageFilename = `featured-${blogPost.slug || generateSlug(blogPost.title)}.jpg`;
      const uploadedImage = await downloadAndUploadMedia(strapiUrl, authToken, blogPost.featured_image_url, imageFilename);
      if (uploadedImage) {
        baseData.featuredImage = uploadedImage.id;
      }
    }

    // Handle audio files if present
    if (blogPost.audio_assets_by_language && Object.keys(blogPost.audio_assets_by_language).length > 0) {
      // Process audio files similar to images
      const audioPromises = Object.entries(blogPost.audio_assets_by_language).map(async ([lang, audioData]) => {
        if (audioData.url) {
          const audioFilename = `audio-${blogPost.slug || generateSlug(blogPost.title)}-${lang}.mp3`;
          const uploadedAudio = await downloadAndUploadMedia(strapiUrl, authToken, audioData.url, audioFilename);
          return uploadedAudio ? { language: lang, audio: uploadedAudio.id } : null;
        }
        return null;
      });

      const uploadedAudios = (await Promise.all(audioPromises)).filter(Boolean);
      if (uploadedAudios.length > 0) {
        baseData.audioFile = uploadedAudios[0].audio; // Use first audio as main audio file
      }
    }

    return { data: baseData };
  };
}

// Function to create localized content entries
async function createLocalizedEntry(strapiUrl, authToken, baseEntryId, locale, localizedData) {
  try {
    const response = await retryFetch(`${strapiUrl}/api/blog-posts/${baseEntryId}/localizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        locale,
        ...localizedData
      }),
    });

    if (!response.ok) {
      console.warn(`Failed to create localized entry for locale ${locale}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error creating localized entry: ${error.message}`);
    return null;
  }
}

// Enhanced migration function with translation support
async function migrateData() {
  const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
  const authToken = process.env.STRAPI_API_TOKEN;

  if (!authToken) {
    console.error('STRAPI_API_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    // Load blog posts data
    let blogPostsData = JSON.parse(fs.readFileSync('./supabase-export/blog-posts.json', 'utf8'));
    // Take only first 3 posts for testing if TEST_MODE is set
    if (process.env.TEST_MODE === 'true') {
      blogPostsData = blogPostsData.slice(0, 3);
      console.log(`🧪 TEST MODE: Processing only ${blogPostsData.length} posts`);
    }
    console.log(`Loaded ${blogPostsData.length} blog posts from export`);

    // Check if Strapi is ready
    await checkStrapiReady(strapiUrl);

    // Clear existing posts if requested
    if (process.argv.includes('--clear')) {
      console.log('Clearing existing blog posts...');
      await clearExistingPosts(strapiUrl, authToken);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const blogPost of blogPostsData) {
      try {
        console.log(`Processing blog post: ${blogPost.title}`);

        // Create base entry (English/default locale)
        const transformFn = transformAudioJobToArticle(blogPost, strapiUrl, authToken);
        const baseEntryData = await transformFn();

        const createResponse = await retryFetch(`${strapiUrl}/api/blog-posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(baseEntryData),
        });

        if (!createResponse.ok) {
          console.error(`Failed to create blog post "${blogPost.title}": ${createResponse.status}`);
          errorCount++;
          continue;
        }

        const createdEntry = await createResponse.json();
        console.log(`Created base entry for: ${blogPost.title} (ID: ${createdEntry.data.id})`);

        // Handle translations
        const translations = [];
        if (blogPost.content_translations && Object.keys(blogPost.content_translations).length > 0) {
          for (const [locale, translatedContent] of Object.entries(blogPost.content_translations)) {
            if (locale !== 'en' && translatedContent) { // Skip English as it's the base
              const localizedData = {
                title: blogPost.title_translations?.[locale] || blogPost.title,
                content: translatedContent,
                excerpt: blogPost.excerpt_translations?.[locale] || blogPost.excerpt,
              };

              const localizedEntry = await createLocalizedEntry(strapiUrl, authToken, createdEntry.data.id, locale, localizedData);
              if (localizedEntry) {
                translations.push(locale);
                console.log(`Created ${locale} translation for: ${blogPost.title}`);
              }
            }
          }
        }

        if (translations.length > 0) {
          console.log(`Created translations for ${blogPost.title}: ${translations.join(', ')}`);
        }

        successCount++;
      } catch (error) {
        console.error(`Error processing blog post "${blogPost.title}": ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`- Successfully migrated: ${successCount} posts`);
    console.log(`- Errors: ${errorCount} posts`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * 🎨 Extract title from content (first heading or first sentence)
 */
function extractTitleFromContent(content) {
  const lines = content.split('\n');
  const firstHeading = lines.find(line => line.startsWith('#'));
  if (firstHeading) {
    return firstHeading.replace(/^#+\s*/, '').trim();
  }
  
  const firstSentence = content.split('.')[0];
  return firstSentence.length > 100 ? firstSentence.substring(0, 100) + '...' : firstSentence;
}

/**
 * 📝 Generate URL-friendly slug from content
 */
function generateSlug(content) {
  const title = extractTitleFromContent(content);
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

/**
 * 📖 Extract excerpt from content (first paragraph or 300 chars)
 */
function extractExcerpt(content) {
  const paragraphs = content.split('\n\n');
  const firstParagraph = paragraphs.find(p => p.trim().length > 50);
  if (firstParagraph) {
    return firstParagraph.substring(0, 300) + (firstParagraph.length > 300 ? '...' : '');
  }
  return content.substring(0, 300) + (content.length > 300 ? '...' : '');
}

/**
 * 🏷️ Extract keywords from content
 */
function extractKeywords(content) {
  const keywords = [];
  
  // Look for keyword sections
  const keywordMatch = content.match(/Keywords?[:\s]*(.+?)(?:\n|$)/i);
  if (keywordMatch) {
    const keywordText = keywordMatch[1];
    keywords.push(...keywordText.split(/[,\n-]/).map(k => k.trim()).filter(k => k.length > 2));
  }
  
  // Add some default keywords based on content
  if (content.toLowerCase().includes('art')) keywords.push('Art', 'Artwork');
  if (content.toLowerCase().includes('analysis')) keywords.push('Analysis', 'Art Analysis');
  if (content.toLowerCase().includes('visual')) keywords.push('Visual Arts');
  
  return keywords.slice(0, 10).join(', ');
}

/**
 * 🔄 Retry mechanism for fetch requests
 */
async function retryFetch(url, options, retries = 5, delay = 2000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      } else if (response.status === 405) { // Method Not Allowed is a configuration issue, not a retry candidate
        throw new Error(`HTTP ${response.status}: Method Not Allowed. Check Strapi API configuration.`);
      } else {
        // Log detailed error for debugging
        const errorText = await response.text();
        console.warn(`Attempt ${i + 1} failed with status ${response.status}: ${errorText}`);
        console.warn(`Retrying in ${delay / 1000}s...`);
      }
    } catch (error) {
      lastError = error;
      const cause = error?.cause;
      const detail = cause?.code || cause?.message;
      const suffix = detail ? ` (${detail})` : '';
      if (cause?.code === 'ECONNREFUSED') {
        console.warn(`❌ Connection refused. Retrying in ${delay / 1000}s...`);
      } else {
        console.warn(`Attempt ${i + 1} failed: ${error.message}${suffix}. Retrying in ${delay / 1000}s...`);
      }
    }
    await new Promise(res => setTimeout(res, delay));
  }
  const cause = lastError?.cause;
  const detail = cause?.code || cause?.message;
  const suffix = detail ? ` (${detail})` : '';
  throw new Error(`Failed to fetch ${url} after ${retries} attempts.${suffix}`);
}

/**
 * 🚀 Create Strapi API request
 */
async function createStrapiEntry(contentType, data) {
  const url = `${STRAPI_URL}/api/${contentType}`;
  
  const headers = { ...CONFIG.HEADERS };
  if (CONFIG.API_TOKEN && CONFIG.API_TOKEN !== 'your-api-token-here') {
    headers['Authorization'] = `Bearer ${CONFIG.API_TOKEN}`;
  } else {
    console.warn('⚠️ No valid Strapi API token provided. Attempting request without authentication. This will likely result in an authorization error.');
  }

  try {
    // Use retryFetch for the actual API call
    const response = await retryFetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      // Log the response body for debugging
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      console.error(`📦 Request data was:`, JSON.stringify(data, null, 2));
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Created ${contentType}: ${result.data?.id || 'unknown'}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to create ${contentType}:`, error.message);
    return null;
  }
}

/**
 * 🗑️ Clear existing blog posts (optional)
 */
async function clearExistingPosts(strapiUrl, authToken) {
  console.log('🧹 Clearing existing blog posts...');
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };

    const response = await retryFetch(`${strapiUrl}/api/blog-posts`, {
      method: 'GET',
      headers: headers
    });
    
    if (response.ok) {
      const existingPosts = await response.json();
      if (existingPosts.data && existingPosts.data.length > 0) {
        console.log(`Found ${existingPosts.data.length} existing posts. Clearing them...`);
        
        for (const post of existingPosts.data) {
          await retryFetch(`${strapiUrl}/api/blog-posts/${post.id}`, {
            method: 'DELETE',
            headers: headers
          });
          console.log(`🗑️ Deleted post: ${post.attributes?.title || post.title || post.id}`);
        }
      } else {
        console.log('✨ No existing posts found. Ready for fresh migration.');
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not clear existing posts:', error.message);
  }
}

// 🚀 Run the migration if this script is executed directly
if (require.main === module) {
  const clearFirst = process.argv.includes('--clear');
  if (clearFirst) {
    console.log('🧹 Clear mode enabled - will remove existing posts first');
  }
  migrateData(clearFirst);
}

module.exports = {
  migrateData,
  transformAudioJobToArticle,
  CONFIG
};
