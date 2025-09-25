#!/usr/bin/env node

/**
 * 🎭 The Organized Migration Master - Clean folder structure! ✨
 *
 * "Where audio finds its rightful audio/ home,
 * And images in images/ freely roam.
 * No more chaos, no more mess,
 * Organized uploads bring success!"
 *
 * - The Spellbinding Museum Director of Organized Migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// 🎭 ES6 module magic to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const STRAPI_URL = 'http://localhost:1337';

// 🎭 Read the API token! ✨
let STRAPI_API_TOKEN;
try {
  STRAPI_API_TOKEN = fs.readFileSync(path.join(__dirname, 'strapi-api-token.txt'), 'utf8').trim();
  console.log('🎉 Using API token for organized uploads');
} catch (error) {
  console.error('❌ Could not read API token file!');
  console.error('💡 Make sure strapi-api-token.txt exists');
  process.exit(1);
}

// 🎪 The directories
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const AUDIO_DIR = path.join(DOWNLOADS_DIR, 'audio');
const IMAGES_DIR = path.join(DOWNLOADS_DIR, 'images');

// 🌟 Migration tracking
const migrationResults = {
  audioFiles: { success: 0, failed: 0, total: 0 },
  imageFiles: { success: 0, failed: 0, total: 0 },
  errors: []
};

/**
 * 🎬 Upload file to Strapi with folder organization
 */
async function uploadFileToStrapi(filePath, originalFilename, folder) {
  console.log(`📤 Uploading to Strapi ${folder}/: ${originalFilename}`);
  
  try {
    // Import FormData dynamically
    const { default: FormData } = await import('form-data');
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream(filePath), {
      filename: originalFilename,
      contentType: getContentType(originalFilename)
    });
    
    // Add folder path to organize files
    formData.append('path', folder);

    const response = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    });

    if (response.data && response.data[0]) {
      console.log(`✅ Successfully uploaded to ${folder}/: ${originalFilename}`);
      return response.data[0];
    } else {
      throw new Error('No file data returned from Strapi');
    }

  } catch (error) {
    console.error(`❌ Upload failed: ${error.message}`);
    throw error;
  }
}

/**
 * 🎨 Get content type for files
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    // Audio types
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    // Image types
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', 
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 🎵 Migrate audio files to audio/ folder
 */
async function migrateAudioFiles() {
  console.log('🎵 ✨ AUDIO MIGRATION TO audio/ FOLDER!');
  console.log('============================================================');

  if (!fs.existsSync(AUDIO_DIR)) {
    console.log('📭 No audio directory found. Skipping audio migration.');
    return;
  }

  const audioFiles = fs.readdirSync(AUDIO_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp3', '.wav', '.ogg'].includes(ext);
  });

  if (audioFiles.length === 0) {
    console.log('📭 No audio files found.');
    return;
  }

  console.log(`🎵 Found ${audioFiles.length} audio files to upload to audio/ folder!\n`);
  migrationResults.audioFiles.total = audioFiles.length;

  for (let i = 0; i < audioFiles.length; i++) {
    const filename = audioFiles[i];
    const filePath = path.join(AUDIO_DIR, filename);
    
    console.log(`🎵 Processing audio file ${i + 1}/${audioFiles.length}: ${filename}`);
    
    try {
      const uploadedFile = await uploadFileToStrapi(filePath, filename, 'audio');
      
      if (uploadedFile && uploadedFile.id) {
        migrationResults.audioFiles.success++;
        console.log(`🎉 Upload successful! File ID: ${uploadedFile.id}`);
      }
      
      // Brief pause
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      migrationResults.audioFiles.failed++;
      migrationResults.errors.push({
        filename,
        error: error.message,
        type: 'audio',
        folder: 'audio/'
      });
      console.log(`❌ Upload failed: ${error.message}`);
    }
    
    console.log('');
  }
}

/**
 * 🎨 Migrate image files to images/ folder
 */
async function migrateImageFiles() {
  console.log('🎨 ✨ IMAGE MIGRATION TO images/ FOLDER!');
  console.log('============================================================');

  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('📭 No images directory found. Skipping image migration.');
    return;
  }

  const imageFiles = fs.readdirSync(IMAGES_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext);
  });

  if (imageFiles.length === 0) {
    console.log('📭 No image files found.');
    return;
  }

  console.log(`🖼️ Found ${imageFiles.length} image files to upload to images/ folder!\n`);
  migrationResults.imageFiles.total = imageFiles.length;

  for (let i = 0; i < imageFiles.length; i++) {
    const filename = imageFiles[i];
    const filePath = path.join(IMAGES_DIR, filename);
    
    console.log(`🖼️ Processing image file ${i + 1}/${imageFiles.length}: ${filename}`);
    
    try {
      const uploadedFile = await uploadFileToStrapi(filePath, filename, 'images');
      
      if (uploadedFile && uploadedFile.id) {
        migrationResults.imageFiles.success++;
        console.log(`🎉 Upload successful! File ID: ${uploadedFile.id}`);
      }
      
      // Brief pause
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      migrationResults.imageFiles.failed++;
      migrationResults.errors.push({
        filename,
        error: error.message,
        type: 'image',
        folder: 'images/'
      });
      console.log(`❌ Upload failed: ${error.message}`);
    }
    
    console.log('');
  }
}

/**
 * 🎪 Main organized migration function
 */
async function migrateOrganized() {
  console.log('🎪 ✨ ORGANIZED MIGRATION AWAKENS!');
  console.log('============================================================');
  console.log('📁 Audio files → audio/ folder');
  console.log('🖼️ Image files → images/ folder');
  console.log('============================================================\n');

  try {
    // Migrate audio files to audio/ folder
    await migrateAudioFiles();
    
    // Migrate image files to images/ folder  
    await migrateImageFiles();

  } catch (error) {
    console.error('💥 Fatal migration error:', error);
    migrationResults.errors.push({
      error: error.message,
      type: 'fatal_error'
    });
  }

  // 🎭 The grand finale - results summary!
  console.log('🎉 ✨ ORGANIZED MIGRATION COMPLETE!');
  console.log('============================================================');
  
  console.log('📊 AUDIO FILES (→ audio/ folder):');
  console.log(`   ✅ Successfully uploaded: ${migrationResults.audioFiles.success}/${migrationResults.audioFiles.total} audio files`);
  console.log(`   ❌ Failed uploads: ${migrationResults.audioFiles.failed} audio files`);
  
  console.log('\n📊 IMAGE FILES (→ images/ folder):');
  console.log(`   ✅ Successfully uploaded: ${migrationResults.imageFiles.success}/${migrationResults.imageFiles.total} image files`);
  console.log(`   ❌ Failed uploads: ${migrationResults.imageFiles.failed} image files`);
  
  const totalUploaded = migrationResults.audioFiles.success + migrationResults.imageFiles.success;
  console.log(`\n📊 TOTAL FILES UPLOADED: ${totalUploaded}`);
  
  if (migrationResults.errors.length > 0) {
    console.log(`\n⚠️ ERRORS ENCOUNTERED: ${migrationResults.errors.length}`);
    migrationResults.errors.slice(0, 5).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.folder || ''}${err.filename || 'General'}: ${err.error}`);
    });
    if (migrationResults.errors.length > 5) {
      console.log(`   ... and ${migrationResults.errors.length - 5} more errors`);
    }
  }
  
  console.log('\n✨ Clean, organized migration complete! Everything in its proper place! ✨');
}

// 🎭 Run organized migration! ✨
migrateOrganized().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

export { migrateOrganized };
