// @ts-ignore: Deno std library import
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
// @ts-ignore: ESM.sh import for Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 🎵 AudioJob interface for our theatrical audio processing
interface AudioJob {
  id: string;
  post_id?: string;
  status: string;
  text_content: string;
  input_text: string;
  config: {
    voice?: string;
    voice_preference?: string;
    voice_settings?: any;
    title?: string;
    personality?: string;
    speed?: number;
  };
  languages: string[];
  completed_languages: string[];
  audio_urls?: Record<string, string>;
  translated_texts?: Record<string, string>;
  language_statuses?: Record<string, { status: string; draft: boolean; chunk_audio_urls?: string[] }>;
  current_language?: string;
  is_draft?: boolean;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
    console.log('[audio-job-worker-chunked] Invoked with method:', req.method);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { job_id } = await req.json();

        if (!job_id) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing job_id parameter'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        console.log(`🎵 Processing audio job: ${job_id}`);

        // Fetch the job from database
        const { data: job, error: fetchError } = await supabase
            .from('audio_jobs')
            .select('*')
            .eq('id', job_id)
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

        // Process the job
        const result = await processAudioJob(job);

        return new Response(JSON.stringify({
            success: true,
            message: 'Audio job processed successfully',
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Audio job worker error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to process audio job'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});

async function processAudioJob(job: AudioJob) {
  try {
    // Validate input
    if (!job.text_content && !job.input_text) {
      throw new Error('Invalid audio job - missing text content');
    }

    if (!job.languages?.length) {
      throw new Error('Invalid audio job - missing languages');
    }

    const content = job.text_content || job.input_text;
    console.log(`🎭 Processing content for ${job.languages.length} languages`);

    // Process each language
    const results = await Promise.allSettled(
      job.languages.map(async (lang) => {
        try {
          // Check if this language is already completed
          if (job.completed_languages?.includes(lang)) {
            console.log(`⏭️ Skipping ${lang} - already completed`);
            return { lang, status: 'skipped', audioUrl: job.audio_urls?.[lang] };
          }

          // Check if this language should be processed (for regeneration)
          if (job.current_language && job.current_language !== lang) {
            console.log(`⏭️ Skipping ${lang} - not current target language`);
            return { lang, status: 'skipped' };
          }

          console.log(`🎵 Generating audio for ${lang}...`);
          const processedContent = processContentChunk(content, lang);
          const audioUrl = await generateAudio(processedContent, lang, job.config);

          return { lang, status: 'completed', audioUrl };
        } catch (error: any) {
          console.error(`❌ Failed to process ${lang}:`, error);
          return { lang, status: 'failed', error: error.message };
        }
      })
    );

    // Handle results and update database
    const successResults = results
      .filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.status === 'completed')
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    const skippedResults = results
      .filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.status === 'skipped')
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    const failedLangs = results
      .filter((r) => r.status === 'rejected' || ((r as PromiseFulfilledResult<any>).value?.status === 'failed'))
      .map((r, i) => {
        if (r.status === 'rejected') {
          return {
            lang: job.languages[i],
            error: (r as PromiseRejectedResult).reason?.message || 'Unknown error'
          };
        } else {
          return {
            lang: (r as PromiseFulfilledResult<any>).value.lang,
            error: (r as PromiseFulfilledResult<any>).value.error
          };
        }
      });

    // Update job status in database
    await updateJobStatus(job.id, successResults, skippedResults, failedLangs);

    // Synchronize with blog_posts table if post_id exists
    if (job.post_id) {
      await synchronizeBlogPostAudio(job.post_id, successResults, failedLangs);
    }

    return {
      success: true,
      processed: successResults.length,
      skipped: skippedResults.length,
      failures: failedLangs.length,
      successResults,
      failedLangs
    };
  } catch (error) {
    console.error('Audio job processing failed:', error);
    await supabase
      .from('audio_jobs')
      .update({
        status: 'failed',
        error: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
    throw error;
  }
}

function processContentChunk(content: string, lang: string): string {
  // Clean content and handle language-specific processing
  let processed = content
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/\n+/g, ' ')  // Replace multiple newlines with single space
    .trim();

  // Add language-specific processing if needed
  if (lang === 'hi') {
    // Ensure Hindi text is properly formatted
    processed = processed.replace(/\s+/g, ' ');
  }

  return processed;
}

async function generateAudio(content: string, lang: string, config: any): Promise<string> {
  const voiceSettings = config?.voice_settings || { stability: 0.5, similarity_boost: 0.8 };
  const speed = config?.speed || 0.9;

  // Use OpenAI for English, ElevenLabs for other languages
  if (lang === 'en' && openaiApiKey) {
    return await generateOpenAIAudio(content, config);
  } else if (elevenLabsApiKey) {
    return await generateElevenLabsAudio(content, lang, voiceSettings, speed);
  } else {
    throw new Error('No audio generation service configured');
  }
}

async function generateOpenAIAudio(content: string, config: any): Promise<string> {
  const voice = config?.voice || 'nova';

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: content,
      voice: voice,
      response_format: 'mp3',
      speed: config?.speed || 0.9
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI audio generation failed: ${response.status} - ${errorText}`);
  }

  const audioData = await response.arrayBuffer();
  const fileName = `openai-${Date.now()}-en.mp3`;

  const { data: uploadData, error } = await supabase.storage
    .from('audio-assets')
    .upload(fileName, audioData, {
      contentType: 'audio/mpeg'
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('audio-assets')
    .getPublicUrl(uploadData.path);

  return urlData.publicUrl;
}

async function generateElevenLabsAudio(content: string, lang: string, voiceSettings: any, speed: number): Promise<string> {
  // Map language to ElevenLabs voice ID
  const voiceIds: Record<string, string> = {
    'en': '21m00Tcm4TlvDq8ikWAM', // Rachel
    'es': 'pNInz6obpgDQGcFmaJgB', // Adam (Spanish)
    'hi': 'AZnzlk1XvdvUeBnXmlld'  // Arnold (can handle Hindi)
  };

  const voiceId = voiceIds[lang] || voiceIds['en'];

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': elevenLabsApiKey!
    },
    body: JSON.stringify({
      text: content,
      model_id: 'eleven_monolingual_v1',
      voice_settings: voiceSettings,
      stability: voiceSettings.stability || 0.5,
      similarity_boost: voiceSettings.similarity_boost || 0.8
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs audio generation failed: ${response.status} - ${errorText}`);
  }

  const audioData = await response.arrayBuffer();
  const fileName = `elevenlabs-${Date.now()}-${lang}.mp3`;

  const { data: uploadData, error } = await supabase.storage
    .from('audio-assets')
    .upload(fileName, audioData, {
      contentType: 'audio/mpeg'
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('audio-assets')
    .getPublicUrl(uploadData.path);

  return urlData.publicUrl;
}

async function updateJobStatus(
  jobId: string,
  successes: Array<{ lang: string; audioUrl: string }>,
  skipped: Array<{ lang: string; audioUrl?: string }>,
  failures: Array<{ lang: string; error: string }>
) {
  // Build updated language statuses
  const currentStatuses = await supabase
    .from('audio_jobs')
    .select('language_statuses, completed_languages, audio_urls')
    .eq('id', jobId)
    .single();

  const existingStatuses = currentStatuses.data?.language_statuses || {};
  const existingCompleted = currentStatuses.data?.completed_languages || [];
  const existingUrls = currentStatuses.data?.audio_urls || {};

  // Update language statuses
  const updatedLanguageStatuses = { ...existingStatuses };
  const updatedAudioUrls = { ...existingUrls };
  const updatedCompletedLanguages = [...existingCompleted];

  // Update successful languages
  successes.forEach(({ lang, audioUrl }) => {
    updatedLanguageStatuses[lang] = {
      ...updatedLanguageStatuses[lang],
      status: 'completed',
      draft: false
    };
    updatedAudioUrls[lang] = audioUrl;
    if (!updatedCompletedLanguages.includes(lang)) {
      updatedCompletedLanguages.push(lang);
    }
  });

  // Update failed languages
  failures.forEach(({ lang, error }) => {
    updatedLanguageStatuses[lang] = {
      ...updatedLanguageStatuses[lang],
      status: 'failed'
    };
  });

  // Determine overall job status
  const totalLanguages = Object.keys(updatedLanguageStatuses).length;
  const completedCount = updatedCompletedLanguages.length;
  const failedCount = failures.length;

  let overallStatus = 'processing';
  if (completedCount === totalLanguages) {
    overallStatus = 'completed';
  } else if (completedCount > 0) {
    overallStatus = 'partial_success';
  } else if (failedCount === totalLanguages) {
    overallStatus = 'failed';
  }

  const updates: any = {
    status: overallStatus,
    language_statuses: updatedLanguageStatuses,
    completed_languages: updatedCompletedLanguages,
    audio_urls: updatedAudioUrls,
    current_language: null, // Clear current language after processing
    updated_at: new Date().toISOString()
  };

  // Add completed_at if job is fully done
  if (overallStatus === 'completed' || overallStatus === 'failed') {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('audio_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job status:', error);
    throw error;
  }

  console.log(`✅ Updated job ${jobId}: ${overallStatus} (${completedCount}/${totalLanguages} completed)`);
}

async function synchronizeBlogPostAudio(
  postId: string,
  successes: Array<{ lang: string; audioUrl: string }>,
  failures: Array<{ lang: string; error: string }>
) {
  try {
    console.log(`🔄 Synchronizing audio assets for post ${postId}`);

    // Create media assets for successful audio generations
    const mediaAssets = await Promise.all(
      successes.map(async ({ lang, audioUrl }) => {
        try {
          // Check if media asset already exists
          const { data: existingAsset } = await supabase
            .from('media_assets')
            .select('id')
            .eq('file_url', audioUrl)
            .eq('metadata->>language', lang)
            .single();

          if (existingAsset) {
            return { language: lang, assetId: existingAsset.id };
          }

          // Create new media asset
          const { data: newAsset, error: assetError } = await supabase
            .from('media_assets')
            .insert({
              title: `Audio narration (${lang.toUpperCase()})`,
              file_url: audioUrl,
              file_type: 'audio',
              mime_type: 'audio/mpeg',
              metadata: {
                language: lang,
                generated_at: new Date().toISOString(),
                source: 'audio_job_worker_chunked'
              },
              related_post_id: postId
            })
            .select('id')
            .single();

          if (assetError) {
            console.error(`Failed to create media asset for ${lang}:`, assetError);
            return null;
          }

          return { language: lang, assetId: newAsset.id };
        } catch (error) {
          console.error(`Error processing media asset for ${lang}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and build audio_assets_by_language object
    const validAssets = mediaAssets.filter(asset => asset !== null);
    if (validAssets.length === 0) {
      console.log('No valid audio assets to synchronize');
      return;
    }

    const audioAssetsByLanguage = validAssets.reduce((acc, asset) => {
      acc[asset.language] = asset.assetId;
      return acc;
    }, {} as Record<string, string>);

    // Update blog post with audio assets
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        audio_assets_by_language: audioAssetsByLanguage,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (updateError) {
      console.error('Failed to update blog post audio assets:', updateError);
      throw updateError;
    }

    console.log(`✅ Successfully synchronized ${validAssets.length} audio assets for post ${postId}`);

    // Log partial success if any failures occurred
    if (failures.length > 0) {
      console.warn(`⚠️ Partial success for post ${postId}: ${successes.length} succeeded, ${failures.length} failed`);
      failures.forEach(({ lang, error }) => {
        console.warn(`❌ Failed to generate audio for ${lang}: ${error}`);
      });
    }

  } catch (error) {
    console.error(`❌ Failed to synchronize blog post audio for post ${postId}:`, error);
    // Don't throw here - we don't want to fail the entire job if sync fails
    // The audio job itself succeeded, just the sync didn't work
  }
}
