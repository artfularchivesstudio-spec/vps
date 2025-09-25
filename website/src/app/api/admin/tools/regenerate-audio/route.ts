import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { job_id, language, force_regeneration = false } = await request.json()

    if (!job_id || !language) {
      return NextResponse.json(
        { error: 'Missing required parameters: job_id and language' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the audio job
    const { data: job, error: jobError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Audio job not found' },
        { status: 404 }
      )
    }

    // Get the post content
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', job.post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Get the original text
    const originalText = post.content || post.text_content || ''
    if (!originalText) {
      return NextResponse.json(
        { error: 'No content found in post' },
        { status: 400 }
      )
    }

    let textToGenerate = originalText

    // Translate if needed
    if (language !== 'en') {
      try {
        // Call translation API
        const translationResponse = await fetch(`${process.env.SUPABASE_URL}/functions/v1/translate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: originalText,
            target_language: language,
            source_language: 'en'
          })
        })

        if (translationResponse.ok) {
          const translationResult = await translationResponse.json()
          textToGenerate = translationResult.translated_text || originalText
          // Update the job with the translated text for future use
          await supabase
            .from('audio_jobs')
            .update({
              translated_texts: {
                ...job.translated_texts,
                [language]: textToGenerate
              }
            })
            .eq('id', job_id)
        }
      } catch (translationError) {
        console.warn('Translation failed, using original text:', translationError)
      }
    }

    // Generate audio using the correct edge function
    const audioResponse = await fetch(`${process.env.SUPABASE_URL}/functions/v1/ai-generate-audio-simple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: textToGenerate,
        languages: [language],
        title: `Regenerated Audio - ${language.toUpperCase()}`,
        voice_id: language === 'hi' ? 'fable' : 'nova'
      })
    })

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text()
      return NextResponse.json(
        { error: `Audio generation failed: ${errorText}` },
        { status: audioResponse.status }
      )
    }

    const audioResult = await audioResponse.json()

    // Store the new job ID for monitoring and linking
    const newJobId = audioResult.job_id
    if (newJobId && job.post_id) {
      // Update the new audio job to include the post_id for proper linking
      await supabase
        .from('audio_jobs')
        .update({ 
          post_id: job.post_id,
          config: {
            ...audioResult.config,
            title: post.title,
            is_regeneration: true,
            original_job_id: job_id
          }
        })
        .eq('id', newJobId)
    }

    return NextResponse.json({
      success: true,
      message: `Audio regeneration started for ${language.toUpperCase()}`,
      job_id: newJobId || job_id,
      language: language,
      text_length: textToGenerate.length,
      will_link_to_post: !!job.post_id
    })

  } catch (error) {
    console.error('Regenerate audio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}