/**
 * @file This Edge Function handles the initial submission of an audio generation job.
 * It is called by the ChatGPT Action.
 *
 * Responsibilities:
 * 1. Receive a payload containing text content, languages, and draft mode settings.
 * 2. Create a new record in the `audio_jobs` table with appropriate language statuses.
 * 3. Return the job details to the client.
 *
 * This function supports:
 * - Draft mode: Generate audio for a single language first
 * - Final mode: Generate audio for all specified languages
 * - Language-specific status tracking
 */
// @ts-ignore: Deno std library import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore: ESM.sh import for Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// 🚫 Authentication disabled for pre-prod; wide open like a jam session 🎸

declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AudioJobPayload {
  text?: string;
  input_text?: string;
  text_content?: string;
  title?: string;
  voice?: string;  // Changed from voice_id to voice to match OpenAI naming
  post_id?: string;
  languages: string[];
  is_draft?: boolean;
  draft_language?: string;
  voice_settings?: {
    speed?: number;
    voice_gender?: 'male' | 'female';
    personality?: 'art_dealer' | 'art_instructor' | 'hybrid';
    voices?: Record<string, string>;
  };
}

interface LanguageStatus {
  status: string;
  draft: boolean;
  chunk_audio_urls?: string[];
  audio_url?: string;
  subtitle_url?: string;
  vtt_url?: string;
  srt_url?: string;
}

serve(async (req: Request) => {
  console.log(`[audio-job-submit] Invoked with method: ${req.method}`);
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const payload: AudioJobPayload = await req.json();
    console.log(`[audio-job-submit] Payload received:`, JSON.stringify(payload, null, 2));

    // Validate required fields
    const sourceText = payload.text ?? payload.input_text ?? payload.text_content;
    if (!sourceText) {
      console.error('[audio-job-submit] Error: A text field (text, input_text, or text_content) is missing from the payload.');
      return new Response(JSON.stringify({ success: false, error: 'Missing required text field.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payload.languages || !payload.languages.length) {
      console.log('[audio-job-submit] No languages specified, defaulting to English.');
      payload.languages = ['en'];
    }

    // Filter to only allow supported languages: English, Spanish, and Hindi
    payload.languages = payload.languages.filter(lang => ['en', 'es', 'hi'].includes(lang));
    if (payload.languages.length === 0) {
      console.log('[audio-job-submit] No valid languages specified, defaulting to English.');
      payload.languages = ['en'];
    }

    // Set draft mode by default if not specified
    if (payload.is_draft === undefined) {
      console.log('[audio-job-submit] Draft mode not specified, defaulting to draft mode.');
      payload.is_draft = true;
    }

    // Handle draft mode settings
    if (payload.is_draft) {
      console.log('[audio-job-submit] Draft mode: using first specified language or defaulting to English.');
      payload.draft_language = payload.languages[0] || 'en';
      payload.languages = [payload.draft_language];
    }

    // Initialize language statuses
    const languageStatuses: Record<string, LanguageStatus> = {};
    for (const lang of payload.languages) {
      languageStatuses[lang] = {
        status: 'pending',
        draft: payload.is_draft
      };
    }

    console.log('[audio-job-submit] Inserting new job into "audio_jobs" table.');
    // Create a new job in the 'audio_jobs' table
    const { data: job, error } = await supabase
      .from('audio_jobs')
      .insert({
        text_content: sourceText,
        input_text: sourceText,
        status: 'pending',
        config: {
          voice: payload.voice || (payload.voice_settings?.voice_gender === 'male' ? 'fable' : 'alloy'),
          voice_preference: payload.voice_settings?.voice_gender || 'female',
          voice_settings: payload.voice_settings,
          title: payload.title,
          personality: payload.voice_settings?.personality || 'hybrid',
          speed: payload.voice_settings?.speed || 1.1
        },
        post_id: payload.post_id,
        languages: payload.languages,
        is_draft: payload.is_draft || false,
        language_statuses: languageStatuses,
        completed_languages: [],
        current_language: payload.is_draft ? payload.draft_language : null
      })
      .select()
      .single();

    if (error) {
      console.error('[audio-job-submit] Supabase insert error:', error.message);
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log(`[audio-job-submit] Successfully created job with ID: ${job.id}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: payload.is_draft ? 
          `Draft audio job created for language ${payload.draft_language}` :
          `Audio job created for languages: ${payload.languages.join(', ')}`,
        job
      }),
      {
        status: 202, // Accepted
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[audio-job-submit] An unexpected error occurred:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 