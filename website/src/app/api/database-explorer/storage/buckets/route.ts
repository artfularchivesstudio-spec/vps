// 🌌 **Storage Buckets Endpoint** - The cosmic vault revealing all storage realms
// Where digital treasures and audio symphonies are safely stored

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // 🎭 List all storage buckets in our cosmic vault
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Storage buckets error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch storage buckets',
        details: error.message
      }, { status: 500 });
    }

    // 🎨 Transform buckets into our artistic format
    const transformedBuckets = buckets?.map((bucket: any) => ({
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      file_size_limit: bucket.file_size_limit,
      allowed_mime_types: bucket.allowed_mime_types,
      created_at: bucket.created_at,
      updated_at: bucket.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      buckets: transformedBuckets,
      count: transformedBuckets.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Storage buckets endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}