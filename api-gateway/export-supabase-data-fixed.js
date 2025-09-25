#!/usr/bin/env node

// 🌟 Supabase Data Export Script - From Supabase to Strapi Migration ✨
// 🎭 The Spellbinding Museum Director's Data Export Ritual

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 🔮 Configuration for the mystical data export
const CONFIG = {
  // Database connection
  DB_CONFIG: {
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.tjkpliasdjpgunbhsiza',
    password: '6o10Rau52Hr3Qwds',
    ssl: { rejectUnauthorized: false }
  },

  // Export settings
  OUTPUT_DIR: path.join(__dirname, 'supabase-export'),
  TABLES: {
    blog_posts: 'blog_posts',
    categories: 'categories',
    tags: 'tags',
    post_categories: 'post_categories',
    content_tags: 'content_tags'
  }
};

// 🎪 Database connection helper
async function connectToDatabase() {
  const client = new Client(CONFIG.DB_CONFIG);

  try {
    console.log('🔮 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Database connection established');
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    throw error;
  }
}

// 📊 Export table data with relationships
async function exportTableData(client, tableName, query, filename) {
  try {
    console.log(`📊 Exporting ${tableName}...`);

    const result = await client.query(query);
    const data = result.rows;

    console.log(`✅ Exported ${data.length} records from ${tableName}`);

    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }

    // Save to JSON file
    const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`💾 Saved ${tableName} data to ${outputPath}`);
    return data;

  } catch (error) {
    console.error(`❌ Failed to export ${tableName}:`, error.message);
    throw error;
  }
}

// 🎭 Main export function
async function exportAllData() {
  let client;

  try {
    console.log('🌟 Starting the mystical data export ritual...');
    client = await connectToDatabase();

    const exportData = {};

    // 📝 Export blog posts with all their rich data
    const blogPostsQuery = `
      SELECT
        bp.*,
        json_build_object(
          'id', ap.id,
          'email', ap.email,
          'full_name', ap.full_name,
          'avatar_url', ap.avatar_url
        ) as author_profile
      FROM blog_posts bp
      LEFT JOIN admin_profiles ap ON bp.created_by = ap.id
      ORDER BY bp.created_at DESC
    `;

    exportData.blog_posts = await exportTableData(
      client,
      'blog_posts',
      blogPostsQuery,
      'blog-posts.json'
    );

    // 🏷️ Export categories with hierarchy
    const categoriesQuery = `
      SELECT
        c.*,
        CASE
          WHEN c.parent_id IS NULL THEN NULL
          ELSE json_build_object(
            'id', p.id,
            'name', p.name,
            'slug', p.slug
          )
        END as parent_category
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.sort_order NULLS LAST, c.name
    `;

    exportData.categories = await exportTableData(
      client,
      'categories',
      categoriesQuery,
      'categories.json'
    );

    // 🏷️ Export tags
    exportData.tags = await exportTableData(
      client,
      'tags',
      'SELECT * FROM tags ORDER BY name',
      'tags.json'
    );

    // 🔗 Export post-category relationships
    exportData.post_categories = await exportTableData(
      client,
      'post_categories',
      'SELECT * FROM post_categories ORDER BY blog_post_id, category_id',
      'post-categories.json'
    );

    // 🔗 Export content-tag relationships
    exportData.content_tags = await exportTableData(
      client,
      'content_tags',
      'SELECT * FROM content_tags ORDER BY content_id, tag_id',
      'content-tags.json'
    );

    // 📋 Create export summary
    const summary = {
      export_timestamp: new Date().toISOString(),
      record_counts: {
        blog_posts: exportData.blog_posts.length,
        categories: exportData.categories.length,
        tags: exportData.tags.length,
        post_categories: exportData.post_categories.length,
        content_tags: exportData.content_tags.length
      },
      data_files: [
        'blog-posts.json',
        'categories.json',
        'tags.json',
        'post-categories.json',
        'content-tags.json'
      ]
    };

    // Save summary
    const summaryPath = path.join(CONFIG.OUTPUT_DIR, 'export-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📋 Export summary saved to ${summaryPath}`);

    // Save complete export bundle
    const completeExportPath = path.join(CONFIG.OUTPUT_DIR, 'complete-export.json');
    fs.writeFileSync(completeExportPath, JSON.stringify(exportData, null, 2));
    console.log(`🎉 Complete export bundle saved to ${completeExportPath}`);

    console.log('\n🎉 Data export completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Blog Posts: ${exportData.blog_posts.length}`);
    console.log(`   • Categories: ${exportData.categories.length}`);
    console.log(`   • Tags: ${exportData.tags.length}`);
    console.log(`   • Post-Category Relations: ${exportData.post_categories.length}`);
    console.log(`   • Content-Tag Relations: ${exportData.content_tags.length}`);

    return exportData;

  } catch (error) {
    console.error('💥 Export failed:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// 🚀 Run the export if this script is executed directly
if (require.main === module) {
  exportAllData().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  exportAllData,
  CONFIG
};