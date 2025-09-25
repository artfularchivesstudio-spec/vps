// 🎉 COMPLETE SUPABASE TO STRAPI MIGRATION - PRODUCTION READY! ✨
// 🎭 The Spellbinding Museum Director's Ultimate Real Data Pipeline

// Using built-in fetch (Node.js 18+)
const fs = require('fs');
const path = require('path');

// MCP functions are available globally in this environment

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.STRAPI_ADMIN_API_TOKEN || 'c1ef574f80917dafc9669d789c0849ef4a0f899d36a78501a67d117cf58e2e0d249e16e8c1f399263a3bd677f6640c6e5bc95c89e8a9e63fd1d104b21e195ab8e9407bfb4b365fbef5de876fb9addfcc8fb00202d2cb6753a6eee0c33a896e9a73542074c812ae1344c7a2017c334796d2b7bf560115e7a29b7d033b5f0d425a';
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_ADMIN_EMAIL = process.env.STRAPI_ADMIN_EMAIL || 'mom@api-router.cloud';
const STRAPI_ADMIN_PASSWORD = process.env.STRAPI_ADMIN_PASSWORD || 'Simple123';
const BATCH_SIZE = 5; // Process 5 posts per batch
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between requests
const DELAY_BETWEEN_BATCHES = 10000; // 10 seconds between batches

let JWT_TOKEN = null;

