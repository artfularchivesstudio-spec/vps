/**
 * Check Audio Languages Script
 * This script verifies that audio jobs have the correct language data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAudioLanguages() {
  console.log('🎵 Checking audio languages in database...\n');

  try {
    // Get all audio jobs with their language data (not just completed)
    const { data: audioJobs, error } = await supabase
      .from('audio_jobs')
      .select('id, post_id, status, languages, completed_languages, audio_urls')
      .limit(10);

    console.log('🔍 All audio jobs found:');
    audioJobs.forEach((job, index) => {
      console.log(`   Job ${index + 1}: ${job.id.substring(0, 8)}... Status: ${job.status}`);
    });
    console.log('');

    // Now filter for completed jobs
    const completedJobs = audioJobs.filter(job => job.status === 'completed' || job.status === 'complete');

    if (error) {
      console.error('❌ Error fetching audio jobs:', error);
      return;
    }

    console.log(`📊 Found ${completedJobs.length} completed audio jobs (${audioJobs.length} total jobs)\n`);

    completedJobs.forEach((job, index) => {
      console.log(`🎵 Job ${index + 1}: ${job.id.substring(0, 8)}...`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Languages: ${JSON.stringify(job.languages)}`);
      console.log(`   Completed Languages: ${JSON.stringify(job.completed_languages)}`);
      console.log(`   Audio URLs Count: ${job.audio_urls ? Object.keys(job.audio_urls).length : 0}`);

      if (job.audio_urls) {
        console.log(`   Audio URLs: ${Object.keys(job.audio_urls).join(', ')}`);
      }

      const expectedCount = job.completed_languages?.length || 0;
      const actualUrlsCount = job.audio_urls ? Object.keys(job.audio_urls).length : 0;

      if (expectedCount === actualUrlsCount) {
        console.log(`   ✅ Language count matches: ${expectedCount}`);
      } else {
        console.log(`   ⚠️  Mismatch! Expected: ${expectedCount}, Got: ${actualUrlsCount}`);
      }

      console.log('');
    });

    // Summary
    const totalJobs = completedJobs.length;
    const jobsWithCompletedLanguages = completedJobs.filter(job => job.completed_languages?.length > 0).length;
    const jobsWithAudioUrls = completedJobs.filter(job => job.audio_urls && Object.keys(job.audio_urls).length > 0).length;
    const jobsWithMatchingCounts = completedJobs.filter(job => {
      const expected = job.completed_languages?.length || 0;
      const actual = job.audio_urls ? Object.keys(job.audio_urls).length : 0;
      return expected === actual;
    }).length;

    console.log('📈 Summary:');
    console.log(`   Total completed jobs: ${totalJobs}`);
    console.log(`   Jobs with completed_languages: ${jobsWithCompletedLanguages}`);
    console.log(`   Jobs with audio_urls: ${jobsWithAudioUrls}`);
    console.log(`   Jobs with matching counts: ${jobsWithMatchingCounts}`);

    if (jobsWithMatchingCounts === totalJobs) {
      console.log('✅ All jobs have correct language counts!');
    } else {
      console.log('⚠️  Some jobs have mismatched language counts');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test the batch status API
async function testBatchStatusAPI() {
  console.log('\n🔍 Testing batch status API...\n');

  try {
    const postIds = ['005326b8-5c94-4782-9c88-e8632045ddf2', '88eac6be-36ac-4477-9e0e-781af45648a5'];

    const response = await fetch('http://localhost:3000/api/audio-jobs/batch-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_ids: postIds })
    });

    if (!response.ok) {
      console.error('❌ API call failed:', response.status);
      return;
    }

    const data = await response.json();
    console.log('📋 API Response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ API test error:', error);
  }
}

async function main() {
  await checkAudioLanguages();
  await testBatchStatusAPI();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkAudioLanguages, testBatchStatusAPI };
