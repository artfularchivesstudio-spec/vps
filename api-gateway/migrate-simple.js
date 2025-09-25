#!/usr/bin/env node

// 🎭 Simple Supabase to Strapi Migration with Admin JWT
// Using the Content Manager API which works with admin tokens

const fs = require('fs');
const path = require('path');

const STRAPI_URL = 'http://localhost:1337';
const ADMIN_EMAIL = 'mom@api-router.cloud';
const ADMIN_PASSWORD = 'MomAdmin123!';

let adminJWT = null;

/**
 * 🔐 Get admin JWT token with retry logic
 */
async function getAdminToken(retries = 3) {
  console.log('🔐 Getting admin JWT token...');
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${STRAPI_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        })
      });

      if (response.ok) {
        const data = await response.json();
        adminJWT = data.data.token;
        console.log('✅ Admin JWT token obtained');
        return adminJWT;
      } else if (response.status === 429) {
        console.log(`⏳ Rate limited, waiting ${(i + 1) * 5} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 5000));
        continue;
      } else {
        throw new Error(`Failed to get admin token: ${response.status}`);
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`⏳ Retry ${i + 1}/${retries} in 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

/**
 * 🌟 Create a blog post using Content Manager API
 */
async function createBlogPost(postData) {
  const response = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::blog-post.blog-post`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminJWT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

/**
 * 🔮 Transform Supabase post to Strapi format
 */
function transformPost(supabasePost, index) {
  // Truncate excerpt to 300 characters max
  let excerpt = supabasePost.excerpt || '';
  if (excerpt.length > 300) {
    excerpt = excerpt.substring(0, 297) + '...';
  }
  
  return {
    title: supabasePost.title,
    slug: `${supabasePost.slug}-${Date.now()}-${index}`, // Ensure uniqueness
    excerpt: excerpt,
    content: supabasePost.content || '',
    status: 'published',
    aiGenerated: supabasePost.ai_generated || false,
    aiProvider: supabasePost.ai_provider || 'openai',
    publishedAt: supabasePost.created_at || new Date().toISOString()
  };
}

/**
 * 🚀 Main migration function
 */
async function migrate() {
  try {
    console.log('🎭 ✨ STARTING SIMPLE SUPABASE TO STRAPI MIGRATION!');
    
    // Get admin token
    await getAdminToken();
    
    // Load blog posts data
    console.log('📖 Loading blog posts data...');
    const blogPostsPath = path.join(__dirname, 'supabase-export', 'blog-posts.json');
    const blogPosts = JSON.parse(fs.readFileSync(blogPostsPath, 'utf8'));
    
    console.log(`📊 Found ${blogPosts.length} blog posts to migrate`);
    
    // Migrate all remaining posts (skip first 25 already migrated)
    const postsToMigrate = blogPosts.slice(25);
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < postsToMigrate.length; i++) {
      const post = postsToMigrate[i];
      console.log(`\\n🌟 Processing (${i + 1}/${postsToMigrate.length}): ${post.title}`);
      
      try {
        const transformedPost = transformPost(post, i);
        console.log('🔮 Transformed post data:', JSON.stringify(transformedPost, null, 2).substring(0, 200) + '...');
        
        const result = await createBlogPost(transformedPost);
        console.log('✅ Successfully created:', result.data?.attributes?.title || 'Unknown');
        successCount++;
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log('❌ Failed to create post:', error.message);
        errorCount++;
      }
    }
    
    console.log('\\n🎉 ✨ MIGRATION COMPLETE!');
    console.log(`📊 Results: ${successCount} successful, ${errorCount} failed`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrate();
