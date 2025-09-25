import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// 🖼️ The Spellbinding Media Assets Curator
// Guardian of all things beautiful and multimedia in our digital gallery!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// 🎨 Error Response Interface - Our Safety Net
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    status: number;
    timestamp: string;
    requestId?: string;
  };
}

// 🖼️ Media Asset Data Interface - The Blueprint of Our Digital Treasures
interface MediaAssetData {
  id: string;
  title: string;
  file_url: string;
  file_type: 'image' | 'audio' | 'video' | 'document';
  mime_type: string;
  file_size_bytes: number;
  related_post_id?: string;
  generation_metadata?: {
    type: string;
    language?: string;
    generated_at: string;
    model?: string;
    source?: string;
  };
  status: 'ready' | 'processing' | 'failed';
  created_at: string;
  updated_at: string;
}

// 🎼 The Grand Media Assets Handler - Our Master Curator
Deno.serve(async (req) => {
  // 🎭 CORS Support - Welcoming All Visitors
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // 🎯 Route the Performance - Direct Each Request to Its Proper Exhibition Room
    switch (method) {
      case 'GET':
        if (pathParts.length === 1) {
          // GET /media-assets - List all media assets
          return await listMediaAssets(req);
        } else if (pathParts.length === 2) {
          // GET /media-assets/{id} - Get specific media asset
          const assetId = pathParts[1];
          return await getMediaAsset(req, assetId);
        }
        break;

      case 'POST':
        if (pathParts.length === 1) {
          // POST /media-assets - Create new media asset
          return await createMediaAsset(req);
        }
        break;

      case 'PUT':
        if (pathParts.length === 2) {
          // PUT /media-assets/{id} - Update media asset
          const assetId = pathParts[1];
          return await updateMediaAsset(req, assetId);
        }
        break;

      case 'DELETE':
        if (pathParts.length === 2) {
          // DELETE /media-assets/{id} - Delete media asset
          const assetId = pathParts[1];
          return await deleteMediaAsset(req, assetId);
        }
        break;
    }

    // 🎪 Route Not Found - The Show Must Go On!
    return createErrorResponse('ROUTE_NOT_FOUND', 'The requested media assets route does not exist', 404);

  } catch (error) {
    console.error('[media-assets] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500, error);
  }
});

// 🎭 List Media Assets - Browse Our Digital Gallery Collection
async function listMediaAssets(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const fileType = url.searchParams.get('file_type');
    const relatedPostId = url.searchParams.get('related_post_id');
    const status = url.searchParams.get('status');

    let query = supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fileType) {
      query = query.eq('file_type', fileType);
    }

    if (relatedPostId) {
      query = query.eq('related_post_id', relatedPostId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: assets, error } = await query;

    if (error) {
      console.error('[listMediaAssets] Database error:', error);
      return createErrorResponse('DATABASE_ERROR', 'Failed to retrieve media assets', 500, error);
    }

    return new Response(JSON.stringify({
      success: true,
      data: assets,
      pagination: {
        limit,
        offset,
        hasMore: assets.length === limit
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[listMediaAssets] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to list media assets', 500, error);
  }
}

// 🎨 Get Media Asset - Inspect a Specific Digital Masterpiece
async function getMediaAsset(req: Request, assetId: string) {
  try {
    const { data: asset, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('ASSET_NOT_FOUND', 'Media asset not found', 404);
      }
      console.error('[getMediaAsset] Database error:', error);
      return createErrorResponse('DATABASE_ERROR', 'Failed to retrieve media asset', 500, error);
    }

    return new Response(JSON.stringify({
      success: true,
      data: asset
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[getMediaAsset] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to get media asset', 500, error);
  }
}

// 🎵 Create Media Asset - Add a New Treasure to Our Gallery
async function createMediaAsset(req: Request) {
  try {
    const body = await req.json();

    // 🎭 Validate Input - Ensure Our Creation Has All Required Elements
    const requiredFields = ['title', 'file_url', 'file_type', 'mime_type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse('VALIDATION_ERROR', `Missing required field: ${field}`, 400);
      }
    }

    // 🎨 Validate File Type - Ensure It's a Supported Medium
    const validFileTypes = ['image', 'audio', 'video', 'document'];
    if (!validFileTypes.includes(body.file_type)) {
      return createErrorResponse('VALIDATION_ERROR', `Invalid file_type. Must be one of: ${validFileTypes.join(', ')}`, 400);
    }

    // 🎪 Create the Media Asset - Add to Our Curated Collection
    const assetData = {
      title: body.title,
      file_url: body.file_url,
      file_type: body.file_type,
      mime_type: body.mime_type,
      file_size_bytes: body.file_size_bytes || 0,
      related_post_id: body.related_post_id,
      generation_metadata: body.generation_metadata || {},
      status: body.status || 'ready',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: asset, error } = await supabase
      .from('media_assets')
      .insert(assetData)
      .select()
      .single();

    if (error) {
      console.error('[createMediaAsset] Database error:', error);
      return createErrorResponse('DATABASE_ERROR', 'Failed to create media asset', 500, error);
    }

    return new Response(JSON.stringify({
      success: true,
      data: asset
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[createMediaAsset] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create media asset', 500, error);
  }
}

// 🎨 Update Media Asset - Polish and Perfect Our Digital Treasure
async function updateMediaAsset(req: Request, assetId: string) {
  try {
    const body = await req.json();

    const { data: asset, error: fetchError } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('ASSET_NOT_FOUND', 'Media asset not found', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to fetch media asset', 500, fetchError);
    }

    // 🎭 Prepare Update Data - Refine Our Curated Piece
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only allow updates to certain fields
    const allowedFields = ['title', 'file_url', 'status', 'generation_metadata'];
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    const { data: updatedAsset, error: updateError } = await supabase
      .from('media_assets')
      .update(updateData)
      .eq('id', assetId)
      .select()
      .single();

    if (updateError) {
      return createErrorResponse('DATABASE_ERROR', 'Failed to update media asset', 500, updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: updatedAsset
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[updateMediaAsset] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to update media asset', 500, error);
  }
}

// 🗑️ Delete Media Asset - Remove from Our Curated Exhibition
async function deleteMediaAsset(req: Request, assetId: string) {
  try {
    const { data: asset, error: fetchError } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('ASSET_NOT_FOUND', 'Media asset not found', 404);
      }
      return createErrorResponse('DATABASE_ERROR', 'Failed to fetch media asset', 500, fetchError);
    }

    // 🎭 Delete Associated Files - Clean Up the Exhibition Space
    if (asset.file_url) {
      try {
        // Extract file path from Supabase storage URL
        const filePath = asset.file_url.split('/').pop();
        if (filePath) {
          // Determine storage bucket based on file type
          const bucket = asset.file_type === 'audio' ? 'audio-assets' : 'media-assets';
          await supabase.storage
            .from(bucket)
            .remove([filePath]);
        }
      } catch (storageError) {
        console.warn(`Failed to delete file for asset ${assetId}:`, storageError);
        // Continue with deletion even if storage cleanup fails
      }
    }

    // 🗑️ Delete the Asset - Final Curtain
    const { error: deleteError } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', assetId);

    if (deleteError) {
      return createErrorResponse('DATABASE_ERROR', 'Failed to delete media asset', 500, deleteError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Media asset deleted successfully',
      asset_id: assetId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[deleteMediaAsset] Unexpected error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to delete media asset', 500, error);
  }
}

// 🎪 Create Error Response - Our Safety Net
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: any,
  requestId?: string
): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      status,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
      ...(requestId && { requestId })
    }
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
