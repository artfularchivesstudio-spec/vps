import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/auth/dual-auth'

interface TestConfig {
  testText: string
  languages: string[]
  voice: string
}

const LANGUAGE_NAMES = { 'en': 'English', 'es': 'Spanish', 'hi': 'Hindi' }

export async function POST(request: NextRequest) {
  try {
    // 🔐 Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const config: TestConfig = await request.json()
    const supabase = createServiceClient()

    console.log('🧪 Starting Audio System Test...')
    console.log(`📝 Test text: ${config.testText.substring(0, 100)}...`)
    console.log(`🌍 Languages: ${config.languages.map(l => LANGUAGE_NAMES[l as keyof typeof LANGUAGE_NAMES]).join(', ')}`)
    console.log(`🎤 Voice: ${config.voice}`)

    const results = {
      jobsCreated: 0,
      jobsTriggered: 0,
      testJobIds: [] as string[],
      errors: [] as string[]
    }

    // Create test audio jobs for each language
    for (const language of config.languages) {
      console.log(`\n🎵 Creating ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]} test job...`)
      
      try {
        // Determine voice based on language and config
        const voiceToUse = language === 'hi' ? 'fable' : 
                          language === 'es' ? 'alloy' : 
                          config.voice

        const jobData = {
          input_text: config.testText,
          text_content: config.testText,
          status: 'pending',
          post_id: null, // Test jobs don't need to be linked to posts
          languages: [language],
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
            voice_id: voiceToUse,
            voice: voiceToUse,
            title: `Audio System Test - ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]}`,
            tts_provider: 'openai',
            speed: 0.9
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log(`🎤 Using voice: ${voiceToUse}`)

        const { data: job, error: jobError } = await supabase
          .from('audio_jobs')
          .insert(jobData)
          .select()
          .single()

        if (jobError) {
          results.errors.push(`Error creating test job for ${language}: ${jobError.message}`)
          continue
        }

        results.jobsCreated++
        results.testJobIds.push(job.id)
        console.log(`✅ Created test job ${job.id} for ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]}`)

        // Trigger processing
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
            results.jobsTriggered++
            console.log(`🚀 Processing triggered for ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]}`)
          } else {
            const errorText = await triggerResponse.text()
            results.errors.push(`Failed to trigger processing for ${language}: ${errorText}`)
          }
        } catch (triggerError: any) {
          results.errors.push(`Trigger error for ${language}: ${triggerError.message}`)
        }

        // Small delay between jobs
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error: any) {
        results.errors.push(`Error processing ${language}: ${error.message}`)
      }
    }

    console.log('\n🧪 Audio system test completed!')

    // Return detailed test results
    return NextResponse.json({
      success: results.jobsCreated > 0,
      message: `🧪 Audio system test ${results.jobsCreated > 0 ? 'completed successfully' : 'failed'}`,
      data: {
        summary: {
          jobsCreated: results.jobsCreated,
          jobsTriggered: results.jobsTriggered,
          languagesTested: config.languages.length,
          errorsEncountered: results.errors.length,
          testJobIds: results.testJobIds
        },
        testConfig: {
          textLength: config.testText.length,
          languages: config.languages.map(l => LANGUAGE_NAMES[l as keyof typeof LANGUAGE_NAMES]),
          voice: config.voice
        },
        nextSteps: [
          'Monitor job progress in the System Status tab',
          'Check individual job status using the job IDs provided',
          'Audio generation typically takes 30-60 seconds per language',
          'Test audio will be available in the Media Assets section once completed'
        ],
        errors: results.errors,
        jobMonitoringInfo: {
          message: 'Use these job IDs to monitor progress:',
          jobIds: results.testJobIds,
          statusCheckEndpoint: '/api/audio-job-status/{jobId}'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Audio system test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to test audio system'
    }, { status: 500 })
  }
}
