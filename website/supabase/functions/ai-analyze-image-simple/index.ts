// @ts-ignore: Deno std library import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore: ESM.sh import for Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// 🚫 Authentication disabled for pre-prod; open house vibes 🏠
import { analyzeImage } from './image-analysis.ts';
// Save to storage
async function saveToStorage(imageUrl, analysisData, title) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  let imageBuffer: ArrayBuffer;
  
  // Handle base64 data URLs
  if (imageUrl.startsWith('data:')) {
    const base64Data = imageUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    imageBuffer = bytes.buffer;
  } else {
    // Download from URL
    const imageResponse = await fetch(imageUrl);
    imageBuffer = await imageResponse.arrayBuffer();
  }
  const fileName = `analyzed-${Date.now()}.jpg`;
  const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(fileName, imageBuffer, {
    contentType: 'image/jpeg',
    upsert: false
  });
  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }
  // Get public URL
  const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
  // Create media asset record
  const { data: mediaAsset, error: mediaError } = await supabase.from('media_assets').insert({
    filename: fileName,
    original_name: title || 'AI Analyzed Image',
    file_path: uploadData.path,
    file_size: imageBuffer.byteLength,
    mime_type: 'image/jpeg',
    asset_type: 'image',
    public_url: publicUrlData.publicUrl,
    metadata: {
      ai_analysis: analysisData,
      source_url: imageUrl.startsWith('data:') ? 'base64_upload' : imageUrl,
      analysis_timestamp: new Date().toISOString()
    }
  }).select().single();
  if (mediaError) {
    throw new Error(`Media asset creation failed: ${mediaError.message}`);
  }
  return {
    media_asset_id: mediaAsset.id,
    public_url: publicUrlData.publicUrl
  };
}
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    const requestText = await req.text();
    console.log('Request size:', requestText.length, 'bytes');
    
    let body;
    try {
      body = JSON.parse(requestText);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return new Response(JSON.stringify({
        success: false,
        error: `JSON parsing failed: ${jsonError.message}`,
        request_size: requestText.length
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Handle both image_data (base64) and image_url formats
    if (!body.image_data && !body.image_url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required field: image_data or image_url'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Convert base64 image_data to URL if provided
    let imageUrl = body.image_url;
    if (body.image_data && !imageUrl) {
      // For base64 data, we'll pass it directly to the analysis
      imageUrl = body.image_data;
    }
    // Use the shared image analysis service
    const analysisRequest = {
      imageUrl: imageUrl,
      prompt: body.prompt,
      providers: body.providers,
      analysisType: body.analysis_type,
      saveToStorage: body.save_to_storage,
      title: body.title
    };
    const analysisResult = await analyzeImage(analysisRequest);
    if (!analysisResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: analysisResult.error
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Blog generation? Not my circus 🐒—call `generate-blog-content` separately
    // Save to storage if requested
    if (body.save_to_storage && analysisResult.data) {
      try {
        const storageResult = await saveToStorage(imageUrl, analysisResult.data, body.title);
        analysisResult.data.storage = storageResult;
      } catch (error) {
        console.error('Storage save failed:', error);
        analysisResult.data.storage_error = error.message;
      }
    }
    return new Response(JSON.stringify({
      success: true,
      data: analysisResult.data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Edge function error:', error);
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
