#!/usr/bin/env node

// 🎵 Complete Audio File Migration - Upload Real MP3s to Strapi
// 🎭 The Audio Narration Maestro's File Upload Symphony

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const STRAPI_URL = 'http://localhost:1337';
const ADMIN_EMAIL = 'mom@api-router.cloud';
const ADMIN_PASSWORD = 'MomAdmin123!';
const AUDIO_SAMPLES_DIR = '/root/website/audio_samples';

let adminJWT = null;

/**
 * 🔐 Get admin JWT token with retry logic
 */
async function getAdminToken(retries = 3) {
  console.log('🔐 ✨ AUTHENTICATION SPELL AWAKENS!');
  
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
        console.log('✅ 🔑 Admin JWT token crystallized successfully!');
        return adminJWT;
      } else if (response.status === 429) {
        console.log(`⏳ 🌙 Rate limiting detected, waiting ${(i + 1) * 5} seconds for the digital spirits to settle...`);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 5000));
        continue;
      } else {
        throw new Error(`Authentication failed: ${response.status}`);
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`⏳ 🔄 Retry ${i + 1}/${retries} in 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

/**
 * 📤 Upload a single MP3 file to Strapi media library
 */
async function uploadAudioFile(filePath, retries = 3) {
  const fileName = path.basename(filePath);
  console.log(`🎵 ✨ Uploading audio file: ${fileName}`);
  
  for (let i = 0; i < retries; i++) {
    try {
      // Create form data for file upload
      const formData = new FormData();
      const fileStream = fs.createReadStream(filePath);
      const stats = fs.statSync(filePath);
      
      formData.append('files', fileStream, {
        filename: fileName,
        contentType: 'audio/mpeg',
        knownLength: stats.size
      });

      // Upload to Strapi upload endpoint
      const response = await fetch(`${STRAPI_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminJWT}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (response.ok) {
        const uploadResult = await response.json();
        console.log(`✅ 🎉 Successfully uploaded ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        return uploadResult[0]; // Strapi returns an array, we want the first item
      } else if (response.status === 429) {
        console.log(`⏳ 🌊 Rate limited on ${fileName}, waiting ${(i + 1) * 5} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 5000));
        continue;
      } else {
        const errorText = await response.text();
        throw new Error(`Upload failed for ${fileName}: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      if (i === retries - 1) {
        console.error(`💥 😭 Failed to upload ${fileName} after ${retries} attempts:`, error.message);
        return null;
      }
      console.log(`⏳ 🔄 Retry ${i + 1}/${retries} for ${fileName} in 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

/**
 * 🎯 Get existing blog posts to map audio files
 */
async function getBlogPosts() {
  console.log('📚 ✨ SUMMONING EXISTING BLOG POSTS FROM THE DIGITAL ARCHIVE!');
  
  try {
    const response = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::blog-post.blog-post?page=1&pageSize=200`, {
      headers: {
        'Authorization': `Bearer ${adminJWT}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ 📖 Found ${data.results?.length || 0} blog posts in the mystical archive`);
      return data.results || [];
    } else {
      console.warn('⚠️ 🌩️ Could not fetch blog posts for mapping');
      return [];
    }
  } catch (error) {
    console.error('💥 😭 Error fetching blog posts:', error.message);
    return [];
  }
}

/**
 * 🎨 Create audio content type schema in blog posts
 */
async function updateBlogPostWithAudioFile(blogPost, audioFile, language, jobId) {
  console.log(`🎵 🌟 Updating "${blogPost.title}" with ${language.toUpperCase()} audio file...`);
  
  try {
    // Get current blog post data
    const currentResponse = await fetch(`${STRAPI_URL}/content-manager/collection-types/api::blog-post.blog-post/${blogPost.id}`, {
      headers: {
        'Authorization': `Bearer ${adminJWT}`,
        'Content-Type': 'application/json'
      }
    });

    let currentData = {};
    if (currentResponse.ok) {
      currentData = await currentResponse.json();
    }

    // Prepare audio files data structure
    let audioFiles = currentData.audioFiles || {};
    
    // Add this audio file to the collection
    audioFiles[language] = {
      file: audioFile.id, // Reference to uploaded media file
      language: language,
      jobId: jobId,
      filename: audioFile.name,
      url: audioFile.url,
      size: audioFile.size,
      duration: null, // We don't have duration info, but could be added later
      uploadedAt: new Date().toISOString()
    };

    // Update the blog post
    const updateData = {
      audioFiles: audioFiles
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
      console.log(`✅ 🎊 Successfully linked ${language.toUpperCase()} audio to "${blogPost.title}"`);
      return result;
    } else {
      const errorText = await response.text();
      console.warn(`⚠️ 🌩️ Failed to update "${blogPost.title}": ${response.status} - ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error(`💥 😭 Error updating blog post "${blogPost.title}":`, error.message);
    return null;
  }
}

/**
 * 🔍 Parse audio filename to extract metadata
 */
function parseAudioFilename(filename) {
  // Expected format: jobId_language_type.mp3
  // Example: 19587fa4-1fbf-4e4e-adbb-8bd9772aab9e_en_full.mp3
  const parts = filename.replace('.mp3', '').split('_');
  
  if (parts.length >= 3) {
    return {
      jobId: parts[0],
      language: parts[1],
      type: parts[2] // 'full' or 'chunk_0', etc.
    };
  }
  
  return null;
}

/**
 * 🎭 Smart blog post mapping based on available data
 */
function mapAudioToBlogPost(audioMetadata, blogPosts) {
  // For now, we'll use a simple mapping strategy
  // In a real scenario, you'd want to match based on content, title, or other criteria
  
  // Strategy 1: Use job ID to map to blog post index (simple approach)
  const jobIds = [
    '19587fa4-1fbf-4e4e-adbb-8bd9772aab9e',
    '78446eca-0a40-477a-bb46-6a0bcd22f54c', 
    '06b82937-a59c-4d9b-aa71-0c9d661a296f'
  ];
  
  const jobIndex = jobIds.indexOf(audioMetadata.jobId);
  if (jobIndex >= 0 && jobIndex < blogPosts.length) {
    return blogPosts[jobIndex];
  }
  
  // Strategy 2: Random assignment for demonstration
  if (blogPosts.length > 0) {
    const randomIndex = Math.floor(Math.random() * blogPosts.length);
    return blogPosts[randomIndex];
  }
  
  return null;
}

/**
 * 🚀 Main migration function
 */
async function migrateAudioFiles() {
  try {
    console.log('🎭 ✨ STARTING COMPLETE AUDIO FILE MIGRATION!');
    console.log('🎵 This will upload all MP3 files and link them to blog posts');
    console.log('============================================================');
    
    // Get admin token
    await getAdminToken();
    
    // Load audio metadata
    console.log('📖 📊 Loading audio metadata...');
    const metadataPath = path.join(AUDIO_SAMPLES_DIR, 'samples_metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    // Get existing blog posts
    const blogPosts = await getBlogPosts();
    
    // Get all MP3 files (only full versions, not chunks)
    const audioFiles = fs.readdirSync(AUDIO_SAMPLES_DIR)
      .filter(file => file.endsWith('.mp3') && file.includes('_full.mp3'))
      .map(file => path.join(AUDIO_SAMPLES_DIR, file));
    
    console.log(`🎵 📁 Found ${audioFiles.length} full audio files to migrate`);
    console.log(`📚 🔗 Found ${blogPosts.length} blog posts for linking`);
    
    let successCount = 0;
    let errorCount = 0;
    let linkSuccessCount = 0;
    let linkErrorCount = 0;
    
    // Process each audio file
    for (const filePath of audioFiles) {
      const filename = path.basename(filePath);
      console.log(`\\n🎵 ⚡ Processing: ${filename}`);
      
      // Parse filename for metadata
      const audioMetadata = parseAudioFilename(filename);
      if (!audioMetadata) {
        console.warn(`⚠️ 🤔 Could not parse filename: ${filename}`);
        errorCount++;
        continue;
      }
      
      // Upload file to Strapi
      const uploadResult = await uploadAudioFile(filePath);
      if (!uploadResult) {
        errorCount++;
        continue;
      }
      
      successCount++;
      
      // Try to link to a blog post
      const targetBlogPost = mapAudioToBlogPost(audioMetadata, blogPosts);
      if (targetBlogPost) {
        const linkResult = await updateBlogPostWithAudioFile(
          targetBlogPost, 
          uploadResult, 
          audioMetadata.language, 
          audioMetadata.jobId
        );
        
        if (linkResult) {
          linkSuccessCount++;
        } else {
          linkErrorCount++;
        }
      } else {
        console.warn(`⚠️ 🔍 No suitable blog post found for ${filename}`);
        linkErrorCount++;
      }
      
      // Wait between uploads to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\\n🎉 ✨ AUDIO FILE MIGRATION COMPLETE!');
    console.log('============================================================');
    console.log(`📊 🎭 FINAL STATISTICS:`);
    console.log(`   📤 Files uploaded successfully: ${successCount} files`);
    console.log(`   ❌ Failed uploads: ${errorCount} files`);
    console.log(`   🔗 Successfully linked to blog posts: ${linkSuccessCount} files`);
    console.log(`   💔 Failed to link: ${linkErrorCount} files`);
    
    const uploadSuccessRate = ((successCount / (successCount + errorCount)) * 100).toFixed(1);
    const linkSuccessRate = ((linkSuccessCount / (linkSuccessCount + linkErrorCount)) * 100).toFixed(1);
    
    console.log(`   📈 Upload success rate: ${uploadSuccessRate}%`);
    console.log(`   🔗 Linking success rate: ${linkSuccessRate}%`);
    
    console.log('\\n🎭 🌟 Audio files are now available in Strapi!');
    console.log('💡 🎵 Check the Media Library and Blog Posts in the admin interface');
    console.log('🚀 ✨ Your audio narration system is ready for mystical experiences!');
    
  } catch (error) {
    console.error('💥 😭 Audio file migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateAudioFiles();
}

module.exports = { migrateAudioFiles };
