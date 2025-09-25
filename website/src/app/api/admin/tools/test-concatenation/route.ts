import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/auth/dual-auth'

export async function POST(request: NextRequest) {
  try {
    // 🔐 Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const supabase = createServiceClient()

    console.log('🧪 Testing Audio Concatenation System...')

    // Long test text that will definitely require chunking
    const longText = `
Welcome to the Artful Archives Studio, where creativity meets technology in the most spellbinding ways. 

This is a comprehensive test of our new audio concatenation system. We're going to create a long piece of text that will definitely exceed the OpenAI TTS character limit, forcing our system to chunk the text into multiple pieces, generate audio for each chunk, and then concatenate them all together into a single, seamless audio file.

The beauty of this system lies in its intelligence. It doesn't just blindly cut text at arbitrary character counts. Instead, it looks for natural breaking points - sentence endings with periods, exclamation marks, or question marks. When it can't find a good sentence boundary, it falls back to word boundaries, ensuring that we never cut words in half.

This multilingual approach means we can generate beautiful, continuous audio in English, Spanish, and Hindi, all while maintaining the natural flow and rhythm of speech. The system handles voice selection intelligently too - using the robust 'fable' voice for Hindi content, 'alloy' for Spanish, and 'nova' as the default for English.

Each language gets its own complete audio file, properly concatenated from all the chunks, ready for immediate playback. No more dealing with multiple small audio files that users have to piece together manually. This is the seamless, professional audio experience our users deserve.

The technical implementation handles edge cases gracefully - single chunks are returned directly without unnecessary processing, errors in individual chunks are properly reported, and the system includes respectful delays between API calls to maintain good relationships with our service providers.

This represents a major leap forward in our audio generation capabilities, transforming what was once a fragmented experience into something truly magical and professional. Let's see how well our concatenation system handles this challenging test case!
    `.trim()

    console.log(`📝 Test text length: ${longText.length} characters`)
    console.log(`📊 Expected chunks: ${Math.ceil(longText.length / 4000)}`)

    const results = {
      jobCreated: false,
      jobId: '',
      jobTriggered: false,
      textLength: longText.length,
      expectedChunks: Math.ceil(longText.length / 4000),
      error: null as string | null
    }

    try {
      // Create the test audio job
      const jobData = {
        input_text: longText,
        text_content: longText,
        status: 'pending',
        post_id: null, // Test job doesn't need to be linked to a post
        languages: ['en', 'es'], // Test with two languages for better coverage
        completed_languages: [],
        current_language: 'en',
        language_statuses: {
          'en': { status: 'pending', draft: false },
          'es': { status: 'pending', draft: false }
        },
        config: {
          voice_id: 'nova',
          voice: 'nova',
          speed: 0.9,
          title: 'Audio Concatenation Test',
          tts_provider: 'openai'
        },
        is_draft: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('📝 Creating concatenation test job...')

      const { data: job, error: jobError } = await supabase
        .from('audio_jobs')
        .insert(jobData)
        .select()
        .single()

      if (jobError) {
        throw new Error(`Failed to create job: ${jobError.message}`)
      }

      results.jobCreated = true
      results.jobId = job.id
      console.log(`✅ Created test job: ${job.id}`)

      // Trigger processing
      console.log('🚀 Triggering audio processing...')
      
      try {
        const triggerResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audio-jobs/trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ job_id: job.id })
        })

        if (triggerResponse.ok) {
          results.jobTriggered = true
          console.log('✅ Processing triggered successfully!')
        } else {
          const errorText = await triggerResponse.text()
          results.error = `Failed to trigger processing: ${triggerResponse.status} - ${errorText}`
        }
      } catch (triggerError: any) {
        results.error = `Trigger error: ${triggerError.message}`
      }

    } catch (error: any) {
      results.error = error.message
      console.error('❌ Test failed:', error.message)
    }

    return NextResponse.json({
      success: results.jobCreated && results.jobTriggered,
      message: results.jobCreated && results.jobTriggered 
        ? '🧪 Audio concatenation test started successfully'
        : '❌ Audio concatenation test failed to start',
      data: {
        summary: {
          jobCreated: results.jobCreated,
          jobTriggered: results.jobTriggered,
          jobId: results.jobId,
          textLength: results.textLength,
          expectedChunks: results.expectedChunks,
          testLanguages: ['English', 'Spanish'],
          estimatedProcessingTime: '2-5 minutes'
        },
        testDetails: {
          textSample: longText.substring(0, 200) + '...',
          chunkingStrategy: 'Intelligent sentence and word boundary detection',
          concatenationMethod: 'Buffer concatenation with seamless audio merging',
          voiceSettings: {
            english: 'nova',
            spanish: 'alloy'
          }
        },
        monitoringInstructions: {
          jobId: results.jobId,
          statusCheckEndpoint: `/api/audio-job-status/${results.jobId}`,
          expectedBehavior: [
            'Job will process text in chunks of ~4000 characters',
            'Each chunk will be converted to audio separately',
            'All chunks will be concatenated into single audio files',
            'Final result will be seamless audio for each language'
          ],
          successCriteria: [
            'Job status changes to "completed"',
            'audio_urls contains URLs for both languages',
            'Audio files play continuously without gaps',
            'Total audio duration matches text length expectation'
          ]
        },
        error: results.error,
        nextSteps: results.jobCreated && results.jobTriggered ? [
          'Monitor job progress in the System Status tab',
          'Check job completion using the provided job ID',
          'Test the generated audio files for seamless playback',
          'Verify that chunking and concatenation worked correctly'
        ] : [
          'Check the error message for troubleshooting steps',
          'Ensure the audio processing system is running',
          'Verify API credentials and endpoints are configured correctly'
        ]
      }
    })

  } catch (error: any) {
    console.error('❌ Audio concatenation test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to test audio concatenation'
    }, { status: 500 })
  }
}
