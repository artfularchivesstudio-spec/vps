// 📊 **Database Statistics Endpoint** - The cosmic metrics revealing database health
// Where numbers become narratives and data tells beautiful stories

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface DatabaseStatistics {
  database: {
    total_tables: number;
    estimated_total_rows: number;
  };
  tables: TableStatistics[]; // Array of table statistics
  storage: {
    bucket_count?: number;
    buckets?: Array<{
      name: string;
      file_count?: number;
      total_size?: number;
      public?: boolean;
      error?: string;
    }>;
  };
  performance: {
    timestamp: string;
    response_time_ms?: number;
    status?: string;
  };
}

// 🎭 Interface for individual table statistics
interface TableStatistics {
  name: string;
  row_count: number;
  column_count: number;
  columns: string[];
  has_data: boolean;
  error?: string; // Optional error field for tables that failed to fetch
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    const supabase = createClient();
    const stats: DatabaseStatistics = {
      database: {
        total_tables: 0,
        estimated_total_rows: 0
      },
      tables: [],
      storage: {},
      performance: {
        timestamp: new Date().toISOString()
      }
    };

    let tablesData: any[] | null = null; // Declare tablesData here

    // 🎭 Database-level statistics
    try {
      // Get total table count
      const { data } = await supabase.rpc('get_table_list');
      tablesData = data; // Assign data to the declared variable
      stats.database.total_tables = tablesData?.length || 0;

      // Get total row count across all tables (sample)
      let totalRows = 0;
      const sampleTables = ['blog_posts', 'audio_jobs', 'media_assets', 'users'];
      for (const tableName of sampleTables) {
        try {
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          totalRows += count || 0;
        } catch (e) {
          // Table might not exist or be accessible, skip
        }
      }
      stats.database.estimated_total_rows = totalRows;

    } catch (error) {
      console.log('Database stats partially unavailable:', error);
    }

    // 📊 Table-specific statistics
    if (table) {
      try {
        const { count: rowCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        const { data: sampleData } = await supabase
          .from(table)
          .select('*')
          .limit(10);

        const columns = sampleData && sampleData.length > 0
          ? Object.keys(sampleData[0])
          : [];

        stats.tables.push({
          name: table,
          row_count: rowCount || 0,
          column_count: columns.length,
          columns: columns,
          has_data: (rowCount || 0) > 0
        });

      } catch (error) {
        console.error(`Error getting stats for table ${table}:`, error);
        stats.tables.push({
          name: table,
          row_count: 0,
          column_count: 0,
          columns: [],
          has_data: false,
          error: 'Unable to fetch statistics'
        });
      }
    } else {
      // If no specific table is requested, fetch stats for all tables
      const allTables = tablesData?.map((t: any) => t.table_name) || [];

      for (const tableName of allTables) {
        try {
          const { count: rowCount } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          const { data: sampleData } = await supabase
            .from(tableName)
            .select('*')
            .limit(10);

          const columns = sampleData && sampleData.length > 0
            ? Object.keys(sampleData[0])
            : [];

          stats.tables.push({
            name: tableName,
            row_count: rowCount || 0,
            column_count: columns.length,
            columns: columns,
            has_data: (rowCount || 0) > 0
          });

        } catch (error) {
          console.error(`Error getting stats for table ${tableName}:`, error);
          stats.tables.push({
            name: tableName,
            row_count: 0,
            column_count: 0,
            columns: [],
            has_data: false,
            error: 'Unable to fetch statistics'
          });
        }
      }
    }

    // 🎨 Storage statistics
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      stats.storage.bucket_count = buckets?.length || 0;

      // Get file counts for each bucket
      const bucketStats = [];
      for (const bucket of buckets || []) {
        try {
          const { data: files } = await supabase.storage
            .from(bucket.name)
            .list('', { limit: 1000 });

          const totalSize = files?.reduce((sum, file) =>
            sum + (file.metadata?.size || 0), 0) || 0;

          bucketStats.push({
            name: bucket.name,
            file_count: files?.length || 0,
            total_size: totalSize,
            public: bucket.public
          });
        } catch (e) {
          bucketStats.push({
            name: bucket.name,
            error: 'Unable to access bucket'
          });
        }
      }
      stats.storage.buckets = bucketStats;

    } catch (error) {
      console.log('Storage stats unavailable:', error);
    }

    // ⚡ Performance metrics (basic)
    // These are placeholders and could be expanded with actual performance data
    // from observability tools
    stats.performance = {
      timestamp: new Date().toISOString(),
      // Example: response_time_ms: 123,
      // Example: status: 'operational'
    };

    return NextResponse.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Statistics endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}