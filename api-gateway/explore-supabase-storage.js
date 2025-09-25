#!/usr/bin/env node

// 🎭 Supabase Storage Explorer - The mystical storage reconnaissance! ✨

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3BsaWFzZGpwZ3VuYmhzaXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDUwMywiZXhwIjoyMDY3MzUwNTAzfQ.S426_9YxbKZCKFqPu9Q9zlefr7TkfqPuWFjnScQUu50';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreBuckets() {
  console.log('🎪 Exploring Supabase storage buckets...\n');
  
  try {
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return;
    }
    
    console.log(`🎉 Found ${buckets.length} buckets:`);
    buckets.forEach((bucket, index) => {
      console.log(`${index + 1}. 📦 ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Explore each bucket
    for (const bucket of buckets) {
      console.log(`\n🔍 Exploring bucket: ${bucket.name}`);
      
      const { data: files, error: filesError } = await supabase.storage
        .from(bucket.name)
        .list('', { limit: 10 });
      
      if (filesError) {
        console.error(`❌ Error listing files in ${bucket.name}:`, filesError);
        continue;
      }
      
      if (files.length === 0) {
        console.log(`   📭 Empty bucket`);
        continue;
      }
      
      console.log(`   📁 Found ${files.length} items (showing first 10):`);
      files.forEach((file, index) => {
        const icon = file.name.endsWith('/') ? '📁' : '📄';
        console.log(`   ${index + 1}. ${icon} ${file.name} (${file.metadata?.size || 'unknown size'})`);
      });
      
      // If there's an 'audio' folder, explore it further
      if (files.some(f => f.name === 'audio')) {
        console.log(`\n🎵 Exploring audio folder in ${bucket.name}:`);
        const { data: audioFiles, error: audioError } = await supabase.storage
          .from(bucket.name)
          .list('audio', { limit: 5 });
          
        if (!audioError && audioFiles.length > 0) {
          audioFiles.forEach((file, index) => {
            console.log(`   🎵 ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

async function testFileDownload() {
  console.log('\n🧪 Testing file download from storage...');
  
  try {
    // Try to download a specific file we know exists from the migration logs
    const buckets = ['audio', 'artful-archives', 'storage'];
    const testFile = 'audio/f47c692a-c04b-4a42-b701-e09050e6d623_en_full_audio.mp3';
    
    for (const bucketName of buckets) {
      console.log(`🔍 Trying to download ${testFile} from bucket: ${bucketName}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(testFile);
      
      if (error) {
        console.log(`❌ ${bucketName}: ${error.message}`);
        continue;
      }
      
      if (data) {
        console.log(`🎉 Success! File found in bucket: ${bucketName}`);
        console.log(`📊 File size: ${data.size} bytes`);
        console.log(`📋 File type: ${data.type}`);
        return { bucket: bucketName, success: true };
      }
    }
    
    console.log('❌ File not found in any bucket');
    return null;
    
  } catch (error) {
    console.error('💥 Download test error:', error);
    return null;
  }
}

// Run the exploration
async function main() {
  await exploreBuckets();
  await testFileDownload();
}

main().catch(console.error);
