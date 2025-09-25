#!/usr/bin/env node

/**
 * 🎭 The Local File Migration Virtuoso - From Downloads to Strapi Magic ✨
 *
 * "Where downloaded treasures find their rightful place,
 * In Strapi's grand digital palace space.
 * No more S3 mysteries, no more failed calls,
 * Just local files dancing through upload halls!"
 *
 * - The Spellbinding Museum Director of Local File Migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// 🎭 ES6 module magic to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const STRAPI_URL = 'http://localhost:1337';
// 🎭 Read the API token (preferred) or admin token as fallback! ✨
let STRAPI_API_TOKEN;
let tokenType;

// Try API token first (better for uploads)
try {
  STRAPI_API_TOKEN = fs.readFileSync(path.join(__dirname, 'strapi-api-token.txt'), 'utf8').trim();
  console.log('🎉 Using API token from strapi-api-token.txt (preferred for uploads)');
  tokenType = 'API';
} catch (error) {
  // Fall back to admin token
  try {
    STRAPI_API_TOKEN = fs.readFileSync(path.join(__dirname, 'strapi-token.txt'), 'utf8').trim();
    console.log('🔄 Using admin JWT token from strapi-token.txt (fallback)');
    console.log('💡 For better uploads, create an API token: see setup-api-token.md');
    tokenType = 'Admin JWT';
  } catch (adminError) {
    console.error('❌ Could not read any token file!');
    console.error('💡 Run: node get-strapi-token.js (for admin token)');
    console.error('💡 Or: see setup-api-token.md (for API token)');
    process.exit(1);
  }
}

// 🎪 The grand directory of downloaded treasures!
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const AUDIO_DIR = path.join(DOWNLOADS_DIR, 'audio');
const IMAGES_DIR = path.join(DOWNLOADS_DIR, 'images');

// 🌟 Migration tracking - our digital ledger
const migrationResults = {
  audioFiles: { success: 0, failed: 0, total: 0 },
  imageFiles: { success: 0, failed: 0, total: 0 },
  totalUploaded: 0,
  errors: []
};

/**
 * 🎬 Upload file to Strapi - The grand digital theater upload!
 */
