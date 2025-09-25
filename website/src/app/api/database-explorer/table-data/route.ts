// 📊 **Table Data Endpoint** - The story scribe revealing table contents
// Where database rows become living narratives in our digital canvas

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tableName) {
      return NextResponse.json({
        success: false,
        error: 'Table name is required'
      }, { status: 400 });
    }

    const supabase = createClient();

    // 🎭 Start the performance timer
    const startTime = Date.now();

    // 📚 The grand curator - fetch table data with pagination
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .range(offset, offset + Math.min(limit, 1000) - 1) // Supabase uses range for pagination
      .limit(Math.min(limit, 1000)); // Safety limit

    const executionTime = Date.now() - startTime;

    if (error) {
      console.error('❌ Database explorer table data error:', error);
      return NextResponse.json({
        success: false,
        error: `Failed to fetch data from table '${tableName}'`,
        details: error.message
      }, { status: 500 });
    }

    // 🎨 Transform data into our artistic format
    const rows = data || [];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return NextResponse.json({
      success: true,
      table: tableName,
      columns,
      rows,
      rowCount: rows.length,
      totalCount: count,
      executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Database explorer table data endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
