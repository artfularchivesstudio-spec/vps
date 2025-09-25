// 🔍 **Global Search Endpoint** - The cosmic seeker revealing hidden treasures across all realms
// Where your search becomes a journey through the entire database universe

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      }, { status: 400 });
    }

    const supabase = createClient();

    // 🎭 Get all tables first
    const { data: tables } = await supabase.rpc('get_table_list');
    const publicTables = tables?.filter((table: any) => table.schema_name === 'public') || [];

    const searchResults = {
      query,
      totalResults: 0,
      results: [] as any[],
      tablesSearched: publicTables.length,
      executionTime: 0
    };

    const startTime = Date.now();

    // 🔍 Search across each table
    for (const table of publicTables.slice(0, 10)) { // Limit to first 10 tables for performance
      try {
        // Get table structure first
        const { data: sampleData } = await supabase
          .from(table.table_name)
          .select('*')
          .limit(1);

        if (!sampleData || sampleData.length === 0) continue;

        const columns = Object.keys(sampleData[0]);

        // Search for text columns
        const textColumns = columns.filter(col =>
          col.toLowerCase().includes('name') ||
          col.toLowerCase().includes('title') ||
          col.toLowerCase().includes('content') ||
          col.toLowerCase().includes('description') ||
          col.toLowerCase().includes('text') ||
          col.toLowerCase().includes('email')
        );

        if (textColumns.length === 0) continue;

        // Perform search on text columns
        let searchQuery = supabase
          .from(table.table_name)
          .select('*')
          .limit(Math.min(limit, 10)); // Limit results per table

        // Build OR conditions for text search
        const searchConditions = textColumns.map(col => `${col}.ilike.%${query}%`);
        if (searchConditions.length > 0) {
          searchQuery = searchQuery.or(searchConditions.join(','));
        }

        const { data: tableResults, error } = await searchQuery;

        if (error) continue;

        if (tableResults && tableResults.length > 0) {
          searchResults.results.push({
            table: table.table_name,
            matches: tableResults.length,
            columns: textColumns,
            data: tableResults.slice(0, 5), // Limit preview results
            totalInTable: tableResults.length
          });
          searchResults.totalResults += tableResults.length;
        }

      } catch (error) {
        // Skip tables that can't be searched
        console.log(`Skipping table ${table.table_name}:`, error);
      }
    }

    searchResults.executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      search: searchResults,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Global search endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
