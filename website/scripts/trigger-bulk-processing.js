const { createClient } = require('@supabase/supabase-js');

// Use your Supabase credentials
const supabaseUrl = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function triggerBulkProcessing() {
  console.log('🚀 Triggering processing for pending audio jobs...\n');

  try {
    // Get all pending audio jobs from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: jobs, error } = await supabase
      .from('audio_jobs')
      .select('id, languages, status, config, created_at')
      .eq('status', 'pending')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return;
    }

    console.log(`✅ Found ${jobs.length} pending jobs to process\n`);

    if (jobs.length === 0) {
      console.log('ℹ️ No pending jobs found. All jobs may already be processing or completed.');
      return;
    }

    // Process jobs using the Supabase Edge Function
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const createdAt = new Date(job.created_at).toLocaleString();
      const title = job.config?.title || 'Untitled';
      const language = job.languages?.[0] || 'unknown';
      
      console.log(`🔄 Processing job ${i + 1}/${jobs.length}: ${title} (${language})`);
      console.log(`   Job ID: ${job.id}`);
      console.log(`   Created: ${createdAt}`);

      try {
        // Trigger processing via Supabase Edge Function
        const response = await fetch(`${supabaseUrl}/functions/v1/audio-job-worker-chunked`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            job_id: job.id
          })
        });

        if (response.ok) {
          console.log(`   ✅ Processing triggered successfully`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Failed to trigger processing: ${response.status} - ${errorText}`);
          failCount++;
        }

      } catch (error) {
        console.log(`   ❌ Error triggering job: ${error.message}`);
        failCount++;
      }

      // Small delay between jobs
      if (i < jobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n🎉 Bulk processing trigger completed!');
    console.log(`📊 Results:`);
    console.log(`   ✅ Successfully triggered: ${successCount}`);
    console.log(`   ❌ Failed to trigger: ${failCount}`);
    console.log(`   📝 Total jobs: ${jobs.length}`);

    if (successCount > 0) {
      console.log('\n⏰ Audio generation is now running in the background.');
      console.log('🔍 Use "node translate-and-tts-posts.js status" to check progress.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

triggerBulkProcessing();
