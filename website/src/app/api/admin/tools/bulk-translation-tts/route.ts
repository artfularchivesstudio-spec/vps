import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/auth/dual-auth'

interface BulkConfig {
  postCount: number
  languages: string[]
  voiceSettings: {
    en: string
    es: string
    hi: string
  }
}

const LANGUAGE_NAMES = { 'en': 'English', 'es': 'Spanish', 'hi': 'Hindi' }

export async function POST(request: NextRequest) {
  try {
    // 🔐 Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const config: BulkConfig = await request.json()
    const supabase = createServiceClient()

    console.log(`🚀 Starting bulk translation and TTS for ${config.postCount} posts...`)
    console.log(`🌍 Languages: ${config.languages.map(l => LANGUAGE_NAMES[l as keyof typeof LANGUAGE_NAMES]).join(', ')}`)

    const results = {
      postsProcessed: 0,
      jobsCreated: 0,
      jobsTriggered: 0,
      errors: [] as string[]
    }

    // Get the specified number of blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, content, excerpt, status')
      .order('created_at', { ascending: false })
      .limit(config.postCount)

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`)
    }

    console.log(`✅ Found ${posts.length} posts to process`)

    // Process each post
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]
      console.log(`\n🔄 Processing post ${i + 1}/${posts.length}: "${post.title}"`)
      
      // Use the excerpt for TTS (shorter and more manageable than full content)
      const textForTTS = post.excerpt || post.content.substring(0, 500) + '...'
      console.log(`📝 Text length: ${textForTTS.length} characters`)

      // Generate audio for specified languages
      for (const language of config.languages) {
        console.log(`  🌍 Creating ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]} audio job...`)
        
        try {
          const voiceId = config.voiceSettings[language as keyof typeof config.voiceSettings] || 'nova'
          
          // Create audio job
          const jobData = {
            input_text: textForTTS,
            text_content: textForTTS,
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
              voice_id: voiceId,
              voice: voiceId,
              title: `${post.title} - ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]}`,
              tts_provider: 'openai',
              speed: 0.9
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          console.log(`    🎤 Using voice: ${voiceId}`)

          const { data: job, error: jobError } = await supabase
            .from('audio_jobs')
            .insert(jobData)
            .select()
            .single()

          if (jobError) {
            results.errors.push(`Error creating job for ${language}: ${jobError.message}`)
            continue
          }

          results.jobsCreated++
          console.log(`    ✅ Created job ${job.id} for ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]}`)

          // Trigger processing via internal API
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
              console.log(`    🚀 Processing triggered for ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]}`)
            } else {
              console.log(`    ⚠️ Failed to trigger processing for ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]}, but job created`)
            }
          } catch (triggerError: any) {
            console.log(`    ⚠️ Trigger error for ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]}: ${triggerError.message}`)
          }

          // Small delay between jobs to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error: any) {
          results.errors.push(`Error processing ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]}: ${error.message}`)
        }
      }

      results.postsProcessed++
      console.log(`  ✅ Completed post: "${post.title}"`)
      
      // Delay between posts
      if (i < posts.length - 1) {
        console.log('    ⏳ Waiting 2 seconds before next post...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log('\n🎉 All posts processed! Audio jobs have been created and queued for processing.')

    return NextResponse.json({
      success: true,
      message: `🚀 Bulk translation & TTS completed successfully`,
      data: {
        summary: {
          postsProcessed: results.postsProcessed,
          jobsCreated: results.jobsCreated,
          jobsTriggered: results.jobsTriggered,
          languagesProcessed: config.languages.length,
          totalJobsExpected: results.postsProcessed * config.languages.length,
          errorsEncountered: results.errors.length
        },
        config: {
          postCount: config.postCount,
          languages: config.languages.map(l => LANGUAGE_NAMES[l as keyof typeof LANGUAGE_NAMES]),
          voiceSettings: config.voiceSettings
        },
        errors: results.errors,
        message: 'Audio generation will take several minutes. Check the admin panel for progress.'
      }
    })

  } catch (error: any) {
    console.error('❌ Bulk translation & TTS error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to run bulk translation & TTS'
    }, { status: 500 })
  }
}
