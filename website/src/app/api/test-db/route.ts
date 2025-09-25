import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    console.log('Testing database connection...');
    
    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('blog_posts')
      .select('count')
      .limit(1);
    
    console.log('Connection test result:', { connectionTest, connectionError });
    
    // Test 2: List available tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list');
    
    console.log('Tables test result:', { tables, tablesError });
    
    // Test 3: Check if blog_posts table exists
    const { data: blogPosts, error: blogPostsError } = await supabase
      .from('blog_posts')
      .select('id, title, status')
      .limit(5);
    
    console.log('Blog posts test result:', { blogPosts, blogPostsError });
    
    // Test 4: Check if media_assets table exists
    const { data: mediaAssets, error: mediaError } = await supabase
      .from('media_assets')
      .select('id, title, file_type')
      .limit(5);
    
    console.log('Media assets test result:', { mediaAssets, mediaError });

    return NextResponse.json({
      success: true,
      tests: {
        connection: {
          error: connectionError?.message,
          hasData: !!connectionTest
        },
        tables: {
          error: tablesError?.message,
          count: tables?.length || 0,
          data: tables
        },
        blogPosts: {
          error: blogPostsError?.message,
          count: blogPosts?.length || 0,
        },
        mediaAssets: {
          error: mediaError?.message,
          count: mediaAssets?.length || 0,
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 