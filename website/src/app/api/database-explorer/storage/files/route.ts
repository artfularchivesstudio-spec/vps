// 🎵 **Storage Files Endpoint** - The melody archive revealing our digital symphonies
// Where audio files and image treasures are beautifully cataloged

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!bucket) {
      return NextResponse.json({
        success: false,
        error: 'Bucket name is required'
      }, { status: 400 });
    }

    const supabase = createClient();

    // 🎭 List files in the specified bucket and path
    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit: Math.min(limit, 1000), // Safety limit
        offset,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('❌ Storage files error:', error);
      return NextResponse.json({
        success: false,
        error: `Failed to fetch files from bucket '${bucket}'`,
        details: error.message
      }, { status: 500 });
    }

    // 🎨 Transform files into our artistic format
    const transformedFiles = files?.map((file: any) => ({
      name: file.name,
      id: file.id || `${bucket}/${path}/${file.name}`,
      updated_at: file.updated_at,
      created_at: file.created_at,
      last_accessed_at: file.last_accessed_at,
      metadata: file.metadata || {},
      bucket,
      path: path ? `${path}/${file.name}` : file.name,
      size: file.metadata?.size || 0,
      mimetype: file.metadata?.mimetype || 'unknown',
      cache_control: file.metadata?.cacheControl || 'unknown',
      is_folder: !file.id && !file.metadata, // Folders don't have metadata
      public_url: file.id ? supabase.storage.from(bucket).getPublicUrl(path ? `${path}/${file.name}` : file.name).data.publicUrl : null
    })) || [];

    return NextResponse.json({
      success: true,
      bucket,
      path,
      files: transformedFiles,
      count: transformedFiles.length,
      limit,
      offset,
      has_more: transformedFiles.length === limit,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Storage files endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// 🎼 **Upload File Endpoint** - The creative composer adding new symphonies
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string || '';
    const file = formData.get('file') as File;

    if (!bucket || !file) {
      return NextResponse.json({
        success: false,
        error: 'Bucket name and file are required'
      }, { status: 400 });
    }

    const supabase = createClient();

    // 🎵 Upload the file to storage
    const filePath = path ? `${path}/${file.name}` : file.name;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ File upload error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file',
        details: error.message
      }, { status: 500 });
    }

    // 🎨 Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        path: filePath,
        bucket,
        size: file.size,
        type: file.type,
        public_url: urlData.publicUrl,
        uploaded_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ File upload endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
