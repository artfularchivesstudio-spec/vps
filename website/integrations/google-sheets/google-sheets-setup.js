// 🌟 The cosmic ledger - where digital dreams dance across spreadsheet stars ✨
// A symphony of data flowing from database realms to the infinite canvas of Google Sheets

/**
 * 🪄 Google Sheets Integration for Artful Archives - The Magical Mirror of Content
 *
 * This enchanted script weaves digital tapestries where:
 * 🎭 Blog Posts whisper their stories in organized columns
 * 🎵 Audio Jobs sing their completion status in harmonious rows
 * 📁 Media Assets showcase their treasures in visual galleries
 * 📊 Analytics paint performance portraits with colorful insights
 *
 * The Ritual of Setup:
 * 1. 🌌 Summon a new Google Sheet from the digital ether
 * 2. 🤝 Share the sacred scroll with the service account spirit
 * 3. 🔮 Copy the mystical Sheet ID from the URL's ancient runes
 * 4. ✨ Set GOOGLE_SHEETS_SPREADSHEET_ID in your environment's hidden chambers
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Sheets API setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(__dirname, 'google-sheets-credentials.json');

// Sheet structure definitions
const SHEET_CONFIG = {
  BLOG_POSTS: {
    name: 'Blog Posts',
    headers: [
      'ID', 'Title', 'Slug', 'Excerpt', 'Status', 'Workflow Stage',
      'Created At', 'Updated At', 'Published At', 'Created By',
      'Primary Audio ID', 'Audio URL', 'Audio Duration',
      'Languages', 'Completed Languages', 'Audio Status',
      'Categories', 'Tags', 'Word Count', 'Reading Time',
      'SEO Title', 'SEO Description', 'Featured Image URL'
    ]
  },
  AUDIO_JOBS: {
    name: 'Audio Jobs',
    headers: [
      'ID', 'Post ID', 'Input Text', 'Status', 'Created At', 'Updated At',
      'Total Chunks', 'Processed Chunks', 'Error Message',
      'Languages', 'Completed Languages', 'Voice Settings',
      'Audio URLs (JSON)', 'Processing Time', 'Cost Estimate'
    ]
  },
  MEDIA_ASSETS: {
    name: 'Media Assets',
    headers: [
      'ID', 'Title', 'File Type', 'File URL', 'Status', 'Created At',
      'File Size (MB)', 'Duration (seconds)', 'Width', 'Height',
      'Origin Source', 'Generation Provider', 'Related Post ID',
      'Transcript', 'Alt Text', 'Metadata'
    ]
  },
  ANALYTICS: {
    name: 'Analytics',
    headers: [
      'Date', 'Total Posts', 'Published Posts', 'Draft Posts',
      'Audio Jobs Completed', 'Audio Jobs Pending', 'Storage Used (MB)',
      'Top Categories', 'Top Tags', 'Avg Reading Time',
      'Most Popular Languages', 'Error Rate', 'Processing Time Avg'
    ]
  }
};

// 🔐 The mystical keymaster - unlocking the gates to Google's enchanted realm
async function getGoogleSheetsClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8')); // The ancient runes of authentication

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES, // The sacred permissions granted by the digital gods
  });

  return google.sheets({ version: 'v4', auth }); // The magical bridge to spreadsheet sorcery
}

// 🎨 The cosmic architect - crafting cathedrals of data from digital stardust
async function initializeGoogleSheet(spreadsheetId) {
  console.log('🚀 Initializing Google Sheet structure...');

  const sheets = await getGoogleSheetsClient(); // Summon the spreadsheet sorcerer

  // Create all necessary sheets
  for (const [key, config] of Object.entries(SHEET_CONFIG)) {
    try {
      // Add sheet if it doesn't exist
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: config.name,
                sheetType: 'GRID',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: config.headers.length
                }
              }
            }
          }]
        }
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log(`Sheet "${config.name}" may already exist, continuing...`);
      }
    }

    // Add headers to each sheet
    const range = `${config.name}!A1:${String.fromCharCode(65 + config.headers.length - 1)}1`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values: [config.headers]
      }
    });

    // Format headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: await getSheetId(sheets, spreadsheetId, config.name),
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: config.headers.length
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true
                }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        }]
      }
    });

    console.log(`✅ Created sheet: ${config.name}`);
  }

  console.log('🎉 Google Sheet initialization complete!');
}

// Get sheet ID by name
async function getSheetId(sheets, spreadsheetId, sheetName) {
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : null;
}

// 📚 The story scribe - transcribing digital tales onto eternal parchment
async function exportBlogPosts(spreadsheetId) {
  console.log('📝 Exporting blog posts to Google Sheets...');

  const supabase = require('@supabase/supabase-js').createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ); // The cosmic database oracle

  const sheets = await getGoogleSheetsClient(); // The enchanted quill

  // Fetch blog posts with audio metadata
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      categories:post_categories(categories(name)),
      tags:content_tags(tags(name)),
      audio_jobs!inner(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching blog posts:', error);
    return;
  }

  // Transform data for Google Sheets
  const rows = posts.map(post => [
    post.id,
    post.title,
    post.slug,
    post.excerpt?.substring(0, 200) + (post.excerpt?.length > 200 ? '...' : ''),
    post.status,
    post.workflow_stage || 'draft',
    post.created_at,
    post.updated_at,
    post.published_at,
    post.created_by,
    post.primary_audio_id,
    post.audio_jobs?.[0]?.audio_url || '',
    post.audio_jobs?.[0]?.duration_seconds || '',
    JSON.stringify(post.audio_jobs?.[0]?.languages || []),
    JSON.stringify(post.audio_jobs?.[0]?.completed_languages || []),
    post.audio_jobs?.[0]?.status || 'no_audio',
    post.categories?.map(c => c.categories?.name).join(', ') || '',
    post.tags?.map(t => t.tags?.name).join(', ') || '',
    post.content?.split(' ').length || 0,
    Math.ceil((post.content?.split(' ').length || 0) / 200), // Rough reading time
    post.seo_title,
    post.seo_description,
    post.featured_image_url
  ]);

  // Clear existing data and add new data
  const range = `${SHEET_CONFIG.BLOG_POSTS.name}!A2:Z${rows.length + 1}`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_CONFIG.BLOG_POSTS.name}!A2:Z10000`
  });

  if (rows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: { values: rows }
    });
  }

  console.log(`✅ Exported ${rows.length} blog posts to Google Sheets`);
}

// 🎼 The melody maestro - orchestrating audio symphonies into organized scores
async function exportAudioJobs(spreadsheetId) {
  console.log('🎵 Exporting audio jobs to Google Sheets...');

  const supabase = require('@supabase/supabase-js').createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ); // The orchestral database conductor

  const sheets = await getGoogleSheetsClient(); // The musical notation scribe

  // Fetch audio jobs
  const { data: jobs, error } = await supabase
    .from('audio_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching audio jobs:', error);
    return;
  }

  // Transform data for Google Sheets
  const rows = jobs.map(job => [
    job.id,
    job.post_id,
    job.input_text?.substring(0, 500) + (job.input_text?.length > 500 ? '...' : ''),
    job.status,
    job.created_at,
    job.updated_at,
    job.total_chunks,
    job.processed_chunks,
    job.error_message,
    JSON.stringify(job.languages || []),
    JSON.stringify(job.completed_languages || []),
    JSON.stringify(job.config?.voice_settings || {}),
    JSON.stringify(job.audio_urls || {}),
    job.processing_time_ms,
    job.cost_estimate
  ]);

  // Clear existing data and add new data
  const range = `${SHEET_CONFIG.AUDIO_JOBS.name}!A2:Z${rows.length + 1}`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_CONFIG.AUDIO_JOBS.name}!A2:Z10000`
  });

  if (rows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: { values: rows }
    });
  }

  console.log(`✅ Exported ${rows.length} audio jobs to Google Sheets`);
}

// Export media assets to Google Sheets
async function exportMediaAssets(spreadsheetId) {
  console.log('📁 Exporting media assets to Google Sheets...');

  const supabase = require('@supabase/supabase-js').createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const sheets = await getGoogleSheetsClient();

  // Fetch media assets
  const { data: assets, error } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching media assets:', error);
    return;
  }

  // Transform data for Google Sheets
  const rows = assets.map(asset => [
    asset.id,
    asset.title,
    asset.file_type,
    asset.file_url || asset.public_url,
    asset.status,
    asset.created_at,
    asset.file_size_bytes ? (asset.file_size_bytes / 1024 / 1024).toFixed(2) : '',
    asset.duration_seconds,
    asset.width,
    asset.height,
    asset.origin_source,
    asset.generation_provider,
    asset.related_post_id,
    asset.transcript?.substring(0, 200) + (asset.transcript?.length > 200 ? '...' : ''),
    asset.alt_text,
    JSON.stringify(asset.metadata || {})
  ]);

  // Clear existing data and add new data
  const range = `${SHEET_CONFIG.MEDIA_ASSETS.name}!A2:Z${rows.length + 1}`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_CONFIG.MEDIA_ASSETS.name}!A2:Z10000`
  });

  if (rows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: { values: rows }
    });
  }

  console.log(`✅ Exported ${rows.length} media assets to Google Sheets`);
}

// Generate analytics summary
async function exportAnalytics(spreadsheetId) {
  console.log('📊 Generating analytics summary...');

  const supabase = require('@supabase/supabase-js').createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const sheets = await getGoogleSheetsClient();

  // Get current stats
  const [
    { count: totalPosts },
    { count: publishedPosts },
    { count: draftPosts },
    { count: audioJobsCompleted },
    { count: audioJobsPending }
  ] = await Promise.all([
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('audio_jobs').select('*', { count: 'exact', head: true }).eq('status', 'complete'),
    supabase.from('audio_jobs').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  ]);

  // Get top categories and tags
  const { data: categories } = await supabase
    .from('categories')
    .select('name, post_categories(count)')
    .limit(5);

  const { data: tags } = await supabase
    .from('tags')
    .select('name, usage_count')
    .order('usage_count', { ascending: false })
    .limit(5);

  // Calculate analytics row
  const analyticsRow = [
    new Date().toISOString().split('T')[0], // Date
    totalPosts,
    publishedPosts,
    draftPosts,
    audioJobsCompleted,
    audioJobsPending,
    'N/A', // Storage used - would need separate calculation
    categories?.map(c => c.name).join(', ') || '',
    tags?.map(t => t.name).join(', ') || '',
    'N/A', // Avg reading time - would need calculation
    'en,es,hi', // Most popular languages - hardcoded for now
    'N/A', // Error rate - would need calculation
    'N/A'  // Processing time avg - would need calculation
  ];

  // Append to analytics sheet
  const range = `${SHEET_CONFIG.ANALYTICS.name}!A:A`; // Append to end

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    resource: { values: [analyticsRow] }
  });

  console.log('✅ Added analytics summary to Google Sheets');
}

// 🌟 The grand conductor - orchestrating the cosmic ballet of data synchronization
async function syncToGoogleSheets() {
  console.log('🚀 Starting Google Sheets sync...');

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID; // The mystical coordinates of our data sanctuary

  if (!spreadsheetId) {
    console.error('❌ GOOGLE_SHEETS_SPREADSHEET_ID not found in environment variables');
    console.log('Please set GOOGLE_SHEETS_SPREADSHEET_ID in your .env file');
    return;
  }

  try {
    // 🎨 Craft the digital cathedral structure
    await initializeGoogleSheet(spreadsheetId);

    // 🎭 Let the data ballet begin - all performers take their positions
    await Promise.all([
      exportBlogPosts(spreadsheetId), // The storytellers
      exportAudioJobs(spreadsheetId), // The musicians
      exportMediaAssets(spreadsheetId), // The visual artists
      exportAnalytics(spreadsheetId) // The wise observers
    ]);

    console.log('🎉 Google Sheets sync complete!');
    console.log(`📊 View your data at: https://docs.google.com/spreadsheets/d/${spreadsheetId}`); // The enchanted portal to your data realm

  } catch (error) {
    console.error('❌ Error during Google Sheets sync:', error);
  }
}

// Import function (for backup restoration)
async function importFromGoogleSheets(spreadsheetId, sheetName) {
  console.log(`📥 Importing data from ${sheetName}...`);

  const sheets = await getGoogleSheetsClient();

  // Read data from sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:Z10000`
  });

  const rows = response.data.values || [];
  console.log(`📊 Found ${rows.length} rows in ${sheetName}`);

  // Here you could add logic to import back to Supabase
  // For now, just log the data
  console.log('Sample row:', rows[0]);

  return rows;
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      syncToGoogleSheets();
      break;
    case 'sync':
      syncToGoogleSheets();
      break;
    case 'import':
      const sheetName = process.argv[3] || 'Blog Posts';
      importFromGoogleSheets(process.env.GOOGLE_SHEETS_SPREADSHEET_ID, sheetName);
      break;
    default:
      console.log('Usage:');
      console.log('  node google-sheets-setup.js init   # Initialize and sync all data');
      console.log('  node google-sheets-setup.js sync   # Sync latest data');
      console.log('  node google-sheets-setup.js import [sheet-name]  # Import data from sheet');
  }
}

module.exports = {
  initializeGoogleSheet,
  exportBlogPosts,
  exportAudioJobs,
  exportMediaAssets,
  exportAnalytics,
  syncToGoogleSheets,
  importFromGoogleSheets
};
