/**
 * @file This Edge Function handles updating an existing audio generation job.
 * It supports:
 * 1. Transitioning from draft to final mode
 * 2. Updating text content (which will update all languages)
 * 3. Adding or removing languages
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
// 🚫 Authentication disabled for pre-prod; it's a trust fall 😅

declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface UpdateAudioJobPayload {
  job_id: string;
  text_content?: string;
  languages?: string[];
  finalize_draft?: boolean;
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
  console.log(`[audio-job-update] Invoked with method: ${req.method}`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[audio-job-update] Error: Supabase environment variables are not set.');
    return new Response(JSON.stringify({ success: false, error: 'Internal server configuration error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload: UpdateAudioJobPayload = await req.json();
    console.log(`[audio-job-update] Payload received:`, JSON.stringify(payload, null, 2));

    if (!payload.job_id) {
      return new Response(JSON.stringify({ success: false, error: 'job_id is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch current job state
    const { data: currentJob, error: fetchError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('id', payload.job_id)
      .single();

    if (fetchError || !currentJob) {
      console.error('[audio-job-update] Error fetching job:', fetchError?.message);
      return new Response(JSON.stringify({ success: false, error: 'Job not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare update payload
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // Handle text content update
    if (payload.text_content) {
      updates.text_content = payload.text_content;
      updates.input_text = payload.text_content; // For backward compatibility
      
      // Reset all language statuses since content changed
      const resetStatuses: Record<string, LanguageStatus> = {};
      for (const lang of currentJob.languages) {
        resetStatuses[lang] = {
          status: 'pending',
          draft: currentJob.is_draft
        };
      }
      updates.language_statuses = resetStatuses;
      updates.completed_languages = [];
      updates.status = 'pending';
    }

    // Handle language updates
    if (payload.languages) {
      updates.languages = payload.languages;
      
      // Update language statuses
      const updatedStatuses = { ...currentJob.language_statuses };
      
      // Remove languages that are no longer needed
      for (const lang in updatedStatuses) {
        if (!payload.languages.includes(lang)) {
          delete updatedStatuses[lang];
        }
      }
      
      // Add new languages
      for (const lang of payload.languages) {
        if (!updatedStatuses[lang]) {
          updatedStatuses[lang] = {
            status: 'pending',
            draft: currentJob.is_draft
          };
        }
      }
      
      updates.language_statuses = updatedStatuses;
      updates.completed_languages = currentJob.completed_languages.filter(lang => 
        payload.languages.includes(lang)
      );
    }

    // Handle draft to final transition
    if (payload.finalize_draft && currentJob.is_draft) {
      updates.is_draft = false;
      
      // Update all language statuses to non-draft
      const finalizedStatuses = { ...currentJob.language_statuses };
      for (const lang in finalizedStatuses) {
        finalizedStatuses[lang].draft = false;
      }
      
      // Add pending status for languages not yet processed
      for (const lang of currentJob.languages) {
        if (!finalizedStatuses[lang]) {
          finalizedStatuses[lang] = {
            status: 'pending',
            draft: false
          };
        }
      }
      
      updates.language_statuses = finalizedStatuses;
    }

    // Apply updates
    const { data: updatedJob, error: updateError } = await supabase
      .from('audio_jobs')
      .update(updates)
      .eq('id', payload.job_id)
      .select()
      .single();

    if (updateError) {
      console.error('[audio-job-update] Error updating job:', updateError.message);
      throw new Error(`Failed to update job: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job updated successfully',
        job: updatedJob
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[audio-job-update] An unexpected error occurred:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 