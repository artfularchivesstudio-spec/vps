/**
 * @file Script to process all pending audio jobs by triggering the worker multiple times
 */

const https = require('https');
const fs = require('fs');

// Read environment variables
const envVars = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const anonKey = envVars.SUPABASE_ANON_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🎵 Processing all pending audio jobs...\n');

function triggerWorker() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'tjkpliasdjpgunbhsiza.supabase.co',
      path: '/functions/v1/audio-job-worker-chunked',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function processAllJobs() {
  let processedCount = 0;
  let consecutiveEmpty = 0;
  const maxEmpty = 3; // Stop after 3 consecutive "no jobs" responses

  console.log('🚀 Starting batch processing of audio jobs...\n');

  while (consecutiveEmpty < maxEmpty) {
    try {
      console.log(`🔄 Triggering worker (attempt ${processedCount + 1})...`);

      const response = await triggerWorker();

      if (response.message === 'No pending or processing jobs found.') {
        consecutiveEmpty++;
        console.log(`📭 No jobs found (${consecutiveEmpty}/${maxEmpty})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      } else {
        consecutiveEmpty = 0;
        processedCount++;

        if (response.job) {
          console.log(`✅ Processed job: ${response.job.id}`);
          console.log(`   📊 Status: ${response.job.status}`);
          console.log(`   🌍 Languages: ${response.job.completed_languages?.join(', ') || 'none'}`);
          console.log(`   🎵 Audio URLs: ${Object.keys(response.job.audio_urls || {}).length}`);
        } else {
          console.log(`✅ Processed: ${JSON.stringify(response, null, 2)}`);
        }

        console.log('');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between jobs
      }

    } catch (error) {
      console.error(`❌ Error processing job:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds on error
    }
  }

  console.log(`\n🎉 Processing complete!`);
  console.log(`📊 Jobs processed: ${processedCount}`);
  console.log(`🎯 Check final status to see results!`);
}

// Run the processing
processAllJobs().catch(console.error);
