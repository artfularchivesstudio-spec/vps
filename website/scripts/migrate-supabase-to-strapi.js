const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrateData() {
  // Supabase client for export
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Strapi API endpoint (adjust URL as needed)
  const strapiUrl = 'http://localhost:1337/api';
  const strapiToken = process.env.STRAPI_ADMIN_TOKEN; // Set this in .env

  console.log('Starting migration from Supabase to Strapi...');

  // 1. Export and migrate blog posts
  console.log('Migrating blog posts...');
  const { data: posts, error: postError } = await supabase
    .from('blog_posts')
    .select('*');

  if (postError) {
    console.error('Error fetching blog posts:', postError);
    return;
  }

  for (const post of posts) {
    const legacyPost = {
      ...post,
      legacy_import: true,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    };

    // Delete legacy fields if needed
    delete legacyPost.created_at;
    delete legacyPost.updated_at;

    try {
      const response = await axios.post(`${strapiUrl}/articles`, {
        data: legacyPost
      }, {
        headers: {
          Authorization: `Bearer ${strapiToken}`
        }
      });

      if (response.status === 200) {
        console.log(`Migrated post: ${post.title}`);
      } else {
        console.error(`Failed to migrate post: ${post.title}`, response.status);
      }
    } catch (error) {
      console.error(`Error migrating post: ${post.title}`, error.response?.data || error.message);
    }
  }

  // 2. Export and migrate media assets (images/audio)
  console.log('Migrating media assets...');
  const { data: media, error: mediaError } = await supabase
    .from('media_assets')
    .select('*');

  if (mediaError) {
    console.error('Error fetching media assets:', mediaError);
    return;
  }

  for (const asset of media) {
    const legacyAsset = {
      ...asset,
      legacy_import: true,
      file_url: asset.url,
      mime_type: asset.mime_type,
      size: asset.size
    };

    try {
      const response = await axios.post(`${strapiUrl}/upload`, {
        data: legacyAsset
      }, {
        headers: {
          Authorization: `Bearer ${strapiToken}`
        }
      });

      if (response.status === 200) {
        console.log(`Migrated asset: ${asset.name}`);
      } else {
        console.error(`Failed to migrate asset: ${asset.name}`, response.status);
      }
    } catch (error) {
      console.error(`Error migrating asset: ${asset.name}`, error.response?.data || error.message);
    }
  }

  // 3. Export and migrate audio jobs (if applicable)
  console.log('Migrating audio jobs...');
  const { data: audioJobs, error: audioError } = await supabase
    .from('audio_jobs')
    .select('*');

  if (audioError) {
    console.error('Error fetching audio jobs:', audioError);
    return;
  }

  for (const job of audioJobs) {
    const legacyJob = {
      ...job,
      legacy_import: true,
      audio_url: job.audio_url,
      status: job.status,
      language: job.language
    };

    try {
      const response = await axios.post(`${strapiUrl}/audio-jobs`, {
        data: legacyJob
      }, {
        headers: {
          Authorization: `Bearer ${strapiToken}`
        }
      });

      if (response.status === 200) {
        console.log(`Migrated audio job: ${job.id}`);
      } else {
        console.error(`Failed to migrate audio job: ${job.id}`, response.status);
      }
    } catch (error) {
      console.error(`Error migrating audio job: ${job.id}`, error.response?.data || error.message);
    }
  }

  console.log('Migration completed!');
}

// Run the migration
migrateData().catch(console.error);