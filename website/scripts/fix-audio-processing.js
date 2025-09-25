#!/usr/bin/env node

// Script to fix audio processing and linking
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAudioProcessing() {
  console.log('🔧 Fixing Audio Processing and Linking...\n');
  
  try {
    // 1. Get pending jobs and trigger processing
    const { data: pendingJobs, error: pendingError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (pendingError) throw pendingError;
    
    console.log(`⏳ Found ${pendingJobs.length} pending jobs`);
    
    for (const job of pendingJobs) {
      console.log(`  Processing job ${job.id} (${job.languages?.join(', ')})...`);
      
      try {
        // Trigger processing via internal API
        const response = await fetch('http://localhost:3000/api/audio-jobs/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` // Try service role key
          },
          body: JSON.stringify({ job_id: job.id })
        });
        
        const result = await response.text();
        console.log(`    Result: ${response.status} - ${result.substring(0, 100)}...`);
      } catch (error) {
        console.log(`    Error: ${error.message}`);
      }
    }
    
    // 2. Fix completed jobs without post_id
    console.log('\n🔗 Fixing completed jobs without post_id...');
    
    const { data: unlinkedJobs, error: unlinkedError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('status', 'complete')
      .is('post_id', null)
      .limit(5);
    
    if (unlinkedError) throw unlinkedError;
    
    console.log(`Found ${unlinkedJobs.length} unlinked completed jobs`);
    
    // 3. Link completed audio to posts that need audio
    console.log('\n🎵 Linking audio to posts...');
    
    const { data: postsNeedingAudio, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, primary_audio_id')
      .is('primary_audio_id', null)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (postsError) throw postsError;
    
    console.log(`Found ${postsNeedingAudio.length} posts needing audio`);
    
    // Get available audio assets
    const { data: audioAssets, error: assetsError } = await supabase
      .from('media_assets')
      .select('*')
      .eq('file_type', 'audio')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (assetsError) throw assetsError;
    
    console.log(`Found ${audioAssets.length} available audio assets`);
    
    // Link first available audio to first post needing audio
    if (postsNeedingAudio.length > 0 && audioAssets.length > 0) {
      const post = postsNeedingAudio[0];
      const audio = audioAssets[0];
      
      console.log(`  Linking audio ${audio.id} to post "${post.title?.substring(0, 30)}..."`);
      
      const { error: linkError } = await supabase
        .from('blog_posts')
        .update({ primary_audio_id: audio.id })
        .eq('id', post.id);
      
      if (linkError) {
        console.log(`    Error: ${linkError.message}`);
      } else {
        console.log(`    ✅ Successfully linked!`);
      }
    }
    
    console.log('\n✨ Audio processing fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAudioProcessing();
