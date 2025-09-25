/**
 * 🎭 The Grand Audio Creation Oracle - A Supabase Edge Function Spectacular
 *
 * "In the cloud-kingdom of Deno, where serverless functions dance like fireflies in the digital twilight,
 * I stand as the audio creation oracle, transforming text into jobs that await their voice.
 * Like a wizard conjuring spells, I create the parchment upon which voices will later sing."
 *
 * - The Serverless Sorcerer
 */

declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore: Deno std library import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore: ESM.sh import for Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// 🚫 Authentication disabled for pre-prod; no bouncer at this club 🎉 - The party is open to all!

/**
 * 🎵 AudioResult - The Promised Symphony
 * Like a prophecy foretelling the audio that will one day exist
 */
interface AudioResult {
  audio_base64: string;
  metadata: {
    voice_id: any;
    text_length: any;
    duration_estimate: number;
    generation_timestamp: string;
  };
  storage?: {
    media_asset_id: string;
    public_url: string;
  };
}

serve(async (req) => {
  console.log('🎭 The audio oracle awakens, sensing a new supplicant at the temple gates...');
  
  // 🕊️ Handle CORS preflight - like a diplomatic greeting between kingdoms
  if (req.method === 'OPTIONS') {
    console.log('🕊️ Diplomatic handshake accepted - CORS preflight resolved');
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  
  // 🚪 Only POST requests may enter the sacred temple
  if (req.method !== 'POST') {
    console.log(`🚪 "Begone, ${req.method} request! Only POST may enter this sacred temple!"`);
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed - the oracle only speaks to POST requests'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  
  try {
    console.log('📜 The supplicant presents their scroll of text...');
    const body = await req.json();
    
    // 🔍 Verify the supplicant has brought the required offering
    if (!body.text) {
      console.log('❌ "You come empty-handed! Bring me text to transform!" cries the oracle');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required offering: text'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log(`📜 Scroll received: "${body.text.substring(0, 50)}${body.text.length > 50 ? '...' : ''}" (${body.text.length} characters)`);
    
    // 🔮 Summon the Supabase connection - our portal to the digital realm
    console.log('🔮 Opening the portal to Supabase...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('💔 The portal stones are missing! Cannot connect to Supabase');
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('🔮 Portal established! Connection to digital realm successful');
    
    // 🎪 Create a unique identifier for this audio quest
    const jobId = crypto.randomUUID();
    console.log(`🎪 Created quest ID: ${jobId}`);
    
    // 🌍 Determine which languages shall sing
    const languages = body.languages || ['en'];
    console.log(`🌍 Languages selected for the choir: ${languages.join(', ')}`);
    
    // 🎭 Cast the perfect voice for each linguistic role
    let voiceId = body.voice_id || 'nova';
    if (languages.includes('hi')) {
      voiceId = 'fable'; // 🕉️ The wise sage for Hindi
      console.log('🕉️ Casting the wise "fable" voice for Hindi');
    }
    const title = body.title || 'Generated Audio';
    console.log(`🎭 Production title: "${title}"`);
    
    // 📋 Initialize the performance status for each language
    console.log('📋 Preparing performance contracts for each language...');
    const languageStatuses: Record<string, any> = {};
    for (const lang of languages) {
      languageStatuses[lang] = {
        status: 'pending',
        draft: false
      };
      console.log(`   📋 ${lang}: Contract signed, awaiting performance`);
    }
    
    // 🎬 Create the audio job - the grand production begins!
    console.log('🎬 "Places everyone! The show is about to begin!"');
    const { error } = await supabase.from('audio_jobs').insert({
      id: jobId,
      status: 'pending',
      input_text: body.text,
      text_content: body.text, // Add both fields for compatibility
      languages: languages, // ✅ Our multilingual cast
      completed_languages: [], // ✅ Empty stage before the performance
      current_language: languages[0], // ✅ Current performer
      language_statuses: languageStatuses, // ✅ Everyone's role
      is_draft: false, // ✅ This is the real deal, not a rehearsal
      config: {
        voice_id: voiceId,
        title: title,
        tts_provider: 'openai' // 🎭 Our voice coach
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    if (error) {
      console.error('🎬 Catastrophe! The production has been cancelled!', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create audio production',
        details: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // 🎭 The oracle speaks: Your quest has been recorded!
    console.log('✅ [ai-generate-audio-simple] Production created! The background performers will handle the show');
    console.log('🎭 "Your audio quest has been inscribed in the digital scrolls. Return in 3-5 minutes to witness the magic!"');
    
    return new Response(JSON.stringify({
      success: true,
      job_id: jobId,
      status: 'pending',
      message: 'Your audio production has begun! This is now an asynchronous performance that may take a few minutes. Return in 3-5 minutes to witness the final masterpiece.'
    }), {
      status: 202,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('💥 The oracle has been struck by lightning!', error);
    console.error('🏛️ The temple crumbles, the prophecy unfulfilled...');
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});