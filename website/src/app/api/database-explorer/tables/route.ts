// 🌌 **Tables Endpoint** - The cosmic librarian revealing database structure
// Where every table becomes a story waiting to be explored

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // 🎭 The grand revelation - fetch all available tables and views
    const { data: tables, error } = await supabase.rpc('get_table_list');

    if (error) {
      console.error('❌ Database explorer tables error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch database tables',
        details: error.message
      }, { status: 500 });
    }

    // 🎨 Transform the data into our artistic format
    const transformedTables = tables?.map((table: any) => ({
      table_name: table.table_name,
      table_type: table.table_type,
      schema_name: table.schema_name
    })) || [];

    return NextResponse.json({
      success: true,
      tables: transformedTables,
      count: transformedTables.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Database explorer tables endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
