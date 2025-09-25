const { createClient } = require('@supabase/supabase-js');

// Test the new audio concatenation system
async function testAudioConcatenation() {
  console.log('🧪 Testing Audio Concatenation System\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Create a test audio job with long text that will require chunking
    const longText = `
Welcome to the Artful Archives Studio, where creativity meets technology in the most spellbinding ways. 

This is a comprehensive test of our new audio concatenation system. We're going to create a long piece of text that will definitely exceed the OpenAI TTS character limit, forcing our system to chunk the text into multiple pieces, generate audio for each chunk, and then concatenate them all together into a single, seamless audio file.

The beauty of this system lies in its intelligence. It doesn't just blindly cut text at arbitrary character counts. Instead, it looks for natural breaking points - sentence endings with periods, exclamation marks, or question marks. When it can't find a good sentence boundary, it falls back to word boundaries, ensuring that we never cut words in half.

This multilingual approach means we can generate beautiful, continuous audio in English, Spanish, and Hindi, all while maintaining the natural flow and rhythm of speech. The system handles voice selection intelligently too - using the robust 'fable' voice for Hindi content, 'alloy' for Spanish, and 'nova' as the default for English.

Each language gets its own complete audio file, properly concatenated from all the chunks, ready for immediate playback. No more dealing with multiple small audio files that users have to piece together manually. This is the seamless, professional audio experience our users deserve.

The technical implementation handles edge cases gracefully - single chunks are returned directly without unnecessary processing, errors in individual chunks are properly reported, and the system includes respectful delays between API calls to maintain good relationships with our service providers.

This represents a major leap forward in our audio generation capabilities, transforming what was once a fragmented experience into something truly magical and professional.
    `.trim();

    console.log('📝 Creating test audio job...');
    console.log(`📊 Text length: ${longText.length} characters`);
    console.log(`📊 Expected chunks: ${Math.ceil(longText.length / 4000)}\n`);

    // Create the audio job
    const { data: job, error: jobError } = await supabase
      .from('audio_jobs')
      .insert({
        input_text: longText,
        text_content: longText,
        status: 'pending',
        languages: ['en', 'es'], // Test with two languages
        completed_languages: [],
        language_statuses: {
          'en': { status: 'pending', draft: false },
          'es': { status: 'pending', draft: false }
        },
        config: {
          voice_id: 'nova',
          speed: 0.9,
          title: 'Audio Concatenation Test'
        },
        is_draft: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    console.log(`✅ Created test job: ${job.id}`);

    // Trigger processing
    console.log('🚀 Triggering audio processing...\n');
    
    const triggerResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://artfularchivesstudio.com'}/api/audio-jobs/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ job_id: job.id })
    });

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text();
      console.error(`❌ Failed to trigger processing: ${triggerResponse.status} - ${errorText}`);
    } else {
      const result = await triggerResponse.json();
      console.log('✅ Processing triggered successfully!');
      console.log('📊 Result:', JSON.stringify(result, null, 2));
    }

    // Monitor job progress
    console.log('\n🔍 Monitoring job progress...');
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;

      const { data: currentJob, error: fetchError } = await supabase
        .from('audio_jobs')
        .select('*')
        .eq('id', job.id)
        .single();

      if (fetchError) {
        console.error(`❌ Error fetching job: ${fetchError.message}`);
        break;
      }

      console.log(`\n📊 Attempt ${attempts}: Job Status: ${currentJob.status}`);
      console.log(`📊 Completed Languages: ${JSON.stringify(currentJob.completed_languages)}`);
      
      if (currentJob.audio_urls) {
        console.log(`📊 Audio URLs:`, currentJob.audio_urls);
      }

      if (currentJob.status === 'completed') {
        console.log('\n🎉 SUCCESS! Audio generation completed!');
        console.log('✅ Final Results:');
        console.log(`   - Status: ${currentJob.status}`);
        console.log(`   - Languages: ${currentJob.completed_languages.join(', ')}`);
        console.log(`   - Audio URLs:`, currentJob.audio_urls);
        
        // Test the audio URLs
        for (const [lang, url] of Object.entries(currentJob.audio_urls)) {
          console.log(`\n🔗 Testing ${lang.toUpperCase()} audio URL: ${url}`);
          try {
            const audioResponse = await fetch(url);
            if (audioResponse.ok) {
              const contentLength = audioResponse.headers.get('content-length');
              console.log(`   ✅ ${lang.toUpperCase()} audio accessible (${contentLength} bytes)`);
            } else {
              console.log(`   ❌ ${lang.toUpperCase()} audio not accessible: ${audioResponse.status}`);
            }
          } catch (error) {
            console.log(`   ❌ ${lang.toUpperCase()} audio test failed: ${error.message}`);
          }
        }
        break;
      } else if (currentJob.status === 'failed') {
        console.log(`\n❌ Job failed: ${currentJob.error_message || 'Unknown error'}`);
        break;
      } else {
        console.log('   ⏳ Still processing...');
      }
    }

    if (attempts >= maxAttempts) {
      console.log('\n⏰ Timeout reached. Job may still be processing...');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Load environment variables
require('dotenv').config();

testAudioConcatenation();
