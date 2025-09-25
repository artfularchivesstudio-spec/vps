#!/usr/bin/env node

/**
 * 🎭 The Image Downloader - The visual treasure collector! ✨
 *
 * "Where pixels dance and colors sing,
 * We gather images on digital wing.
 * From Supabase clouds to local ground,
 * Visual treasures shall be found!"
 *
 * - The Spellbinding Museum Director of Visual Arts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🎭 ES6 module magic to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3BsaWFzZGpwZ3VuYmhzaXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDUwMywiZXhwIjoyMDY3MzUwNTAzfQ.S426_9YxbKZCKFqPu9Q9zlefr7TkfqPuWFjnScQUu50';

const supabase = createClient(supabaseUrl, supabaseKey);

// 🎪 The grand directory for our visual treasures!
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const IMAGES_DIR = path.join(DOWNLOADS_DIR, 'images');

/**
 * 🌟 Ensure download directories exist - The stage preparation!
 */
function ensureDirectories() {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
    console.log('📁 Created downloads directory');
  }
  
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log('🖼️ Created images directory');
  }
}

/**
 * 🎨 Download all images from Supabase storage - The visual harvest!
 */
async function downloadAllImages() {
  console.log('🎨 ✨ IMAGE DOWNLOAD AWAKENS!');
  console.log('============================================================');

  try {
    // List all files in the images bucket
    console.log('🔍 Discovering images in Supabase storage...');
    
    const { data: files, error } = await supabase.storage
      .from('images')
      .list('', { 
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('❌ Error listing images:', error);
      return;
    }

    // Filter out directories and get actual image files
    const imageFiles = files.filter(file => 
      !file.name.endsWith('/') && 
      file.name !== 'uploads' &&
      file.metadata?.size > 0
    );

    console.log(`🎉 Found ${imageFiles.length} image files to download!`);

    let successCount = 0;
    let failureCount = 0;

    // Download each image
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileNumber = i + 1;
      
      console.log(`\n🖼️ Processing image ${fileNumber}/${imageFiles.length}: ${file.name}`);
      
      try {
        // Download the file
        console.log(`📥 Downloading from Supabase: ${file.name}`);
        
        const { data, error: downloadError } = await supabase.storage
          .from('images')
          .download(file.name);

        if (downloadError) {
          console.error(`❌ Download failed: ${downloadError.message}`);
          failureCount++;
          continue;
        }

        // Save to local file
        const localFilePath = path.join(IMAGES_DIR, file.name);
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        fs.writeFileSync(localFilePath, buffer);
        
        console.log(`✅ Successfully downloaded: ${file.name}`);
        console.log(`📊 File size: ${buffer.length} bytes`);
        console.log(`📁 Saved to: ${localFilePath}`);
        
        successCount++;

      } catch (fileError) {
        console.error(`💥 Error processing ${file.name}:`, fileError.message);
        failureCount++;
      }
    }

    console.log('\n🎉 ✨ IMAGE DOWNLOAD COMPLETE!');
    console.log('============================================================');
    console.log(`📊 DOWNLOAD RESULTS:`);
    console.log(`   ✅ Successfully downloaded: ${successCount}/${imageFiles.length} images`);
    console.log(`   ❌ Failed downloads: ${failureCount} images`);
    console.log(`\n📁 Images saved to: ${IMAGES_DIR}`);
    
    if (successCount > 0) {
      console.log('\n🚀 Ready for migration to Strapi! ✨');
    }

  } catch (error) {
    console.error('💥 Fatal error during image download:', error);
  }
}

/**
 * 🎪 Main execution
 */
async function main() {
  ensureDirectories();
  await downloadAllImages();
}

// 🎭 Run the image download magic! ✨
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

export { downloadAllImages };
