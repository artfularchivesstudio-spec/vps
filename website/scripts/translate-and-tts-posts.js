const { createClient } = require('@supabase/supabase-js');

// Use your Supabase credentials
const supabaseUrl = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Languages to translate to
const LANGUAGES = ['en', 'es', 'hi'];
const LANGUAGE_NAMES = { 'en': 'English', 'es': 'Spanish', 'hi': 'Hindi' };

async function translateAndGenerateTTS() {
  console.log('🚀 Starting translation and TTS generation for last 10 blog posts...\n');

  try {
    // Get the last 10 blog posts
    console.log('📚 Fetching last 10 blog posts...');
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, content, excerpt, status')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching posts:', error);
      return;
    }

    console.log(`✅ Found ${posts.length} posts to process\n`);

    // Process each post
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n🔄 Processing post ${i + 1}/${posts.length}: "${post.title}"`);
      console.log(`📄 Post ID: ${post.id}`);
      console.log(`📊 Status: ${post.status}`);
      
      // Use the excerpt for TTS (shorter and more manageable than full content)
      const textForTTS = post.excerpt || post.content.substring(0, 500) + '...';
      console.log(`📝 Text length: ${textForTTS.length} characters`);

      // Generate audio for all languages
      for (const language of LANGUAGES) {
        console.log(`\n  🌍 Generating ${LANGUAGE_NAMES[language]} audio...`);
        
        try {
          // Create audio job
          const jobData = {
            input_text: textForTTS,
            status: 'pending',
            post_id: post.id,
            languages: [language], // One language at a time for better control
            completed_languages: [],
            current_language: language,
            is_draft: false,
            language_statuses: {
              [language]: {
                status: 'pending',
                draft: false
              }
            },
            config: {
              voice_id: language === 'hi' ? 'fable' : (language === 'es' ? 'alloy' : 'nova'),
              title: `${post.title} - ${LANGUAGE_NAMES[language]}`,
              tts_provider: 'openai'
            }
          };

          console.log(`    🎤 Using voice: ${jobData.config.voice_id}`);

          const { data: job, error: jobError } = await supabase
            .from('audio_jobs')
            .insert(jobData)
            .select()
            .single();

          if (jobError) {
            console.error(`    ❌ Error creating job for ${language}:`, jobError.message);
            continue;
          }

          console.log(`    ✅ Created job ${job.id} for ${LANGUAGE_NAMES[language]}`);

          // Trigger processing
          try {
            const triggerResponse = await fetch('https://artfularchivesstudio.com/api/audio-jobs/trigger', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ job_id: job.id })
            });

            if (triggerResponse.ok) {
              console.log(`    🚀 Processing triggered for ${LANGUAGE_NAMES[language]}`);
            } else {
              console.log(`    ⚠️ Failed to trigger processing for ${LANGUAGE_NAMES[language]}, but job created`);
            }
          } catch (triggerError) {
            console.log(`    ⚠️ Trigger error for ${LANGUAGE_NAMES[language]}:`, triggerError.message);
          }

          // Small delay between jobs to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`    ❌ Error processing ${LANGUAGE_NAMES[language]}:`, error.message);
        }
      }

      console.log(`  ✅ Completed post: "${post.title}"`);
      
      // Delay between posts
      console.log('    ⏳ Waiting 3 seconds before next post...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n🎉 All posts processed! Audio jobs have been created and queued for processing.');
    console.log('\n📊 Summary:');
    console.log(`   • ${posts.length} blog posts processed`);
    console.log(`   • ${posts.length * LANGUAGES.length} audio jobs created`);
    console.log(`   • Languages: ${LANGUAGES.map(l => LANGUAGE_NAMES[l]).join(', ')}`);
    console.log('\n⏰ Audio generation will take several minutes. Check the admin panel for progress.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Helper function to check job status
async function checkJobStatus() {
  console.log('\n🔍 Checking recent audio job status...');
  
  const { data: jobs, error } = await supabase
    .from('audio_jobs')
    .select('id, status, languages, completed_languages, created_at, config')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching jobs:', error);
    return;
  }

  console.log('\n📊 Recent Audio Jobs:');
  jobs.forEach((job, index) => {
    const createdAt = new Date(job.created_at).toLocaleString();
    const title = job.config?.title || 'Untitled';
    console.log(`${index + 1}. ${job.status.toUpperCase()} - ${title}`);
    console.log(`   ID: ${job.id}`);
    console.log(`   Languages: ${job.languages?.join(', ') || 'None'}`);
    console.log(`   Completed: ${job.completed_languages?.join(', ') || 'None'}`);
    console.log(`   Created: ${createdAt}\n`);
  });
}

// Main execution
if (process.argv[2] === 'status') {
  checkJobStatus();
} else {
  translateAndGenerateTTS();
}
