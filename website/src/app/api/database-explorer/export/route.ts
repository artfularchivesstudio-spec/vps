// 🎭 **Database Export API** - The Digital Archival Symphony ✨
// Where databases transform into portable treasures and data becomes legacy

import { setExportStatus } from '@/lib/database-export/export-state';
import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface ExportOptions {
  includeData: boolean;
  includeSchema: boolean;
  selectedTables?: string[];
}

interface ExportRequest {
  exportId: string;
  format: 'sql' | 'json' | 'csv';
  options?: ExportOptions;
}

// 🎭 Interface for column information from information_schema.columns
interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
}

// 🎼 Store active export jobs in memory (in production, use Redis or database)
// const activeExports = new Map<string, {
//   progress: number;
//   status: string;
//   completed: boolean;
//   error?: string;
//   downloadUrl?: string;
//   size?: string;
// }>();

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { exportId, format, options = { includeData: true, includeSchema: true } } = body;

    // 🎨 Initialize the export job
    setExportStatus(exportId, {
      progress: 0,
      status: 'Initializing export...',
      completed: false
    });

    // 🎭 Start the export process asynchronously
    processExport(exportId, format, options).catch(error => {
      console.error('Export process error:', error);
      setExportStatus(exportId, {
        progress: 0,
        status: 'Export failed',
        completed: true,
        error: error.message
      });
    });

    return NextResponse.json({
      success: true,
      exportId,
      message: 'Export job created successfully'
    });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to create export job' },
      { status: 500 }
    );
  }
}

// 🎪 The main export processing function - Where data becomes art
async function processExport(exportId: string, format: string, options: ExportOptions = { includeData: true, includeSchema: true }) {
  const supabase = createServiceClient();
  
  try {
    // 🎯 Update progress: Analyzing database
    setExportStatus(exportId, {
      progress: 20,
      status: 'Analyzing database structure...',
      completed: false
    });

    // 🎼 Get all tables if none specified
    let tablesToExport = options?.selectedTables;
    if (!tablesToExport || tablesToExport.length === 0) {
      const { data: tables, error } = await supabase
        .rpc('get_table_list');

      if (error) throw error;
      tablesToExport = tables?.map((t: { table_name: string }) => t.table_name) || [];
    }

    setExportStatus(exportId, {
      progress: 40,
      status: `Found ${tablesToExport?.length || 0} tables to export...`,
      completed: false
    });

    let exportContent = '';
    let exportSize = 0;

    // 🎭 Generate export based on format
    switch (format) {
      case 'sql':
        exportContent = await generateSQLExport(supabase, tablesToExport || [], options, exportId);
        break;
      case 'json':
        exportContent = await generateJSONExport(supabase, tablesToExport || [], options, exportId);
        break;
      case 'csv':
        exportContent = await generateCSVExport(supabase, tablesToExport || [], options, exportId);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    exportSize = new Blob([exportContent]).size;
    const sizeFormatted = formatFileSize(exportSize);

    // 🎨 Create download URL (in production, upload to storage)
    const blob = new Blob([exportContent], { 
      type: format === 'json' ? 'application/json' : 'text/plain' 
    });
    const downloadUrl = URL.createObjectURL(blob);

    // 🎉 Mark export as completed
    setExportStatus(exportId, {
      progress: 100,
      status: 'Export completed successfully!',
      completed: true,
      downloadUrl,
      size: sizeFormatted
    });

  } catch (error) {
    console.error('Export processing error:', error);
    setExportStatus(exportId, {
      progress: 0,
      status: 'Export failed',
      completed: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 🎼 Generate SQL export - The database symphony in SQL format
async function generateSQLExport(supabase: any, tables: string[], options: ExportOptions, exportId: string): Promise<string> {
  let sqlContent = `-- 🎭 Artful Archives Database Export\n-- Generated: ${new Date().toISOString()}\n-- Format: SQL\n\n`;
  
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const progress = 50 + (i / tables.length) * 40;
    
    setExportStatus(exportId, {
      progress,
      status: `Exporting table: ${table}...`,
      completed: false
    });

    if (options.includeSchema) {
      // 🎨 Get table schema (use raw SQL for better compatibility)
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', table)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (columns && columns.length > 0) {
        sqlContent += `\n-- Table: ${table}\n`;
        sqlContent += `CREATE TABLE IF NOT EXISTS "${table}" (\n`;
        
        const columnDefs = columns.map((col: ColumnInfo) => {
          let def = `  "${col.column_name}" ${col.data_type}`;
          if (!col.is_nullable) def += ' NOT NULL';
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          return def;
        });
        
        sqlContent += columnDefs.join(',\n');
        sqlContent += '\n);\n';
      }
    }

    if (options.includeData) {
      // 🎪 Export table data
      const { data: rows } = await supabase
        .from(table)
        .select('*')
        .limit(10000); // Limit for safety

      if (rows && rows.length > 0) {
        const columns = Object.keys(rows[0]);
        sqlContent += `\n-- Data for table: ${table}\n`;
        
        for (const row of rows) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            return String(val);
          });
          
          sqlContent += `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      }
    }
  }

  return sqlContent;
}

// 🎨 Generate JSON export - The data as structured art
async function generateJSONExport(supabase: any, tables: string[], options: ExportOptions, exportId: string): Promise<string> {
  const exportData: any = {
    metadata: {
      exportDate: new Date().toISOString(),
      format: 'json',
      includeSchema: options.includeSchema,
      includeData: options.includeData,
      tables: tables.length
    },
    database: {}
  };

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const progress = 50 + (i / tables.length) * 40;
    
    setExportStatus(exportId, {
      progress,
      status: `Exporting table: ${table}...`,
      completed: false
    });

    exportData.database[table] = {};

    if (options.includeSchema) {
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', table)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      exportData.database[table].schema = columns || [];
    }

    if (options.includeData) {
      const { data: rows } = await supabase
        .from(table)
        .select('*')
        .limit(10000);

      exportData.database[table].data = rows || [];
    }
  }

  return JSON.stringify(exportData, null, 2);
}

// 🎪 Generate CSV export - The data in tabular harmony
async function generateCSVExport(supabase: any, tables: string[], options: ExportOptions, exportId: string): Promise<string> {
  let csvContent = '';

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const progress = 50 + (i / tables.length) * 40;
    
    setExportStatus(exportId, {
      progress,
      status: `Exporting table: ${table}...`,
      completed: false
    });

    const { data: rows } = await supabase
      .from(table)
      .select('*')
      .limit(10000);

    if (rows && rows.length > 0) {
      csvContent += `\n# Table: ${table}\n`;
      
      // 🎭 Headers
      const headers = Object.keys(rows[0]);
      csvContent += headers.join(',') + '\n';
      
      // 🎨 Data rows
      for (const row of rows) {
        const values = headers.map(header => {
          const val = row[header];
          if (val === null) return '';
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return String(val);
        });
        csvContent += values.join(',') + '\n';
      }
    }
  }

  return csvContent;
}

// 🎼 Helper function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 🎭 Export the active exports for status checking
// export { activeExports };
