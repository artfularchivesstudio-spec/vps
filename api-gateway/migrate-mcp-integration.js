// 🌟 MCP-Integrated Supabase to Strapi Migration - Real Data Pipeline ✨
// 🎭 The Spellbinding Museum Director's Live Data Migration Magic

/**
 * 🌐 This script demonstrates how to integrate with MCP calls
 * Replace the sample data functions with actual MCP calls to your Supabase
 */

// Configuration
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.STRAPI_ADMIN_API_TOKEN;
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const BATCH_SIZE = 20;

const CONFIG = {
  STRAPI_URL,
  API_TOKEN: STRAPI_API_TOKEN,
  HEADERS: { 'Content-Type': 'application/json' }
};

if (CONFIG.API_TOKEN && CONFIG.API_TOKEN !== 'your-api-token-here') {
  CONFIG.HEADERS.Authorization = `Bearer ${CONFIG.API_TOKEN}`;
}

/**
 * 🌐 Fetch blog posts from Supabase via MCP
 * This function would be replaced with actual MCP calls
 */
async function fetchSupabaseBlogPosts(limit = 20, offset = 0) {
  console.log(`🌐 Fetching ${limit} blog posts from Supabase (offset: ${offset})...`);
  
  // 🎭 In your implementation, replace this with:
  /*
  const posts = await mcp_supabase_artful_archives_studio_postgrestRequest({
    method: "GET",
    path: `/blog_posts?select=*&limit=${limit}&offset=${offset}&order=created_at.desc`
  });
  return posts;
  */
  
  // For demonstration, return sample data
  if (offset >= 40) return []; // Simulate end of data
  
  return [
    {
      id: `post-${offset + 1}`,
      title: `Sample Blog Post ${offset + 1}`,
      slug: `sample-blog-post-${offset + 1}`,
      content: `This is sample content for blog post ${offset + 1}. It contains art analysis and visual descriptions...`,
      excerpt: `Sample excerpt for post ${offset + 1}`,
      featured_image_url: `https://example.com/image-${offset + 1}.jpg`,
      status: 'draft',
      origin_source: 'manual',
      selected_ai_provider: 'claude',
      created_at: new Date().toISOString(),
      ai_analysis_claude: `AI analysis for post ${offset + 1}`,
      seo_title: `SEO title for post ${offset + 1}`,
      seo_description: `SEO description for post ${offset + 1}`
    },
    {
      id: `post-${offset + 2}`,
      title: `Another Art Analysis ${offset + 2}`,
      slug: `another-art-analysis-${offset + 2}`,
      content: `Detailed art analysis content for post ${offset + 2}...`,
      excerpt: `Excerpt for analysis ${offset + 2}`,
      status: 'draft',
      origin_source: 'ai',
      selected_ai_provider: 'openai',
      created_at: new Date().toISOString()
    }
  ].slice(0, Math.min(limit, 2)); // Return up to 2 sample posts per batch
}

/**
 * 🎵 Fetch audio jobs from Supabase via MCP
 */
async function fetchSupabaseAudioJobs(postIds = []) {
  console.log(`🎵 Fetching audio jobs for ${postIds.length} posts...`);
  
  // 🎭 In your implementation, replace this with:
  /*
  const audioJobs = await mcp_supabase_artful_archives_studio_postgrestRequest({
    method: "GET", 
    path: `/audio_jobs?select=*&post_id=in.(${postIds.join(',')})&status=eq.complete`
  });
  return audioJobs;
  */
  
  // Sample audio jobs
  return postIds.map(postId => ({
    id: `audio-job-${postId}`,
    post_id: postId,
    status: 'complete',
    audio_urls: {
      en: `https://example.com/audio/${postId}_en.mp3`,
      es: `https://example.com/audio/${postId}_es.mp3`,
      hi: `https://example.com/audio/${postId}_hi.mp3`
    },
    translated_texts: {
      en: `English translation for ${postId}`,
      es: `Spanish translation for ${postId}`,
      hi: `Hindi translation for ${postId}`
    }
  }));
}

/**
 * 🖼️ Fetch media assets from Supabase via MCP
 */
async function fetchSupabaseMediaAssets(postIds = []) {
  console.log(`🖼️ Fetching media assets for ${postIds.length} posts...`);
  
  // 🎭 In your implementation, replace this with:
  /*
  const mediaAssets = await mcp_supabase_artful_archives_studio_postgrestRequest({
    method: "GET",
    path: `/media_assets?select=*&related_post_id=in.(${postIds.join(',')})`
  });
  return mediaAssets;
  */
  
  // Sample media assets
  return postIds.flatMap(postId => [
    {
      id: `media-${postId}-1`,
      related_post_id: postId,
      file_url: `https://example.com/images/${postId}_featured.jpg`,
      file_type: 'image',
      title: `Featured image for ${postId}`,
      mime_type: 'image/jpeg'
    },
    {
      id: `media-${postId}-2`,
      related_post_id: postId,
      file_url: `https://example.com/audio/${postId}_narration.mp3`,
      file_type: 'audio',
      title: `Audio narration for ${postId}`,
      mime_type: 'audio/mpeg'
    }
  ]);
}

/**
 * 🎭 Transform complete post with all media
 */
