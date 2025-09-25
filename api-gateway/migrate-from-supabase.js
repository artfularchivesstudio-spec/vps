// 🌟 The Enhanced Supabase to Strapi Migration Script - Complete Data Porting Magic ✨
// 🎭 The Spellbinding Museum Director's Ultimate Migration Ritual

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.STRAPI_ADMIN_API_TOKEN;
const STRAPI_URL = process.env.STRAPI_URL || (process.env.NODE_ENV === 'production' ? 'http://strapi:1337' : 'http://localhost:1337');

// 🌐 Supabase connection (using MCP)
const SUPABASE_URL = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const BATCH_SIZE = 10; // Process in batches to avoid overwhelming Strapi

const CONFIG = {
  STRAPI_URL,
  API_TOKEN: STRAPI_API_TOKEN,
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

if (!CONFIG.API_TOKEN) {
  console.warn('⚠️  No Strapi API token detected. Requests may be rejected with HTTP 401.');
} else {
  CONFIG.HEADERS.Authorization = `Bearer ${CONFIG.API_TOKEN}`;
}

/**
 * 🌟 Enhanced transformation function for Supabase blog posts
 * @param {Object} supabasePost - Raw blog post data from Supabase
 * @returns {Object} - Transformed article data for Strapi
 */
function transformSupabasePostToStrapi(supabasePost) {
  console.log(`🔮 Transforming Supabase post ${supabasePost.id} into Strapi article...`);
  
  // 🎭 Use existing data structure from Supabase
  const content = supabasePost.content || supabasePost.ai_analysis_claude || supabasePost.ai_analysis_openai || '';
  const title = supabasePost.title || extractTitleFromContent(content);
  const slug = supabasePost.slug || generateSlug(title);
  const excerpt = supabasePost.excerpt || extractExcerpt(content);
  
  // 🎵 Process audio assets by language
  const audioFilesByLanguage = [];
  if (supabasePost.audio_by_language) {
    Object.entries(supabasePost.audio_by_language).forEach(([lang, audioData]) => {
      audioFilesByLanguage.push({
        language: lang,
        audioUrl: typeof audioData === 'string' ? audioData : audioData?.url,
        status: 'completed',
        voice: audioData?.voice || 'default'
      });
    });
  }
  
  return {
    data: {
      title: title,
      slug: slug,
      excerpt: excerpt,
      content: content,
      status: supabasePost.status || 'draft',
      aiGenerated: supabasePost.origin_source === 'ai' || supabasePost.selected_ai_provider ? true : false,
      aiProvider: supabasePost.selected_ai_provider || 'openai',
      aiPrompt: 'Migrated from Supabase - AI-enhanced content',
      publishedAt: supabasePost.published_at,
      
      // 🎨 Audio files by language (from Supabase audio assets)
      audioFilesByLanguage: audioFilesByLanguage,
      
      // 🖼️ Featured image
      featuredImage: supabasePost.featured_image_url ? {
        url: supabasePost.featured_image_url,
        alternativeText: `Featured image for ${title}`
      } : null,
      
      // 📊 SEO data from existing fields (with length constraints)
      seo: {
        metaTitle: (supabasePost.seo_title || title).substring(0, 60),
        metaDescription: (supabasePost.seo_description || excerpt).substring(0, 160),
        keywords: extractKeywords(content)
      }
    }
  };
}

/**
 * 🎨 Extract title from content (first heading or first sentence)
 */
function extractTitleFromContent(content) {
  if (!content) return 'Untitled';
  
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
function generateSlug(title) {
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
  if (!content) return '';
  
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
async function retryFetch(url, options, retries = 3, delay = 2000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      } else {
        // Log detailed error for debugging
        const errorText = await response.text();
        console.warn(`Attempt ${i + 1} failed with status ${response.status}: ${errorText}`);
        console.warn(`Retrying in ${delay / 1000}s...`);
      }
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed: ${error.message}. Retrying in ${delay / 1000}s...`);
    }
    await new Promise(res => setTimeout(res, delay));
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts: ${lastError?.message}`);
}

/**
 * 🚀 Create Strapi API request
 */
async function createStrapiEntry(contentType, data) {
  const url = `${STRAPI_URL}/api/${contentType}`;
  
  const headers = { ...CONFIG.HEADERS };
  if (CONFIG.API_TOKEN && CONFIG.API_TOKEN !== 'your-api-token-here') {
    headers['Authorization'] = `Bearer ${CONFIG.API_TOKEN}`;
  }

  try {
    const response = await retryFetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
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
async function clearExistingPosts() {
  console.log('🧹 Clearing existing blog posts...');
  try {
    const response = await retryFetch(`${STRAPI_URL}/api/blog-posts`, {
      method: 'GET',
      headers: CONFIG.HEADERS
    });
    
    if (response.ok) {
      const existingPosts = await response.json();
      if (existingPosts.data && existingPosts.data.length > 0) {
        console.log(`Found ${existingPosts.data.length} existing posts. Clearing them...`);
        
        for (const post of existingPosts.data) {
          await retryFetch(`${STRAPI_URL}/api/blog-posts/${post.id}`, {
            method: 'DELETE',
            headers: CONFIG.HEADERS
          });
          console.log(`🗑️ Deleted post: ${post.title}`);
        }
      } else {
        console.log('✨ No existing posts found. Ready for fresh migration.');
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not clear existing posts:', error.message);
  }
}

/**
 * 🌐 Fetch blog posts from Supabase (simulated - you'll need to implement actual MCP calls)
 */
async function fetchSupabasePosts(limit = 100, offset = 0) {
  console.log(`🌐 Fetching blog posts from Supabase (limit: ${limit}, offset: ${offset})...`);
  
  // 🎭 This is a placeholder - you'll need to implement actual MCP calls here
  // For now, we'll simulate with a message
  console.log('📝 Note: This script needs to be integrated with MCP calls to fetch actual Supabase data');
  console.log('💡 Use the mcp_supabase_artful_archives_studio_postgrestRequest function to fetch real data');
  
  return [];
}

/**
 * 🎭 Main migration function
 */
async function migrateFromSupabase(clearFirst = false, batchSize = BATCH_SIZE) {
  console.log('🌟 Starting the mystical Supabase to Strapi migration ritual...');
  console.log(`🔗 Using Strapi URL: ${STRAPI_URL}`);
  
  try {
    // Clear existing posts if requested
    if (clearFirst) {
      await clearExistingPosts();
    }
    
    let totalMigrated = 0;
    let totalFailed = 0;
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      // 🌐 Fetch batch of posts from Supabase
      const posts = await fetchSupabasePosts(batchSize, offset);
      
      if (posts.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`\n🚀 Processing batch of ${posts.length} posts (offset: ${offset})...`);
      
      // Process each post in the batch
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        console.log(`\n📝 Processing post ${i + 1}/${posts.length}: ${post.title || post.id}`);
        
        try {
          const articleData = transformSupabasePostToStrapi(post);
          const result = await createStrapiEntry('blog-posts', articleData);
          
          if (result) {
            totalMigrated++;
            console.log(`✨ Successfully migrated: ${result.data.title}`);
          } else {
            totalFailed++;
          }
        } catch (error) {
          console.error(`❌ Error processing blog post ${post.id}:`, error.message);
          totalFailed++;
        }
        
        // Brief pause between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      offset += batchSize;
      
      // Check if we got a full batch (if not, we're probably at the end)
      if (posts.length < batchSize) {
        hasMore = false;
      }
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Successfully migrated: ${totalMigrated} articles`);
    console.log(`❌ Failed migrations: ${totalFailed} articles`);
    
    if (totalMigrated > 0) {
      console.log(`\n🌟 Migration successful! Check your Strapi admin panel to view the migrated content.`);
      console.log(`🔗 Admin Panel: ${STRAPI_URL}/admin`);
      console.log(`🔗 API Endpoint: ${STRAPI_URL}/api/blog-posts`);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// 🚀 Run the migration if this script is executed directly
if (require.main === module) {
  const clearFirst = process.argv.includes('--clear');
  const batchSize = process.argv.includes('--batch-size') ? 
    parseInt(process.argv[process.argv.indexOf('--batch-size') + 1]) || BATCH_SIZE : 
    BATCH_SIZE;
    
  if (clearFirst) {
    console.log('🧹 Clear mode enabled - will remove existing posts first');
  }
  console.log(`📦 Using batch size: ${batchSize}`);
  
  migrateFromSupabase(clearFirst, batchSize);
}

module.exports = {
  migrateFromSupabase,
  transformSupabasePostToStrapi,
  CONFIG
};
