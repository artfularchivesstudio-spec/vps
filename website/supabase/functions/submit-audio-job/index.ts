import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// 🚫 Authentication disabled for pre-prod; legacy endpoint, open doors 🚪

declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SubmitAudioJobRequest {
    text_content: string;
    languages: string[];
    is_draft?: boolean;
    draft_language?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { text_content, languages, is_draft = false, draft_language } = await req.json() as SubmitAudioJobRequest;

        // Validate input
        if (!text_content || !text_content.trim()) {
            throw new Error('text_content is required');
        }
        if (!languages || !languages.length) {
            throw new Error('At least one language is required');
        }
        if (is_draft && !draft_language) {
            throw new Error('draft_language is required when is_draft is true');
        }
        if (is_draft && !languages.includes(draft_language!)) {
            throw new Error('draft_language must be one of the specified languages');
        }

        // Initialize language statuses
        const languageStatuses: Record<string, any> = {};
        if (is_draft) {
            // In draft mode, only initialize the specified language
            languageStatuses[draft_language!] = {
                status: 'pending',
                draft: true
            };
        } else {
            // In final mode, initialize all languages
            for (const lang of languages) {
                languageStatuses[lang] = {
                    status: 'pending',
                    draft: false
                };
            }
        }

        // Create the audio job
        const { data: job, error } = await supabase
            .from('audio_jobs')
            .insert({
                text_content,
                languages,
                is_draft,
                language_statuses: languageStatuses,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                completed_languages: []
            })
            .select()
            .single();

        if (error) throw error;

        return new Response(
            JSON.stringify({
                message: is_draft ? 
                    `Draft audio job created for language ${draft_language}` :
                    `Audio job created for languages: ${languages.join(', ')}`,
                job
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 201
            }
        );

    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(
            JSON.stringify({
                error: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
}); 