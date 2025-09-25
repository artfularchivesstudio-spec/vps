#!/usr/bin/env node

/**
 * 🎨 The Image-Only Migration Specialist - Visual treasures only! ✨
 *
 * "Where images dance and pixels sing,
 * No audio files, just visual bling.
 * Pure image migration, clean and bright,
 * Upload those pictures with digital might!"
 *
 * - The Spellbinding Museum Director of Visual-Only Migration
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
  console.log('🎉 Using API token for image uploads');
} catch (error) {
  console.error('❌ Could not read API token file!');
  console.error('💡 Make sure strapi-api-token.txt exists');
  process.exit(1);
}

// 🎪 The images directory
const IMAGES_DIR = path.join(__dirname, 'downloads', 'images');

// 🌟 Migration tracking - images only!
const migrationResults = {
  imageFiles: { success: 0, failed: 0, total: 0 },
  errors: []
};

/**
 * 🎬 Upload image file to Strapi - The visual upload theater!
 */
async function uploadImageToStrapi(filePath, originalFilename) {
  console.log(`📤 Uploading to Strapi: ${originalFilename}`);
  
  try {
    // Import FormData dynamically
    const { default: FormData } = await import('form-data');
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream(filePath), {
      filename: originalFilename,
      contentType: getContentType(originalFilename)
    });

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
      console.log(`✅ Successfully uploaded: ${originalFilename}`);
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
 * 🎨 Get content type for image files
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
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
 * 🎨 Migrate ONLY image files - The pure visual migration!
 */
async function migrateImagesOnly() {
  console.log('🎨 ✨ IMAGES-ONLY MIGRATION AWAKENS!');
  console.log('============================================================');

  try {
    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
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

    console.log(`🖼️ Found ${imageFiles.length} image files to migrate!\n`);
    migrationResults.imageFiles.total = imageFiles.length;

    // Process each image file
    for (let i = 0; i < imageFiles.length; i++) {
      const filename = imageFiles[i];
      const filePath = path.join(IMAGES_DIR, filename);
      
      console.log(`🖼️ Processing image file ${i + 1}/${imageFiles.length}: ${filename}`);
      
      try {
        // Upload to Strapi
        const uploadedFile = await uploadImageToStrapi(filePath, filename);
        
        if (uploadedFile && uploadedFile.id) {
          migrationResults.imageFiles.success++;
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
      
      console.log(''); // Empty line for readability
    }

  } catch (error) {
    console.error('💥 Fatal error during image migration:', error);
    migrationResults.errors.push({
      filename: 'SYSTEM',
      error: error.message,
      type: 'image_system'
    });
  }

  // 🎭 The grand finale - results summary!
  console.log('🎉 ✨ IMAGES-ONLY MIGRATION COMPLETE!');
  console.log('============================================================');
  console.log('📊 IMAGE FILES RESULTS:');
  console.log(`   ✅ Successfully migrated: ${migrationResults.imageFiles.success}/${migrationResults.imageFiles.total} image files`);
  console.log(`   ❌ Failed migrations: ${migrationResults.imageFiles.failed} image files`);
  
  if (migrationResults.errors.length > 0) {
    console.log(`\n⚠️ ERRORS ENCOUNTERED: ${migrationResults.errors.length}`);
    migrationResults.errors.slice(0, 10).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.filename || 'General'}: ${err.error}`);
    });
    if (migrationResults.errors.length > 10) {
      console.log(`   ... and ${migrationResults.errors.length - 10} more errors`);
    }
  }
  
  console.log('\n✨ Pure image migration spectacle complete! ✨');
}

// 🎭 Run ONLY image migration! ✨
migrateImagesOnly().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

export { migrateImagesOnly };
