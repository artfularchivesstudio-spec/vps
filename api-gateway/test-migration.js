const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Import the migration functions
const { transformAudioJobToArticle, createStrapiEntry, retryFetch, checkStrapiReady } = require('./migrate-data');

async function testMigration() {
  const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
  const authToken = process.env.STRAPI_API_TOKEN;

  if (!authToken) {
    console.error('STRAPI_API_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    console.log('🧪 Starting test migration with first 3 posts...');

    // Check if Strapi is ready
    await checkStrapiReady(strapiUrl);

    // Load blog posts data
    const blogPostsData = JSON.parse(fs.readFileSync('./supabase-export/blog-posts.json', 'utf8'));
    console.log(`📊 Loaded ${blogPostsData.length} blog posts from export`);

    // Take only first 3 posts for testing
    const testPosts = blogPostsData.slice(0, 3);
    console.log(`🧪 Testing with ${testPosts.length} posts`);

    let successCount = 0;
    let errorCount = 0;

    for (const blogPost of testPosts) {
      try {
        console.log(`\n🔄 Processing test post: ${blogPost.title}`);

        // Create base entry (English/default locale)
        const transformFn = transformAudioJobToArticle(blogPost, strapiUrl, authToken);
        const baseEntryData = await transformFn();

        console.log(`📤 Sending data to Strapi:`, JSON.stringify(baseEntryData, null, 2));

        const createResponse = await retryFetch(`${strapiUrl}/api/blog-posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(baseEntryData),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error(`❌ Failed to create blog post "${blogPost.title}": ${createResponse.status} - ${errorText}`);
          errorCount++;
          continue;
        }

        const createdEntry = await createResponse.json();
        console.log(`✅ Created base entry for: ${blogPost.title} (ID: ${createdEntry.data.id})`);

        // Handle translations if present
        const translations = [];
        if (blogPost.content_translations && Object.keys(blogPost.content_translations).length > 0) {
          console.log(`🌐 Processing translations for: ${blogPost.title}`);
          for (const [locale, translatedContent] of Object.entries(blogPost.content_translations)) {
            if (locale !== 'en' && translatedContent) {
              const localizedData = {
                title: blogPost.title_translations?.[locale] || blogPost.title,
                content: translatedContent,
                excerpt: blogPost.excerpt_translations?.[locale] || blogPost.excerpt,
              };

              console.log(`📤 Creating ${locale} translation...`);
              const localizedEntry = await retryFetch(`${strapiUrl}/api/blog-posts/${createdEntry.data.id}/localizations`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  locale,
                  ...localizedData
                }),
              });

              if (localizedEntry.ok) {
                translations.push(locale);
                console.log(`✅ Created ${locale} translation`);
              } else {
                const errorText = await localizedEntry.text();
                console.warn(`⚠️ Failed to create ${locale} translation: ${localizedEntry.status} - ${errorText}`);
              }
            }
          }
        }

        if (translations.length > 0) {
          console.log(`🎉 Created translations for ${blogPost.title}: ${translations.join(', ')}`);
        }

        successCount++;
      } catch (error) {
        console.error(`❌ Error processing blog post "${blogPost.title}": ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Test migration completed:`);
    console.log(`- ✅ Successfully migrated: ${successCount} posts`);
    console.log(`- ❌ Errors: ${errorCount} posts`);

    if (successCount > 0) {
      console.log(`\n🎯 Test successful! The migration script is working correctly.`);
      console.log(`💡 You can now run the full migration with: node migrate-data.js`);
    }

  } catch (error) {
    console.error('💥 Test migration failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testMigration();
}