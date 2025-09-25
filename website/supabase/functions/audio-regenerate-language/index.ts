// @ts-ignore: Deno std library import
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
// @ts-ignore: ESM.sh import for Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(`Missing required environment variables`);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
    console.log('[audio-regenerate-language] Invoked with method:', req.method);
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { jobId, language } = await req.json();
        
        if (!jobId || !language) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing jobId or language parameter'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        console.log(`🔄 Regenerating audio for job ${jobId}, language: ${language}`);

        // Fetch the job to verify it exists and get current state
        const { data: job, error: fetchError } = await supabase
            .from('audio_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (fetchError || !job) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Audio job not found'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404
            });
        }

        // Verify the language is in the job's languages array
        if (!job.languages?.includes(language)) {
            return new Response(JSON.stringify({
                success: false,
                error: `Language ${language} is not part of this job`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        // Reset the specific language status to pending
        const updatedLanguageStatuses = {
            ...job.language_statuses,
            [language]: {
                status: 'pending',
                draft: job.language_statuses?.[language]?.draft || job.is_draft,
                chunk_audio_urls: []
            }
        };

        // Remove the language from completed_languages if it was there
        const updatedCompletedLanguages = (job.completed_languages || []).filter(
            (lang: string) => lang !== language
        );

        // Clear the language-specific audio URL from audio_urls
        const updatedAudioUrls = { ...job.audio_urls };
        if (updatedAudioUrls[language]) {
            delete updatedAudioUrls[language];
        }

        // Update the job in the database
        const { error: updateError } = await supabase
            .from('audio_jobs')
            .update({
                language_statuses: updatedLanguageStatuses,
                completed_languages: updatedCompletedLanguages,
                audio_urls: updatedAudioUrls,
                status: 'processing', // Set job back to processing if it was complete
                current_language: language, // Set this language as next to process
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId);

        if (updateError) {
            console.error('Error updating job for regeneration:', updateError);
            return new Response(JSON.stringify({
                success: false,
                error: 'Failed to queue audio regeneration'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            });
        }

        console.log(`✅ Reset ${language} audio for regeneration in job ${jobId}`);

        // Trigger the background worker to process the job
        try {
            console.log('🚀 Triggering audio job processing for regeneration...');
            const triggerResponse = await fetch(`${supabaseUrl}/functions/v1/audio-job-worker-chunked`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({ job_id: jobId })
            });

            if (triggerResponse.ok) {
                console.log('✅ Audio job regeneration processing triggered successfully');
            } else {
                console.warn('⚠️ Failed to trigger regeneration processing, but job was queued');
            }
        } catch (triggerError) {
            console.warn('⚠️ Regeneration job trigger error:', triggerError);
            // Don't fail the request if triggering fails - the job is still queued
        }

        return new Response(JSON.stringify({
            success: true,
            message: `${language.toUpperCase()} audio regeneration has been queued`,
            jobId,
            language
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Audio regeneration error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to queue audio regeneration'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});