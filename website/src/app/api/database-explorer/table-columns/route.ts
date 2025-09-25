// 🔧 **Table Columns Endpoint** - The column healer revealing schema secrets
// Where database structure becomes a beautiful architectural blueprint

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');

    if (!tableName) {
      return NextResponse.json({
        success: false,
        error: 'Table name is required'
      }, { status: 400 });
    }

    const supabase = createClient();

    // 🎭 Query the database schema for column information
    console.log('🔄 Querying column information for table:', tableName);

    // First, try to get column info by querying the table with limit 0 (just schema)
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Database explorer columns error:', sampleError);
      return NextResponse.json({
        success: false,
        error: `Failed to fetch columns for table '${tableName}'`,
        details: sampleError.message
      }, { status: 500 });
    }

    // Extract column information from the sample data
    const columns = sampleData && sampleData.length > 0
      ? Object.keys(sampleData[0]).map(col => ({
          column_name: col,
          data_type: 'text', // We can't easily determine exact types without system access
          is_nullable: true, // Default assumption
          column_default: null
        }))
      : [];

    // 🎨 Transform the column data into our artistic format
    const transformedColumns = columns?.map((col: any) => ({
      column_name: col.column_name,
      data_type: col.data_type,
      is_nullable: col.is_nullable,
      column_default: col.column_default
    })) || [];

    return NextResponse.json({
      success: true,
      table: tableName,
      columns: transformedColumns,
      count: transformedColumns.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Database explorer columns endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
