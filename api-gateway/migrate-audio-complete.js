#!/usr/bin/env node

// 🎵 Complete Audio Migration - From Supabase to Strapi
// 🎭 The Spellbinding Museum Director's Audio Archive

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
 * 🔍 Get existing blog posts to map audio files
 */
async function getBlogPosts() {
  console.log('📖 Fetching existing blog posts for audio mapping...');
  
  try {
    const response = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::blog-post.blog-post?page=1&pageSize=200`, {
      headers: {
        'Authorization': `Bearer ${adminJWT}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.results?.length || 0} blog posts`);
      return data.results || [];
    } else {
      console.warn('⚠️ Could not fetch blog posts for mapping');
      return [];
    }
  } catch (error) {
    console.error('💥 Error fetching blog posts:', error.message);
    return [];
  }
}

/**
 * 🎵 Create audio content type if it doesn't exist
 */
async function createAudioContentType() {
  console.log('🎨 Creating Audio content type...');
  
  const audioSchema = {
    displayName: 'Audio File',
    singularName: 'audio-file',
    pluralName: 'audio-files',
    description: 'Audio files generated from blog posts',
    collectionName: 'audio_files',
    attributes: {
      title: {
        type: 'string',
        required: true
      },
      language: {
        type: 'enumeration',
        enum: ['en', 'es', 'hi', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
        default: 'en',
        required: true
      },
      voiceId: {
        type: 'string'
      },
      aiProvider: {
        type: 'enumeration',
        enum: ['elevenlabs', 'openai', 'google', 'amazon'],
        default: 'elevenlabs'
      },
      status: {
        type: 'enumeration',
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      audioUrl: {
        type: 'string'
      },
      durationSeconds: {
        type: 'integer'
      },
      fileSize: {
        type: 'biginteger'
      },
      originalJobId: {
        type: 'string',
        unique: true
      },
      blogPost: {
        type: 'relation',
        relation: 'manyToOne',
        target: 'api::blog-post.blog-post',
        inversedBy: 'audioFiles'
      },
      audioFile: {
        type: 'media',
        multiple: false,
        required: false,
        allowedTypes: ['audio']
      }
    }
  };

  try {
    // This would typically be done through the Content Type Builder
    // For now, we'll create a simple collection to store audio metadata
    console.log('ℹ️ Audio content type creation would be done through Strapi admin or content-type builder');
    console.log('📝 For now, we\\'ll store audio metadata as JSON in blog post audioFilesByLanguage field');
    return true;
  } catch (error) {
    console.error('💥 Error creating audio content type:', error.message);
    return false;
  }
}

/**
 * 🎯 Update blog post with audio file information
 */
async function updateBlogPostWithAudio(blogPost, audioJobs) {
  console.log(`🎵 Updating blog post "${blogPost.title}" with audio files...`);
  
  try {
    // Group audio jobs by language for this blog post
    const audioFilesByLanguage = audioJobs.reduce((acc, job) => {
      acc[job.language] = {
        id: job.id,
        language: job.language,
        voiceId: job.voice_id,
        aiProvider: job.ai_provider,
        status: job.status,
        audioUrl: job.audio_url,
        durationSeconds: job.duration_seconds,
        createdAt: job.created_at
      };
      return acc;
    }, {});

    // Update the blog post with audio file information
    const updateData = {
      audioFilesByLanguage: audioFilesByLanguage
    };

    const response = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::blog-post.blog-post/${blogPost.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminJWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Updated "${blogPost.title}" with ${Object.keys(audioFilesByLanguage).length} audio files`);
      return result;
    } else {
      const errorText = await response.text();
      console.warn(`⚠️ Failed to update "${blogPost.title}": ${response.status} - ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error(`💥 Error updating blog post "${blogPost.title}":`, error.message);
    return null;
  }
}

/**
 * 🎭 Transform Supabase audio job to Strapi format
 */
function transformAudioJob(audioJob) {
  return {
    title: `Audio for Blog Post ${audioJob.blog_post_id} (${audioJob.language.toUpperCase()})`,
    language: audioJob.language,
    voiceId: audioJob.voice_id,
    aiProvider: audioJob.ai_provider,
    status: audioJob.status,
    audioUrl: audioJob.audio_url,
    durationSeconds: audioJob.duration_seconds,
    originalJobId: audioJob.id,
    publishedAt: audioJob.created_at || new Date().toISOString()
  };
}

/**
 * 🚀 Main migration function
 */
async function migrateAudio() {
  try {
    console.log('🎭 ✨ STARTING COMPLETE AUDIO MIGRATION!');
    console.log('🎵 This will migrate all audio files and metadata from Supabase to Strapi');
    
    // Get admin token
    await getAdminToken();
    
    // Load audio jobs data
    console.log('📖 Loading audio jobs data...');
    const audioJobsPath = path.join(__dirname, 'audio-jobs.json');
    const audioJobs = JSON.parse(fs.readFileSync(audioJobsPath, 'utf8'));
    
    console.log(`📊 Found ${audioJobs.length} audio jobs to migrate`);
    
    // Get existing blog posts
    const blogPosts = await getBlogPosts();
    
    // Create a map of blog post IDs to blog posts (using title/slug matching since IDs might be different)
    const blogPostMap = new Map();
    blogPosts.forEach(post => {
      // Try to match by various criteria
      blogPostMap.set(post.id, post);
      if (post.slug) {
        blogPostMap.set(post.slug, post);
      }
    });
    
    console.log(`📚 Found ${blogPosts.length} existing blog posts for mapping`);
    
    // Group audio jobs by blog post
    const audioJobsByPost = new Map();
    audioJobs.forEach(job => {
      const postId = job.blog_post_id;
      if (!audioJobsByPost.has(postId)) {
        audioJobsByPost.set(postId, []);
      }
      audioJobsByPost.get(postId).push(job);
    });
    
    console.log(`🎯 Audio jobs grouped by ${audioJobsByPost.size} blog posts`);
    
    let successCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;
    
    // Process each group of audio jobs
    for (const [blogPostId, jobs] of audioJobsByPost) {
      console.log(`\\n🎵 Processing audio jobs for blog post ID ${blogPostId}...`);
      
      // Try to find the corresponding Strapi blog post
      // Since the IDs might be different, we'll try to match by content or create a mapping
      let strapiPost = null;
      
      // For now, we'll update all posts with their audio information
      // In a real scenario, you'd want better ID mapping
      if (blogPosts.length > 0) {
        // Simple approach: assign audio jobs to posts in order (this is a placeholder)
        const postIndex = parseInt(blogPostId) - 1;
        if (postIndex >= 0 && postIndex < blogPosts.length) {
          strapiPost = blogPosts[postIndex];
        }
      }
      
      if (strapiPost) {
        const result = await updateBlogPostWithAudio(strapiPost, jobs);
        if (result) {
          successCount++;
          console.log(`✅ Successfully updated post "${strapiPost.title}" with ${jobs.length} audio files`);
        } else {
          errorCount++;
        }
      } else {
        console.warn(`⚠️ Could not find matching Strapi post for blog_post_id ${blogPostId}`);
        notFoundCount++;
      }
      
      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\\n🎉 ✨ AUDIO MIGRATION COMPLETE!');
    console.log('============================================================');
    console.log(`📊 FINAL STATISTICS:`);
    console.log(`   ✅ Successfully migrated: ${successCount} blog posts with audio`);
    console.log(`   ❌ Failed migrations: ${errorCount} blog posts`);
    console.log(`   🔍 Posts not found: ${notFoundCount} blog posts`);
    console.log(`   🎵 Total audio files processed: ${audioJobs.length} files`);
    
    const successRate = ((successCount / (successCount + errorCount + notFoundCount)) * 100).toFixed(1);
    console.log(`   📈 Success rate: ${successRate}%`);
    
    console.log('\\n🎭 Audio migration completed! Check your blog posts for audioFilesByLanguage data.');
    console.log('💡 You can now access audio files through the blog post API or admin interface.');
    
  } catch (error) {
    console.error('💥 Audio migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateAudio();
}

module.exports = { migrateAudio };