function transformCompletePost(post, audioJobs, mediaAssets) {
  const relatedAudio = audioJobs.find(job => job.post_id === post.id);
  const relatedMedia = mediaAssets.filter(media => media.related_post_id === post.id);
  
  // Process audio files by language
  const audioFilesByLanguage = [];
  if (relatedAudio?.audio_urls) {
    Object.entries(relatedAudio.audio_urls).forEach(([lang, url]) => {
      audioFilesByLanguage.push({
        language: lang,
        audioUrl: url,
        status: 'completed',
        voice: 'default'
      });
    });
  }
  
  return {
    data: {
      title: post.title,
      slug: post.slug || generateSlug(post.title),
      excerpt: post.excerpt || extractExcerpt(post.content),
      content: post.content || post.ai_analysis_claude || post.ai_analysis_openai || '',
      status: post.status || 'draft',
      aiGenerated: post.origin_source === 'ai' || !!post.selected_ai_provider,
      aiProvider: mapAiProvider(post.selected_ai_provider),
      aiPrompt: 'Migrated from Supabase with complete multimedia assets',
      publishedAt: post.published_at,
      audioFilesByLanguage: audioFilesByLanguage,
      seo: {
        metaTitle: (post.seo_title || post.title).substring(0, 60),
        metaDescription: (post.seo_description || post.excerpt || '').substring(0, 160),
        keywords: extractKeywords(post.content || '')
      },
      wordpressId: post.id // Store original ID for reference
    }
  };
}

// Helper functions
function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
}

function extractExcerpt(content) {
  if (!content) return '';
  return content.replace(/[#*]/g, '').trim().substring(0, 300);
}

function extractKeywords(content) {
  const keywords = [];
  if (content.toLowerCase().includes('art')) keywords.push('Art');
  if (content.toLowerCase().includes('analysis')) keywords.push('Analysis');
  return keywords.join(', ');
}

function mapAiProvider(provider) {
  const mapping = { 'claude': 'anthropic', 'openai': 'openai', 'elevenlabs': 'elevenlabs' };
  return mapping[provider] || 'anthropic';
}

/**
 * 🚀 Create entry in Strapi
 */
async function createStrapiEntry(data) {
  try {
    const response = await fetch(`${STRAPI_URL}/api/blog-posts`, {
      method: 'POST',
      headers: CONFIG.HEADERS,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 400 && errorText.includes('unique')) {
        return { skipped: true };
      }
      console.error(`❌ Strapi error:`, errorText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Network error:`, error.message);
    return null;
  }
}

/**
 * 🎭 Main MCP-integrated migration
 */
async function migrateMCPIntegrated(options = {}) {
  const { batchSize = BATCH_SIZE, maxPosts = null } = options;
  
  console.log('🌟 Starting MCP-Integrated Supabase to Strapi migration...');
  console.log(`📦 Batch size: ${batchSize}`);
  
  let totalMigrated = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let offset = 0;
  let batchNumber = 1;
  
  while (true) {
    console.log(`\n📦 BATCH ${batchNumber} - Posts ${offset + 1} to ${offset + batchSize}`);
    
    // Fetch blog posts
    const posts = await fetchSupabaseBlogPosts(batchSize, offset);
    if (posts.length === 0) break;
    
    // Extract post IDs
    const postIds = posts.map(p => p.id);
    
    // Fetch related data
    const [audioJobs, mediaAssets] = await Promise.all([
      fetchSupabaseAudioJobs(postIds),
      fetchSupabaseMediaAssets(postIds)
    ]);
    
    console.log(`📊 Batch data: ${posts.length} posts, ${audioJobs.length} audio jobs, ${mediaAssets.length} media assets`);
    
    // Process each post
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n   📄 ${i + 1}/${posts.length}: ${post.title}`);
      
      try {
        const transformedData = transformCompletePost(post, audioJobs, mediaAssets);
        const result = await createStrapiEntry(transformedData);
        
        if (result?.skipped) {
          totalSkipped++;
          console.log(`   ⏭️ Skipped (duplicate)`);
        } else if (result) {
          totalMigrated++;
          console.log(`   ✅ Success (ID: ${result.data.id})`);
        } else {
          totalFailed++;
          console.log(`   ❌ Failed`);
        }
      } catch (error) {
        console.error(`   ❌ Error:`, error.message);
        totalFailed++;
      }
      
      // Pause between posts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    offset += batchSize;
    batchNumber++;
    
    // Check limits
    if (maxPosts && totalMigrated >= maxPosts) {
      console.log(`\n🎯 Reached maximum posts limit (${maxPosts})`);
      break;
    }
    
    // Pause between batches
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Final summary
  console.log(`\n🎉 MIGRATION COMPLETE!`);
  console.log(`   ✅ Migrated: ${totalMigrated}`);
  console.log(`   ⏭️ Skipped: ${totalSkipped}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`\n🔗 Check results: ${STRAPI_URL}/admin`);
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  if (args.includes('--batch-size')) {
    const idx = args.indexOf('--batch-size');
    options.batchSize = parseInt(args[idx + 1]) || BATCH_SIZE;
  }
  if (args.includes('--max-posts')) {
    const idx = args.indexOf('--max-posts');
    options.maxPosts = parseInt(args[idx + 1]) || null;
  }
  
  migrateMCPIntegrated(options).catch(console.error);
}

module.exports = { 
  migrateMCPIntegrated,
  fetchSupabaseBlogPosts,
  fetchSupabaseAudioJobs,
  fetchSupabaseMediaAssets
};