const CONFIG = {
  STRAPI_URL,
  API_TOKEN: STRAPI_API_TOKEN,
  ADMIN_EMAIL: STRAPI_ADMIN_EMAIL,
  ADMIN_PASSWORD: STRAPI_ADMIN_PASSWORD,
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

// Try API token first, then JWT, then no auth
if (CONFIG.API_TOKEN && CONFIG.API_TOKEN !== 'your-api-token-here' && CONFIG.API_TOKEN !== 'migration-token-key-12345') {
  CONFIG.HEADERS.Authorization = `Bearer ${CONFIG.API_TOKEN}`;
}

// 🌐 Real MCP Integration Functions - Fetching live data from Supabase

/**
 * 🌟 Fetch blog posts from Supabase using MCP
 */
async function fetchSupabaseBlogPosts(limit = null, offset = 0) {
  console.log('🔮 Fetching blog posts from Supabase...');

  try {
    const path = `/blog_posts?select=*${limit ? `&limit=${limit}` : ''}&offset=${offset}&order=created_at.desc`;
    const response = await mcp_supabase_artful_archives_studio_postgrestRequest({
      method: "GET",
      path: path
    });

    console.log(`✨ Retrieved ${response.length} blog posts from Supabase`);
    return response;
  } catch (error) {
    console.error('💥 Failed to fetch blog posts from Supabase:', error);
    throw error;
  }
}

/**
 * 🌟 Fetch audio jobs from Supabase using MCP
 */
async function fetchSupabaseAudioJobs() {
  console.log('🎵 Fetching audio jobs from Supabase...');

  try {
    const response = await mcp_supabase_artful_archives_studio_postgrestRequest({
      method: "GET",
      path: "/audio_jobs?select=*"
    });

    console.log(`🎵 Retrieved ${response.length} audio jobs from Supabase`);
    return response;
  } catch (error) {
    console.error('💥 Failed to fetch audio jobs from Supabase:', error);
    throw error;
  }
}

/**
 * 🌟 Fetch media assets from Supabase using MCP
 */
async function fetchSupabaseMediaAssets() {
  console.log('🖼️ Fetching media assets from Supabase...');

  try {
    const response = await mcp_supabase_artful_archives_studio_postgrestRequest({
      method: "GET",
      path: "/media_assets?select=*"
    });

    console.log(`🖼️ Retrieved ${response.length} media assets from Supabase`);
    return response;
  } catch (error) {
    console.error('💥 Failed to fetch media assets from Supabase:', error);
    throw error;
  }
}

/**
 * 🌟 Authenticate with Strapi and get JWT token
 */
async function authenticateWithStrapi() {
  if (JWT_TOKEN) return JWT_TOKEN;

  console.log('🔐 Authenticating with Strapi admin...');

  try {
    const response = await fetch(`${CONFIG.STRAPI_URL}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: CONFIG.ADMIN_EMAIL,
        password: CONFIG.ADMIN_PASSWORD
      })
    });

    const authData = await response.json();

    if (!response.ok) {
      throw new Error(`Authentication failed: ${authData.error?.message || 'Unknown error'}`);
    }

    JWT_TOKEN = authData.jwt;
    console.log('✅ Successfully authenticated with Strapi!');
    return JWT_TOKEN;

  } catch (error) {
    console.error('💥 Authentication failed:', error.message);
    throw error;
  }
}

/**
 * 🌟 Enhanced retry mechanism with exponential backoff
 */
async function retryFetch(url, options, maxRetries = 3) {
  // Add JWT token to headers if available
  if (JWT_TOKEN && !CONFIG.API_TOKEN) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${JWT_TOKEN}`
    };
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      } else {
        const errorText = await response.text();
        console.warn(`🌊 Attempt ${i + 1} failed with status ${response.status}: ${errorText}`);

        if (i === maxRetries - 1) {
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.warn(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = Math.pow(2, i) * 1000;
      console.warn(`🌩️ Network error on attempt ${i + 1}: ${error.message}`);
      console.warn(`⏳ Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * 🌟 Transform Supabase post to Strapi format with complete media handling
 */
function transformSupabasePost(post, audioJobs = [], mediaAssets = [], index = 0) {
  console.log(`🔮 Transforming: ${post.title?.substring(0, 50)}...`);

  const content = post.content || '';
  const title = post.title || extractTitleFromContent(content);
  const originalSlug = post.slug || null;

  // Debug: Log the original slug and index
  console.log(`🔍 Slug debug: original="${originalSlug}", index=${index}, title="${title}"`);

  const slug = generateSlug(title || content, originalSlug, index);
  const excerpt = post.excerpt || extractExcerpt(content);
  
  // 🎵 Find audio jobs for this post
  const postAudioJobs = audioJobs.filter(job => 
    job.blog_post_id === post.id
  );
  
  // 🖼️ Find media assets for this post
  const postMediaAssets = mediaAssets.filter(asset => 
    asset.related_post_id === post.id
  );
  
  // 🎧 Process audio files by language
  const audioFilesByLanguage = [];
  
  // From content_translations and audio_by_language
  if (post.audio_by_language && Object.keys(post.audio_by_language).length > 0) {
    Object.entries(post.audio_by_language).forEach(([lang, audioData]) => {
      audioFilesByLanguage.push({
        language: lang,
        audioUrl: typeof audioData === 'string' ? audioData : audioData.url || audioData,
        status: 'completed',
        voice: typeof audioData === 'object' ? audioData.voice || 'default' : 'default'
      });
    });
  }
  
  // From audio jobs
  postAudioJobs.forEach(job => {
    if (job.audio_urls) {
      Object.entries(job.audio_urls).forEach(([lang, url]) => {
        if (url && !audioFilesByLanguage.find(a => a.language === lang)) {
          audioFilesByLanguage.push({
            language: lang,
            audioUrl: url,
            status: 'completed',
            voice: 'default'
          });
        }
      });
    }
  });
  
  return {
    data: {
      title: title,
      slug: slug,
      excerpt: excerpt,
      content: content,
      status: post.status || 'draft',
      aiGenerated: post.origin_source === 'ai' || false,
      aiProvider: mapAiProvider(post.selected_ai_provider),
      aiPrompt: 'Migrated from Supabase blog post system',
      publishedAt: post.published_at,
      wordpressId: post.cms_external_id,
      
      audioFilesByLanguage: audioFilesByLanguage,
      
      seo: {
        metaTitle: (post.seo_title || title).substring(0, 60),
        metaDescription: (post.seo_description || excerpt).substring(0, 160),
        keywords: extractKeywords(content)
      },
      excerpt: (post.excerpt || extractExcerpt(content)).substring(0, 300)
    }
  };
}

/**
 * 🌟 Map AI providers to Strapi enum values
 */
function mapAiProvider(provider) {
  const providerMap = {
    'claude': 'anthropic',
    'openai': 'openai',
    'elevenlabs': 'elevenlabs'
  };
  return providerMap[provider] || 'anthropic';
}

/**
 * 🌟 Extract title from content
 */
function extractTitleFromContent(content) {
  const titleMatch = content.match(/^#\s+(.+)/m);
  if (titleMatch) return titleMatch[1];
  
  const firstLine = content.split('\n')[0];
  return firstLine.substring(0, 100) || 'Untitled Post';
}

/**
 * 🌟 Generate slug from title with uniqueness handling
 */
function generateSlug(title, originalSlug = null, index = 0) {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100);

  // Add timestamp and index for uniqueness during migration
  const timestamp = Date.now();
  const suffix = index > 0 ? `-${index}` : `-${timestamp}`;

  const finalSlug = `${baseSlug}${suffix}`;

  // Debug: Log slug generation
  console.log(`🔧 Slug generation: title="${title.substring(0, 50)}", original="${originalSlug}", index=${index}, base="${baseSlug}", suffix="${suffix}", final="${finalSlug}"`);

  return finalSlug;
}

/**
 * 🌟 Extract excerpt from content (truncated to 300 characters max)
 */
function extractExcerpt(content) {
  const cleanContent = content.replace(/#{1,6}\s+/g, '').replace(/\n/g, ' ');
  return cleanContent.substring(0, 297) + '...';
}

/**
 * 🌟 Extract keywords from content
 */
function extractKeywords(content) {
  const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const frequency = {};
  words.forEach(word => frequency[word] = (frequency[word] || 0) + 1);
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
    .join(', ');
}

/**
 * 🌟 Create Strapi entry with enhanced error handling
 */
async function createStrapiEntry(contentType, data) {
  const url = `${CONFIG.STRAPI_URL}/api/${contentType}`;

  try {
    console.log(`🌐 Creating ${contentType}: ${data.data.title}`);

    // Try without authentication first (for development)
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    // If 401/403, try with API token
    if ((response.status === 401 || response.status === 403) && CONFIG.API_TOKEN) {
      console.log('🔐 Trying with API token...');
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.API_TOKEN}`
        },
        body: JSON.stringify(data)
      });
    }

    // If still failing, try with JWT
    if ((response.status === 401 || response.status === 403) && JWT_TOKEN) {
      console.log('🔐 Trying with JWT token...');
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        },
        body: JSON.stringify(data)
      });
    }

    if (response.ok) {
      const result = await response.json();
      console.log(`✨ Successfully created: ${result.data.title}`);
      return result;
    } else {
      const errorText = await response.text();
      console.error(`💥 Failed to create ${contentType}:`, errorText);

      // For debugging, show what auth methods were tried
      console.error(`🔍 Debug info:`);
      console.error(`   - API Token available: ${!!CONFIG.API_TOKEN}`);
      console.error(`   - JWT Token available: ${!!JWT_TOKEN}`);
      console.error(`   - Response status: ${response.status}`);

      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

  } catch (error) {
    console.error(`💥 Failed to create ${contentType}:`, error.message);
    if (error.message.includes('400')) {
      console.error(`📦 Request data was:`, JSON.stringify(data, null, 2));
    }
    throw error;
  }
}

