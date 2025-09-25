import { createServiceClient } from '@/lib/supabase/server';
import { logManager } from '@/lib/observability/log-manager';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/dual-auth';

export async function POST(request: NextRequest) {
  // Authenticate request using dual authentication system
  const authResult = await authenticateRequest(request);
  
  if (!authResult.isAuthenticated) {
    console.error('❌ Authentication failed:', authResult.error);
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    );
  }

  console.log(`🔐 Authenticated via ${authResult.authType}`);
  const supabase = authResult.supabaseClient;
  
  try {
    const payload = await request.json();
    const { 
      text, 
      multilingual_texts, 
      multilingual_titles,
      title, 
      languages, 
      is_draft, 
      voice_settings, 
      post_id,
      tts_provider,
      selected_voice,
      callback_url,
      content_version
    } = payload;

    // 🎭 The Grand Multilingual Revolution: Support both old and new payload structures!
    const isMultilingualMode = !!multilingual_texts;
    const textToUse = isMultilingualMode ? multilingual_texts?.en || '' : text;
    const titleToUse = isMultilingualMode ? multilingual_titles?.en || 'Untitled' : title;

    if (!textToUse) {
      return NextResponse.json(
        { error: 'Text content is required (either "text" or "multilingual_texts.en")' },
        { status: 400 }
      );
    }

    console.log('🎧 /api/ai/generate-audio: request received')
    console.log(`📝 Text length: ${textToUse.length}`)
    console.log(`🌍 Multilingual mode: ${isMultilingualMode}`)
    if (isMultilingualMode) {
      console.log('🎭 Languages with content:', Object.keys(multilingual_texts || {}).join(', '))
    }
    console.log('🧾 Payload (sanitized):', { 
      ...payload, 
      text: textToUse ? `[${textToUse.length} chars]` : undefined,
      multilingual_texts: multilingual_texts ? 
        Object.fromEntries(Object.entries(multilingual_texts).map(([lang, text]) => [lang, `[${(text as string).length} chars]`])) 
        : undefined 
    })

    // 🎪 Prepare job data to match Supabase backend expectations
    const jobData: any = {
      input_text: textToUse, // Use the appropriate text based on mode
      text_content: textToUse, // For compatibility
      status: 'pending',
      post_id: post_id, // Pass post_id to the job
      content_version,
      config: {
        voice: selected_voice || (voice_settings?.voice_gender === 'male' ? 'fable' : 'nova'),
        voice_preference: voice_settings?.voice_gender || 'female',
        voice_settings: voice_settings,
        title: titleToUse,
        personality: voice_settings?.personality || 'hybrid',
        speed: voice_settings?.speed || 0.9,
        callback_url: callback_url || null,
        is_multilingual_mode: isMultilingualMode
      },
      languages: languages || ['en'],
      is_draft: is_draft !== undefined ? is_draft : true,
      completed_languages: [],
      current_language: is_draft ? (languages?.[0] || 'en') : null
    }

    // 🌍 Store the multilingual content if provided
    if (isMultilingualMode && multilingual_texts) {
      jobData.translated_texts = multilingual_texts;
      // Store multilingual titles if provided
      if (multilingual_titles) {
        jobData.translated_titles = multilingual_titles;
      }
    }

    // Initialize language statuses
    const languageStatuses: Record<string, any> = {};
    const selectedLanguages = languages || ['en'];
    for (const lang of selectedLanguages) {
      languageStatuses[lang] = {
        status: 'pending',
        draft: is_draft !== undefined ? is_draft : true
      };
    }
    jobData.language_statuses = languageStatuses;

    console.log('🗄️ Inserting jobData into Supabase')

    // Insert a new job into the audio_jobs table
    const { data, error } = await supabase
      .from('audio_jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      console.error('Error creating audio job:', error);
      throw error;
    }

    console.log('✅ Created audio job:', data.id)
    await logManager.log({ level: 'info', message: 'audio_job_created', context: { jobId: data.id, post_id } })

    // Trigger automatic processing of the job
    try {
      console.log('🚀 Triggering audio job processing...')
      const triggerResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audio-jobs/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ job_id: data.id })
      })

        if (triggerResponse.ok) {
          console.log('✅ Audio job processing triggered successfully')
          await logManager.log({ level: 'info', message: 'audio_job_triggered', context: { jobId: data.id } })
        } else {
        console.warn('⚠️ Failed to trigger audio job processing, but job created')
      }
    } catch (triggerError) {
      console.warn('⚠️ Audio job trigger error:', triggerError)
      // Don't fail the request if triggering fails
    }

    // Return the job ID to the client
    return NextResponse.json(
      { jobId: data.id },
      { status: 202 } // 202 Accepted: The request has been accepted for processing
    );

  } catch (error) {
    console.error('Audio job creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create audio generation job' },
      { status: 500 }
    );
  }
}