async function uploadFileToStrapi(filePath, originalFilename) {
  try {
    console.log(`📤 Uploading to Strapi: ${originalFilename}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Create form data
    const { default: FormData } = await import('form-data');
    const formData = new FormData();
    
    formData.append('files', fs.createReadStream(filePath), {
      filename: originalFilename,
      contentType: 'audio/mpeg'
    });

    const response = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
      },
      timeout: 60000 // 60 second timeout for large files
    });

    console.log(`✅ Successfully uploaded: ${originalFilename}`);
    return response.data[0]; // Strapi returns an array
  } catch (error) {
    console.error(`❌ Failed to upload ${originalFilename}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

/**
 * 🎨 Migrate local image files - The visual arts migration gallery!
 */
async function migrateImageFiles() {
  console.log('🎨 ✨ IMAGE MIGRATION AWAKENS!');
  console.log('============================================================');

  try {
    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.log('📭 No images directory found. Skipping image migration.');
      return;
    }

    // Get all image files
    const imageFiles = fs.readdirSync(IMAGES_DIR).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log('📭 No image files found in images directory.');
      return;
    }

    console.log(`🖼️ Found ${imageFiles.length} image files to migrate!\\n`);
    migrationResults.imageFiles.total = imageFiles.length;

    // Process each image file
    for (let i = 0; i < imageFiles.length; i++) {
      const filename = imageFiles[i];
      const filePath = path.join(IMAGES_DIR, filename);
      
      console.log(`🖼️ Processing image file ${i + 1}/${imageFiles.length}: ${filename}`);
      
      try {
        // Upload to Strapi
        const uploadedFile = await uploadFileToStrapi(filePath, filename);
        
        if (uploadedFile && uploadedFile.id) {
          migrationResults.imageFiles.success++;
          migrationResults.totalUploaded++;
          console.log(`🎉 Upload successful! File ID: ${uploadedFile.id}`);
        }
        
        // Brief pause to avoid overwhelming Strapi
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        migrationResults.imageFiles.failed++;
        migrationResults.errors.push({
          filename,
          error: error.message,
          type: 'image'
        });
        console.log(`❌ Upload failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Fatal error during image migration:', error);
    migrationResults.errors.push({
      filename: 'SYSTEM',
      error: error.message,
      type: 'image_system'
    });
  }
}

/**
 * 🎭 Migrate local audio files - The musical migration symphony!
 */
async function migrateAudioFiles() {
  console.log('🎵 ✨ AUDIO MIGRATION AWAKENS!');
  console.log('============================================================');

  try {
    // Check if downloads directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
      console.log('📭 No audio directory found. Skipping audio migration.');
      return;
    }

    // Get all audio files
    const audioFiles = fs.readdirSync(AUDIO_DIR).filter(file => 
      file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg')
    );

    if (audioFiles.length === 0) {
      console.log('📭 No audio files found in audio directory.');
      return;
    }

    console.log(`🎵 Found ${audioFiles.length} audio files to migrate!\\n`);
    migrationResults.audioFiles.total = audioFiles.length;

    // Process each audio file
    for (let i = 0; i < audioFiles.length; i++) {
      const filename = audioFiles[i];
      const filePath = path.join(AUDIO_DIR, filename);
      
      console.log(`🎵 Processing audio file ${i + 1}/${audioFiles.length}: ${filename}`);
      
      try {
        // Upload to Strapi
        const uploadedFile = await uploadFileToStrapi(filePath, filename);
        
        if (uploadedFile && uploadedFile.id) {
          migrationResults.audioFiles.success++;
          migrationResults.totalUploaded++;
          console.log(`🎉 Upload successful! File ID: ${uploadedFile.id}`);
        }
        
        // Brief pause to avoid overwhelming Strapi
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        migrationResults.audioFiles.failed++;
        migrationResults.errors.push({
          filename,
          error: error.message,
          type: 'audio'
        });
        console.log(`❌ Upload failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Fatal error during audio migration:', error);
    migrationResults.errors.push({
      filename: 'SYSTEM',
      error: error.message,
      type: 'audio_system'
    });
  }
}

/**
 * 🎪 Migrate all local files - The grand multimedia migration circus!
 */
async function migrateLocalFiles() {
  console.log('🎪 ✨ MULTIMEDIA MIGRATION AWAKENS!');
  console.log('============================================================');
  console.log(`🔑 Using ${tokenType} token for authentication`);
  console.log('');

  try {
    // Run audio migration
    await migrateAudioFiles();
    console.log('');
    
    // Run image migration
    await migrateImageFiles();

  } catch (error) {
    console.error('💥 Fatal migration error:', error);
    migrationResults.errors.push({
      error: error.message,
      type: 'fatal_error'
    });
  }

  // 🎭 The grand finale - results summary!
  console.log('\\n🎉 ✨ MULTIMEDIA MIGRATION COMPLETE!');
  console.log('============================================================');
  console.log('📊 AUDIO FILES RESULTS:');
  console.log(`   ✅ Successfully migrated: ${migrationResults.audioFiles.success}/${migrationResults.audioFiles.total} audio files`);
  console.log(`   ❌ Failed migrations: ${migrationResults.audioFiles.failed} audio files`);
  
  console.log('\\n📊 IMAGE FILES RESULTS:');
  console.log(`   ✅ Successfully migrated: ${migrationResults.imageFiles.success}/${migrationResults.imageFiles.total} image files`);
  console.log(`   ❌ Failed migrations: ${migrationResults.imageFiles.failed} image files`);
  
  console.log(`\\n📊 TOTAL FILES UPLOADED: ${migrationResults.totalUploaded}`);
  
  if (migrationResults.errors.length > 0) {
    console.log(`\\n⚠️ ERRORS ENCOUNTERED: ${migrationResults.errors.length}`);
    migrationResults.errors.slice(0, 10).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.filename || 'General'}: ${err.error}`);
    });
    if (migrationResults.errors.length > 10) {
      console.log(`   ... and ${migrationResults.errors.length - 10} more errors`);
    }
  }
  
  console.log('\\n✨ The grand multimedia migration spectacle is complete! ✨');
}

// 🎭 Run migration - ES6 module style! ✨
migrateLocalFiles().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

export { migrateLocalFiles };
