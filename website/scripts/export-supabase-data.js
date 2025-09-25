const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function exportSupabaseData() {
  // Load environment variables
  require('dotenv').config();
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🎭 Starting Supabase data export for Strapi migration...');
  
  // Create export directory
  const exportDir = path.join(__dirname, '..', 'backups', `supabase-export-${new Date().toISOString().split('T')[0]}`);
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  console.log(`📁 Export directory: ${exportDir}`);
  
  // Tables to export
  const tables = [
    'blog_posts',
    'media_assets', 
    'audio_jobs',
    'categories',
    'tags',
    'post_categories',
    'content_tags'
  ];
  
  const exportedData = {};
  
  for (const table of tables) {
    console.log(`📊 Exporting table: ${table}`);
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');
        
      if (error) {
        console.error(`❌ Error exporting ${table}:`, error.message);
        continue;
      }
      
      exportedData[table] = data || [];
      
      // Save to JSON file
      const jsonPath = path.join(exportDir, `${table}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
      
      console.log(`✅ Exported ${data?.length || 0} records from ${table}`);
      
    } catch (error) {
      console.error(`❌ Failed to export ${table}:`, error.message);
    }
  }
  
  // Create summary
  const summary = {
    export_timestamp: new Date().toISOString(),
    supabase_url: supabaseUrl,
    tables_exported: Object.keys(exportedData),
    record_counts: Object.fromEntries(
      Object.entries(exportedData).map(([table, data]) => [table, data.length])
    ),
    export_directory: exportDir,
    total_records: Object.values(exportedData).reduce((sum, data) => sum + data.length, 0)
  };
  
  const summaryPath = path.join(exportDir, 'export-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n🎭 Export Summary:');
  console.log(`📊 Total tables: ${summary.tables_exported.length}`);
  console.log(`📈 Total records: ${summary.total_records}`);
  console.log(`📁 Export location: ${exportDir}`);
  
  console.log('\n📋 Table breakdown:');
  Object.entries(summary.record_counts).forEach(([table, count]) => {
    console.log(`  ${table}: ${count} records`);
  });
  
  console.log('\n✨ Export completed successfully!');
  console.log('🎭 Ready for Strapi migration!');
}

exportSupabaseData().catch(console.error);
