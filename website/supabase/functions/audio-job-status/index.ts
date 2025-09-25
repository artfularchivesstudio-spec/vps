declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

/**
 * @file This Edge Function handles polling for the status of an audio generation job.
 * It is called by the ChatGPT Action after a job has been submitted.
 *
 * Responsibilities:
 * 1. Extract the `job_id` from the URL path.
 * 2. Query the `audio_jobs` table for the specified job.
 * 3. Return the current status, language-specific progress, and URLs.
 *
 * This function allows the client to asynchronously check the progress of a job.
 */
// @ts-ignore: Deno std library import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore: ESM.sh import for Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// 🚫 Authentication disabled for pre-prod; peek freely 👀

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    console.log(`[audio-job-status] Invoked with URL: ${req.url}`);

    try {
        // A more robust way to get the job_id from the end of the path
        const pathParts = new URL(req.url).pathname.split('/');
        const jobId = pathParts[pathParts.length - 1];

        if (!jobId || jobId.length < 36) { // Basic validation for UUID
            console.error(`[audio-job-status] Error: Invalid or missing job_id in URL path. Path: ${new URL(req.url).pathname}`);
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid or missing job_id in URL path',
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`[audio-job-status] Attempting to fetch job with ID: ${jobId}`);
        const { data: job, error } = await supabase
            .from('audio_jobs')
            .select(`
                status,
                is_draft,
                languages,
                language_statuses,
                completed_languages,
                current_language,
                error_message,
                created_at,
                updated_at
            `)
            .eq('id', jobId)
            .single();

        if (error || !job) {
            console.error(`[audio-job-status] Error fetching job ${jobId}:`, error?.message || 'Job not found.');
            return new Response(JSON.stringify({
                success: false,
                error: 'Job not found',
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`[audio-job-status] Successfully fetched job ${jobId}. Status: ${job.status}`);
        
        // Calculate overall progress
        const totalLanguages = job.languages.length;
        const completedLanguages = job.completed_languages?.length || 0;
        const overallProgress = totalLanguages > 0 ? (completedLanguages / totalLanguages) * 100 : 0;

        // Construct the response payload
        const responsePayload = {
            success: true,
            job: {
                id: jobId,
                status: job.status,
                is_draft: job.is_draft,
                languages: job.languages,
                language_statuses: job.language_statuses,
                completed_languages: job.completed_languages || [],
                current_language: job.current_language,
                error_message: job.error_message,
                created_at: job.created_at,
                updated_at: job.updated_at,
                overall_progress: Math.round(overallProgress)
            },
            message: job.error_message ? 
                `Error: ${job.error_message}` :
                job.status === 'complete' ?
                    'All languages completed successfully' :
                    job.is_draft ?
                        `Processing draft language: ${job.current_language || 'initializing...'}` :
                        `Processing languages: ${completedLanguages}/${totalLanguages} complete`
        };

        const responseHeaders = {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching
        };

        return new Response(JSON.stringify(responsePayload), {
            headers: responseHeaders,
            status: 200,
        });

    } catch (error: any) {
        console.error('[audio-job-status] An unexpected error occurred:', error.message);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}); 