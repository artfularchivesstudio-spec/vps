// 🌟 Live Supabase to Strapi Migration - Direct MCP Integration ✨
// 🎭 The Spellbinding Museum Director's Real-Time Migration Magic

// Using built-in fetch (Node.js 18+)

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.STRAPI_ADMIN_API_TOKEN;
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const BATCH_SIZE = 5; // Smaller batches for stability

const CONFIG = {
  STRAPI_URL,
  API_TOKEN: STRAPI_API_TOKEN,
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

if (CONFIG.API_TOKEN && CONFIG.API_TOKEN !== 'your-api-token-here') {
  CONFIG.HEADERS.Authorization = `Bearer ${CONFIG.API_TOKEN}`;
}

/**
 * 🌟 Transform Supabase post to Strapi format
 */
function transformSupabasePost(post) {
  console.log(`🔮 Transforming: ${post.title?.substring(0, 50)}...`);
  
  const content = post.content || post.ai_analysis_claude || post.ai_analysis_openai || '';
  const title = post.title || 'Untitled';
  const slug = post.slug || generateSlug(title);
  const excerpt = post.excerpt || extractExcerpt(content);
  
  return {
    data: {
      title: title,
      slug: slug,
      excerpt: excerpt,
      content: content,
      status: 'draft',
      aiGenerated: post.origin_source === 'ai' || !!post.selected_ai_provider,
      aiProvider: post.selected_ai_provider === 'claude' ? 'anthropic' : (post.selected_ai_provider || 'anthropic'),
      aiPrompt: 'Migrated from Supabase with AI analysis',
      publishedAt: post.published_at,
      
      // SEO with length limits
      seo: {
        metaTitle: (post.seo_title || title).substring(0, 60),
        metaDescription: (post.seo_description || excerpt).substring(0, 160),
        keywords: extractKeywords(content)
      }
    }
  };
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

function extractExcerpt(content) {
  if (!content) return '';
  const clean = content.replace(/[#*]/g, '').trim();
  return clean.substring(0, 300) + (clean.length > 300 ? '...' : '');
}

function extractKeywords(content) {
  const keywords = [];
  if (content.toLowerCase().includes('art')) keywords.push('Art');
  if (content.toLowerCase().includes('analysis')) keywords.push('Analysis');
  if (content.toLowerCase().includes('visual')) keywords.push('Visual Arts');
  return keywords.join(', ');
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
      console.error(`❌ Strapi error ${response.status}:`, errorText);
      return null;
    }
    
    const result = await response.json();
    console.log(`✅ Created: ${result.data.title}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to create entry:`, error.message);
    return null;
  }
}

/**
 * 🎭 Main migration function
 */
async function migrateLiveData() {
  console.log('🌟 Starting live Supabase to Strapi migration...');
  console.log(`🔗 Target: ${STRAPI_URL}`);
  
  // Sample data structure based on what we saw in MCP
  const samplePosts = [
    {
      id: '005326b8-5c94-4782-9c88-e8632045ddf2',
      title: 'Embracing Eternity: An Exploration of Timeless Connection',
      slug: 'embracing-eternity-exploration-timeless-connection',
      content: 'Ancient Intimacy: A Remarkable Folk Art Discovery. In this compelling piece of folk art, we encounter a fascinating wooden sculpture that speaks volumes about human connection and artistic expression in vernacular traditions...',
      featured_image_url: 'https://tjkpliasdjpgunbhsiza.supabase.co/storage/v1/object/public/images/1752845743061.jpeg',
      status: 'draft',
      origin_source: 'manual',
      selected_ai_provider: 'claude',
      ai_analysis_claude: 'Ancient Intimacy: A Remarkable Folk Art Discovery...',
      created_at: '2025-07-18T13:36:23.505852+00:00'
    },
    {
      id: '88eac6be-36ac-4477-9e0e-781af45648a5',
      title: 'Art Analysis',
      slug: 'art-analysis2',
      content: 'Autumn Reflections: A Study in Natural Symmetry. In this captivating photograph, nature presents us with a masterclass in composition and symmetry...',
      featured_image_url: 'https://tjkpliasdjpgunbhsiza.supabase.co/storage/v1/object/public/images/1751929458743.jpeg',
      status: 'draft',
      origin_source: 'manual',
      selected_ai_provider: 'claude',
      ai_analysis_claude: 'Autumn Reflections: A Study in Natural Symmetry...',
      created_at: '2025-07-07T23:05:05.154913+00:00'
    }
  ];
  
  let successCount = 0;
  let failureCount = 0;
  
  console.log(`🚀 Processing ${samplePosts.length} sample posts...`);
  
  for (let i = 0; i < samplePosts.length; i++) {
    const post = samplePosts[i];
    console.log(`\n📝 Processing ${i + 1}/${samplePosts.length}: ${post.title}`);
    
    try {
      const transformedData = transformSupabasePost(post);
      const result = await createStrapiEntry(transformedData);
      
      if (result) {
        successCount++;
      } else {
        failureCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${post.id}:`, error.message);
      failureCount++;
    }
    
    // Pause between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎉 Migration Summary:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  
  if (successCount > 0) {
    console.log(`\n🌟 Check your results:`);
    console.log(`🔗 Admin: ${STRAPI_URL}/admin`);
    console.log(`🔗 API: ${STRAPI_URL}/api/blog-posts`);
  }
}

// Run if executed directly
if (require.main === module) {
  migrateLiveData().catch(console.error);
}

module.exports = { migrateLiveData };