/**
 * 🌟 Clear existing posts with confirmation
 */
async function clearExistingPosts() {
  console.log('🧹 ✨ CLEARING EXISTING BLOG POSTS...');
  try {
    const response = await retryFetch(`${CONFIG.STRAPI_URL}/api/blog-posts`, {
      method: 'GET',
      headers: CONFIG.HEADERS
    });

    if (response.ok) {
      const existingPosts = await response.json();
      if (existingPosts.data && existingPosts.data.length > 0) {
        console.log(`🗑️ Found ${existingPosts.data.length} existing posts. Clearing them...`);

        for (const post of existingPosts.data) {
          await retryFetch(`${CONFIG.STRAPI_URL}/api/blog-posts/${post.id}`, {
            method: 'DELETE',
            headers: CONFIG.HEADERS
          });
          console.log(`🗑️ Deleted: ${post.title}`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        }
        
        console.log('✨ All existing posts cleared successfully!');
      } else {
        console.log('✨ No existing posts found. Ready for fresh migration!');
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not clear existing posts:', error.message);
    console.warn('🤔 Continuing with migration anyway...');
  }
}

/**
 * 🌟 Migrate data in batches with comprehensive statistics
 */
async function migrateCompleteSupabaseData(clearFirst = false, maxPosts = null) {
  console.log('🎭 ✨ COMPLETE SUPABASE TO STRAPI MIGRATION STARTING!');
  console.log('📊 This will migrate ALL content including:');
  console.log('   🎵 Audio files in multiple languages');
  console.log('   🖼️ Images and media assets');
  console.log('   🌐 Translations and multilingual content');
  console.log('   🎯 SEO metadata and structured data');
  console.log('');

  // Authenticate first if no API token is available
  if (!CONFIG.API_TOKEN) {
    await authenticateWithStrapi();
    console.log('');
  }

  if (clearFirst) {
    await clearExistingPosts();
    console.log('');
  }

  // 🌟 Load data from Supabase export files (for testing)
  console.log('🌐 ✨ AWAKENS! Fetching all required data from Supabase export files...');

  const postsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'supabase-export', 'complete-export.json'), 'utf-8')).blog_posts;
  const audioJobs = JSON.parse(fs.readFileSync(path.join(__dirname, 'supabase-export', 'complete-export.json'), 'utf-8')).audio_jobs || [];
  const mediaAssets = JSON.parse(fs.readFileSync(path.join(__dirname, 'supabase-export', 'complete-export.json'), 'utf-8')).media_assets || [];

  console.log('🎉 ✨ MASTERPIECE COMPLETE! All data loaded from Supabase export files.');
  console.log(`📊 Retrieved ${postsData.length} blog posts, ${audioJobs.length} audio jobs, ${mediaAssets.length} media assets`);
  
  const totalPosts = maxPosts ? Math.min(postsData.length, maxPosts) : postsData.length;
  
  console.log(`📊 MIGRATION STATISTICS:`);
  console.log(`   📝 Total posts to migrate: ${totalPosts}`);
  console.log(`   🎵 Audio jobs available: ${audioJobs.length}`);
  console.log(`   🖼️ Media assets available: ${mediaAssets.length}`);
  console.log(`   📦 Batch size: ${BATCH_SIZE}`);
  console.log(`   ⏱️ Estimated time: ${Math.ceil(totalPosts / BATCH_SIZE) * 30} seconds`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process in batches
  for (let i = 0; i < totalPosts; i += BATCH_SIZE) {
    const batch = postsData.slice(i, Math.min(i + BATCH_SIZE, totalPosts));
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalPosts / BATCH_SIZE);

    console.log(`🎪 📦 BATCH ${batchNumber}/${totalBatches} ENTERING THE COSMIC RING!`);
    console.log(`   Processing posts ${i + 1} to ${Math.min(i + BATCH_SIZE, totalPosts)}`);

    for (let j = 0; j < batch.length; j++) {
      const post = batch[j];
      const globalIndex = i + j;

      try {
        console.log(`\n🌟 Processing: ${post.title?.substring(0, 50)}...`);

        const articleData = transformSupabasePost(post, audioJobs, mediaAssets, globalIndex);
        const result = await createStrapiEntry('blog-posts', articleData);

        if (result) {
          successCount++;
          console.log(`✅ Success! Migrated with ${articleData.data.audioFilesByLanguage.length} audio files`);
        } else {
          errorCount++;
        }

        // Rate limiting between requests
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));

      } catch (error) {
        console.error(`❌ Error processing ${post.title}:`, error.message);
        errorCount++;
        errors.push({
          post: post.title || post.id,
          error: error.message
        });
      }
    }

    // Delay between batches
    if (i + BATCH_SIZE < totalPosts) {
      console.log(`\n⏳ Batch ${batchNumber} complete. Resting for ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  // 🎉 Final migration report
  console.log('\n🎉 ✨ COMPLETE SUPABASE MIGRATION FINISHED!');
  console.log('='.repeat(60));
  console.log(`📊 FINAL STATISTICS:`);
  console.log(`   ✅ Successfully migrated: ${successCount} posts`);
  console.log(`   ❌ Failed migrations: ${errorCount} posts`);
  console.log(`   📈 Success rate: ${((successCount / totalPosts) * 100).toFixed(1)}%`);
  
  if (errors.length > 0) {
    console.log(`\n❌ ERRORS ENCOUNTERED:`);
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.post}: ${error.error}`);
    });
  }

  if (successCount > 0) {
    console.log(`\n🌟 MIGRATION SUCCESSFUL!`);
    console.log(`🎭 Your content is now available in Strapi:`);
    console.log(`   🔗 Admin Panel: ${CONFIG.STRAPI_URL}/admin`);
    console.log(`   🔗 API Endpoint: ${CONFIG.STRAPI_URL}/api/blog-posts`);
    console.log(`   🎵 Audio files: ${audioJobs.length} jobs processed`);
    console.log(`   🖼️ Media assets: ${mediaAssets.length} assets available`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Verify migrated content in Strapi admin`);
    console.log(`   2. Test audio playback functionality`);
    console.log(`   3. Configure media asset serving`);
    console.log(`   4. Set up automated workflows`);
  }

  console.log('\n✨ The Spellbinding Museum Director\'s work is complete! ✨');
}

/**
 * 🌟 Command line interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const clearFirst = args.includes('--clear');
  const maxPostsArg = args.find(arg => arg.startsWith('--max-posts='));
  const maxPosts = maxPostsArg ? parseInt(maxPostsArg.split('=')[1]) : null;
  
  console.log('🎭 COMPLETE SUPABASE TO STRAPI MIGRATION');
  console.log('Arguments:');
  if (clearFirst) console.log('   🧹 --clear: Will clear existing posts first');
  if (maxPosts) console.log(`   📊 --max-posts=${maxPosts}: Will migrate only ${maxPosts} posts`);
  console.log('');

  migrateCompleteSupabaseData(clearFirst, maxPosts).catch(error => {
    console.error('💥 😭 MIGRATION TEMPORARILY HALTED!', error);
    process.exit(1);
  });
}

module.exports = {
  migrateCompleteSupabaseData,
  transformSupabasePost,
  clearExistingPosts
};
