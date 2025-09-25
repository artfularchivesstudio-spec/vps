// 🎼 **Custom Query Endpoint** - The melody maestro executing SQL symphonies
// Where your custom queries become beautiful data orchestrations

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Valid SQL query is required'
      }, { status: 400 });
    }

    // 🔒 Security check - prevent dangerous operations
    const dangerousPatterns = [
      /\bDROP\b/i,
      /\bDELETE\b/i,
      /\bUPDATE\b/i,
      /\bINSERT\b/i,
      /\bALTER\b/i,
      /\bCREATE\b/i,
      /\bTRUNCATE\b/i,
      /\bGRANT\b/i,
      /\bREVOKE\b/i,
      /\bEXECUTE\b/i
    ];

    const isDangerous = dangerousPatterns.some(pattern => pattern.test(query));
    if (isDangerous) {
      return NextResponse.json({
        success: false,
        error: 'This query contains potentially dangerous operations that are not allowed in the explorer'
      }, { status: 403 });
    }

    const supabase = createClient();

    // 🎭 Start the performance timer
    const startTime = Date.now();

    // 🎵 Execute the SQL query using Supabase's direct query capability
    try {
      const response = await supabase.rpc('run_sql_query', { query_text: query });
      const { data: rows, error: queryError } = response;
      const executionTime = Date.now() - startTime; // Always calculate executionTime

      if (queryError) {
        console.error('❌ SQL Query Error:', queryError);
        return NextResponse.json({
          success: false,
          error: queryError.message,
          details: queryError.details || queryError.hint,
          executionTime: Date.now() - startTime
        }, { status: 400 });
      }

      // 📊 Extract columns from the first row if data exists
      const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : [];

      return NextResponse.json({
        success: true,
        query,
        columns,
        rows,
        rowCount: rows.length,
        executionTime,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Database explorer query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Query execution failed',
        details: error.message,
        executionTime: Date.now() - startTime
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Database explorer query endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
