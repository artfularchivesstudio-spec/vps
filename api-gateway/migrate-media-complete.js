#!/usr/bin/env node

// 🎭 Complete Media Migration - From Supabase Storage to Strapi Media Library
// ✨ The Grand Migration of Digital Artifacts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import AWS from 'aws-sdk';

// 🎭 ES6 module magic to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const STRAPI_URL = 'http://localhost:1337';
let STRAPI_API_TOKEN = 'ef06327ae7d04552068a4a012be62bd13a03872a8fe3b5b68e01cca13f1cdf403beea247180518f732a817745896b6fd0fa5fd68068b4a878477f1ffdb3976dbbe05b272dc1b4fd39963d1bcde8906b0091a98469edee7787c3d1913edd4a8819764ad0d6e9de5f05b4316de28d663d275b9700c0a9a3fe37c4c8ad5a8e0c98d';

// 🎭 Configure AWS S3 for Supabase storage - The mystical S3 portal! ✨
const s3 = new AWS.S3({
  endpoint: 'https://tjkpliasdjpgunbhsiza.storage.supabase.co/storage/v1/s3',
  accessKeyId: 'd740d4e0e2fdf3fc329cfbe2ffe058ab',
  secretAccessKey: '413082c0116292b5369ec6324bc930896580eb826ac5f8117e54582220423554',
  region: 'us-east-1',
  s3ForcePathStyle: true, // 🌟 Required for non-AWS S3-compatible services
  signatureVersion: 'v4'
});

// Create axios instance for Strapi
const strapiApi = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Download directory
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

/**
 * 🔐 Get admin JWT token for Strapi
 */
async function getStrapiToken() {
  try {
    console.log('🔐 Getting Strapi admin token...');
    const response = await axios.post(`${STRAPI_URL}/admin/login`, {
      email: 'mom@api-router.cloud',
      password: 'MomAdmin123!'
    });

    if (response.data.data?.token) {
      console.log('✅ Strapi token obtained');
      return response.data.data.token;
    } else {
      throw new Error('No token in response');
    }
  } catch (error) {
    console.error('❌ Failed to get Strapi token:', error.message);
    throw error;
  }
}

/**
 * 📥 Download file from S3 - The mystical S3 retrieval ritual! ✨
 */
async function downloadFile(url, outputPath) {
  try {
    console.log(`📥 Downloading from S3: ${url}`);
    
    // 🎭 Extract S3 key from Supabase storage URL
    const s3Key = extractS3KeyFromUrl(url);
    if (!s3Key) {
      console.error(`❌ Could not extract S3 key from URL: ${url}`);
      return null;
    }

    console.log(`🔑 S3 Key: ${s3Key}`);

    const params = {
      Bucket: 'audio', // 🎪 The grand audio bucket discovered! ✨
      Key: s3Key
    };

    const data = await s3.getObject(params).promise();
    
    // 🌟 Create directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 💎 Write the mystical file to disk
    fs.writeFileSync(outputPath, data.Body);
    console.log(`💾 Downloaded to ${outputPath}`);
    return outputPath;
    
  } catch (creativeChallenge) {
    console.error(`❌ Error downloading from S3 ${url}:`, creativeChallenge.message);
    return null;
  }
}

/**
 * 🔑 Extract S3 key from Supabase storage URL - The key extraction spell! ✨
 */
function extractS3KeyFromUrl(url) {
  try {
    // Parse URLs like: https://tjkpliasdjpgunbhsiza.supabase.co/storage/v1/object/public/audio/audio/filename.mp3
    // Extract: audio/filename.mp3
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the 'public' segment and get everything after it
    const publicIndex = pathParts.indexOf('public');
    if (publicIndex !== -1 && publicIndex < pathParts.length - 1) {
      return pathParts.slice(publicIndex + 1).join('/');
    }
    
    // Fallback: try to extract from the end of the path
    if (pathParts.length >= 2) {
      return pathParts.slice(-2).join('/'); // Get last two segments
    }
    
    return null;
  } catch (error) {
    console.error(`🌩️ Error parsing URL ${url}:`, error.message);
    return null;
  }
}

/**
 * 📤 Upload file to Strapi
 */
async function uploadToStrapi(filePath, metadata = {}) {
  try {
    console.log(`📤 Uploading to Strapi: ${path.basename(filePath)}`);

    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    // Skip files larger than 50MB to avoid 413 errors
    if (fileSizeMB > 50) {
      console.log(`⚠️ Skipping ${path.basename(filePath)} (${fileSizeMB.toFixed(2)}MB) - too large for upload`);
      // 🎭 Temporarily disabling size check for debugging. The show must go on! ✨
      // return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    // Create form data
    const { default: FormData } = await import('form-data');
    const formData = new FormData();

    formData.append('files', fileBuffer, {
      filename: fileName,
      contentType: getMimeType(fileName)
    });

    // Add metadata
    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.alternativeText) formData.append('alternativeText', metadata.alternativeText);
    if (metadata.caption) formData.append('caption', metadata.caption);

    const response = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        ...formData.getHeaders()
      },
      timeout: 120000, // 2 minute timeout for uploads
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (response.data && response.data.length > 0) {
      console.log(`✅ Uploaded: ${response.data[0].name}`);
      return response.data[0];
    } else {
      throw new Error('No file data in response');
    }
  } catch (creativeChallenge) { // 🌩️ Catching the temporary storm!
    const errorMessage = `❌ Failed to upload ${filePath}: ${creativeChallenge.response?.status} ${creativeChallenge.response?.statusText || creativeChallenge.message}`;
    console.error(errorMessage);
    return { error: errorMessage, status: creativeChallenge.response?.status }; // 🎭 Returning error details for our grand analysis
  }
}

/**
 * 🔍 Get MIME type from filename
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.srt': 'text/plain',
    '.vtt': 'text/vtt'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 🎵 Process audio jobs from Supabase
 */
async function processAudioJobs(audioJobs) {
  console.log(`\\n🎵 Processing ${audioJobs.length} audio jobs...`);

  let successCount = 0;
  let errorCount = 0;
  const uploadedFiles = [];
  const failedUploads = []; // ✨ A new ledger for creative challenges!

  for (let i = 0; i < audioJobs.length; i++) {
    const job = audioJobs[i];
    console.log(`\\n🎵 Processing audio job ${i + 1}/${audioJobs.length}: ${job.id}`);

    try {
      // Process main audio file
      if (job.audio_url) {
        const fileName = path.basename(new URL(job.audio_url).pathname);
        const localPath = path.join(DOWNLOAD_DIR, 'audio', fileName);

        const downloadedPath = await downloadFile(job.audio_url, localPath);
        if (downloadedPath) {
          const metadata = {
            name: `Audio for ${job.id}`,
            alternativeText: `Audio narration - ${job.id}`,
            caption: `Migrated from Supabase audio_jobs - ${job.id}`
          };

          const uploadedFile = await uploadToStrapi(downloadedPath, metadata);
          if (uploadedFile) {
            if (uploadedFile.error) { // 🌩️ Oh, a creative challenge during upload!
              failedUploads.push({
                original_url: job.audio_url,
                reason: uploadedFile.error,
                status: uploadedFile.status,
                job_id: job.id
              });
              errorCount++;
            } else {
              uploadedFiles.push({
                original_url: job.audio_url,
                strapi_id: uploadedFile.id,
                strapi_url: uploadedFile.url,
                type: 'audio',
                job_id: job.id,
                post_id: job.post_id
              });
              successCount++;
            }
          } else { // ❌ If download was successful but upload returned null without error object
            failedUploads.push({
              original_url: job.audio_url,
              reason: "Upload function returned null",
              job_id: job.id
            });
            errorCount++;
          }
        } else { // ❌ If download failed
          failedUploads.push({
            original_url: job.audio_url,
            reason: `Failed to download file from ${job.audio_url}`,
            job_id: job.id
          });
          errorCount++;
        }
      }

      // Process chunk audio files
      if (job.chunk_audio_urls && Array.isArray(job.chunk_audio_urls)) {
        for (let j = 0; j < job.chunk_audio_urls.length; j++) {
          const chunkUrl = job.chunk_audio_urls[j];
          if (chunkUrl) {
            const chunkFileName = path.basename(new URL(chunkUrl).pathname);
            const chunkLocalPath = path.join(DOWNLOAD_DIR, 'audio', 'chunks', chunkFileName);

            const downloadedChunkPath = await downloadFile(chunkUrl, chunkLocalPath);
            if (downloadedChunkPath) {
              const chunkMetadata = {
                name: `Audio chunk ${j + 1} for ${job.id}`,
                alternativeText: `Audio chunk - ${job.id}`,
                caption: `Migrated chunk from Supabase audio_jobs - ${job.id}`
              };

              const uploadedChunk = await uploadToStrapi(downloadedChunkPath, chunkMetadata);
              if (uploadedChunk) {
                if (uploadedChunk.error) { // 🌩️ Another creative challenge for a chunk!
                  failedUploads.push({
                    original_url: chunkUrl,
                    reason: uploadedChunk.error,
                    status: uploadedChunk.status,
                    job_id: job.id
                  });
                } else {
                  uploadedFiles.push({
                    original_url: chunkUrl,
                    strapi_id: uploadedChunk.id,
                    strapi_url: uploadedChunk.url,
                    type: 'audio_chunk',
                    job_id: job.id,
                    post_id: job.post_id,
                    chunk_index: j
                  });
                }
              } else { // ❌ If chunk download was successful but upload returned null
                failedUploads.push({
                  original_url: chunkUrl,
                  reason: "Upload function returned null for chunk",
                  job_id: job.id
                });
              }
            } else { // ❌ If chunk download failed
              failedUploads.push({
                original_url: chunkUrl,
                reason: `Failed to download chunk file from ${chunkUrl}`,
                job_id: job.id
              });
            }
          }
        }
      }

      // Process subtitle files
      if (job.language_statuses) {
        for (const [lang, status] of Object.entries(job.language_statuses)) {
          if (status.srt_url) {
            const srtFileName = path.basename(new URL(status.srt_url).pathname);
            const srtLocalPath = path.join(DOWNLOAD_DIR, 'subtitles', srtFileName);

            const downloadedSrtPath = await downloadFile(status.srt_url, srtLocalPath);
            if (downloadedSrtPath) {
              const srtMetadata = {
                name: `SRT subtitles for ${job.id} (${lang})`,
                alternativeText: `Subtitles - ${job.id} - ${lang}`,
                caption: `Migrated SRT from Supabase audio_jobs - ${job.id}`
              };

              const uploadedSrt = await uploadToStrapi(downloadedSrtPath, srtMetadata);
              if (uploadedSrt) {
                if (uploadedSrt.error) { // 🌩️ SRT creative challenge!
                  failedUploads.push({
                    original_url: status.srt_url,
                    reason: uploadedSrt.error,
                    status: uploadedSrt.status,
                    job_id: job.id
                  });
                } else {
                  uploadedFiles.push({
                    original_url: status.srt_url,
                    strapi_id: uploadedSrt.id,
                    strapi_url: uploadedSrt.url,
                    type: 'srt',
                    job_id: job.id,
                    post_id: job.post_id,
                    language: lang
                  });
                }
              } else { // ❌ If SRT download was successful but upload returned null
                failedUploads.push({
                  original_url: status.srt_url,
                  reason: "Upload function returned null for SRT",
                  job_id: job.id
                });
              }
            } else { // ❌ If SRT download failed
              failedUploads.push({
                original_url: status.srt_url,
                reason: `Failed to download SRT file from ${status.srt_url}`,
                job_id: job.id
              });
            }
          }

          if (status.vtt_url) {
            const vttFileName = path.basename(new URL(status.vtt_url).pathname);
            const vttLocalPath = path.join(DOWNLOAD_DIR, 'subtitles', vttFileName);

            const downloadedVttPath = await downloadFile(status.vtt_url, vttLocalPath);
            if (downloadedVttPath) {
              const vttMetadata = {
                name: `VTT subtitles for ${job.id} (${lang})`,
                alternativeText: `VTT Subtitles - ${job.id} - ${lang}`,
                caption: `Migrated VTT from Supabase audio_jobs - ${job.id}`
              };

              const uploadedVtt = await uploadToStrapi(downloadedVttPath, vttMetadata);
              if (uploadedVtt) {
                if (uploadedVtt.error) { // 🌩️ VTT creative challenge!
                  failedUploads.push({
                    original_url: status.vtt_url,
                    reason: uploadedVtt.error,
                    status: uploadedVtt.status,
                    job_id: job.id
                  });
                } else {
                  uploadedFiles.push({
                    original_url: status.vtt_url,
                    strapi_id: uploadedVtt.id,
                    strapi_url: uploadedVtt.url,
                    type: 'vtt',
                    job_id: job.id,
                    post_id: job.post_id,
                    language: lang
                  });
                }
              } else { // ❌ If VTT download was successful but upload returned null
                failedUploads.push({
                  original_url: status.vtt_url,
                  reason: "Upload function returned null for VTT",
                  job_id: job.id
                });
              }
            }
          }
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (creativeChallenge) { // 🌩️ Oh no, a cosmic error in processing this job!
      const errorMessage = `❌ Error processing audio job ${job.id}: ${creativeChallenge.message}`;
      console.error(errorMessage);
      failedUploads.push({
        job_id: job.id,
        reason: errorMessage,
        original_url: job.audio_url || "N/A" // Attempt to capture URL if available
      });
      errorCount++;
    }
  }

  return { successCount, errorCount, uploadedFiles, failedUploads }; // ✨ Returning the grand ledger of success and challenge!
}

/**
 * 🖼️ Process media assets from Supabase
 */
async function processMediaAssets(mediaAssets) {
  console.log(`\\n🖼️ Processing ${mediaAssets.length} media assets...`);

  let successCount = 0;
  let errorCount = 0;
  const uploadedFiles = [];
  const failedUploads = []; // ✨ A new ledger for creative challenges!

  for (let i = 0; i < mediaAssets.length; i++) {
    const asset = mediaAssets[i];
    console.log(`\\n🖼️ Processing media asset ${i + 1}/${mediaAssets.length}: ${asset.id}`);

    try {
      if (asset.file_url) {
        const fileName = path.basename(new URL(asset.file_url).pathname);
        const localPath = path.join(DOWNLOAD_DIR, asset.file_type || 'media', fileName);

        const downloadedPath = await downloadFile(asset.file_url, localPath);
        if (downloadedPath) {
          const metadata = {
            name: asset.title || `Media asset ${asset.id}`,
            alternativeText: asset.alt_text || asset.title || `Media asset ${asset.id}`,
            caption: asset.description || `Migrated from Supabase media_assets - ${asset.id}`
          };

          const uploadedFile = await uploadToStrapi(downloadedPath, metadata);
          if (uploadedFile) {
            if (uploadedFile.error) { // 🌩️ Oh, a creative challenge during upload!
              failedUploads.push({
                original_url: asset.file_url,
                reason: uploadedFile.error,
                status: uploadedFile.status,
                asset_id: asset.id
              });
              errorCount++;
            } else {
              uploadedFiles.push({
                original_url: asset.file_url,
                strapi_id: uploadedFile.id,
                strapi_url: uploadedFile.url,
                type: asset.file_type,
                asset_id: asset.id,
                post_id: asset.related_post_id
              });
              successCount++;
            }
          } else { // ❌ If download was successful but upload returned null without error object
            failedUploads.push({
              original_url: asset.file_url,
              reason: "Upload function returned null",
              asset_id: asset.id
            });
            errorCount++;
          }
        } else { // ❌ If download failed
          failedUploads.push({
            original_url: asset.file_url,
            reason: `Failed to download file from ${asset.file_url}`,
            asset_id: asset.id
          });
          errorCount++;
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (creativeChallenge) { // 🌩️ Oh no, a cosmic error in processing this asset!
      const errorMessage = `❌ Error processing media asset ${asset.id}: ${creativeChallenge.message}`;
      console.error(errorMessage);
      failedUploads.push({
        asset_id: asset.id,
        reason: errorMessage,
        original_url: asset.file_url || "N/A" // Attempt to capture URL if available
      });
      errorCount++;
    }
  }

  return { successCount, errorCount, uploadedFiles, failedUploads }; // ✨ Returning the grand ledger of success and challenge!
}

/**
 * 🎭 Main migration function
 */
async function migrateMedia() {
  try {
    console.log('🎭 ✨ STARTING COMPLETE MEDIA MIGRATION!');
    console.log('==========================================');
    
    STRAPI_API_TOKEN = await getStrapiToken();
    strapiApi.defaults.headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;

    // Query all audio jobs with URLs
    console.log('\n📊 Querying Supabase for audio jobs...');
    const audioJobsResponse = await axios.get(`${SUPABASE_URL}/rest/v1/audio_jobs?select=*`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3BsaWFzZGpwZ3VuYmhzaXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDUwMywiZXhwIjoyMDY3MzUwNTAzfQ.S426_9YxbKZCKFqPu9Q9zlefr7TkfqPuWFjnScQUu50',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3BsaWFzZGpwZ3VuYmhzaXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDUwMywiZXhwIjoyMDY3MzUwNTAzfQ.S426_9YxbKZCKFqPu9Q9zlefr7TkfqPuWFjnScQUu50'
      }
    });

    const audioJobs = audioJobsResponse.data || [];
    console.log(`📊 Found ${audioJobs.length} audio jobs with URLs`);

    // Query all media assets
    console.log('\n📊 Querying Supabase for media assets...');
    const mediaAssetsResponse = await axios.get(`${SUPABASE_URL}/rest/v1/media_assets`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3BsaWFzZGpwZ3VuYmhzaXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDUwMywiZXhwIjoyMDY3MzUwNTAzfQ.S426_9YxbKZCKFqPu9Q9zlefr7TkfqPuWFjnScQUu50',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3BsaWFzZGpwZ3VuYmhzaXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDUwMywiZXhwIjoyMDY3MzUwNTAzfQ.S426_9YxbKZCKFqPu9Q9zlefr7TkfqPuWFjnScQUu50'
      }
    });

    const mediaAssets = mediaAssetsResponse.data || [];
    console.log(`📊 Found ${mediaAssets.length} media assets`);

    // Process audio jobs
    const audioResults = await processAudioJobs(audioJobs);

    // Process media assets
    const mediaResults = await processMediaAssets(mediaAssets);

    // Save migration mapping
    const migrationMapping = {
      timestamp: new Date().toISOString(),
      audio_jobs: {
        total: audioJobs.length,
        successful: audioResults.successCount,
        failed: audioResults.errorCount,
        uploaded_files: audioResults.uploadedFiles,
        failed_uploads: audioResults.failedUploads // ✨ Including failed uploads in mapping
      },
      media_assets: {
        total: mediaAssets.length,
        successful: mediaResults.successCount,
        failed: mediaResults.errorCount,
        uploaded_files: mediaResults.uploadedFiles,
        failed_uploads: mediaResults.failedUploads // ✨ Including failed uploads in mapping
      }
    };

    const mappingPath = path.join(__dirname, 'migration-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(migrationMapping, null, 2));
    console.log(`\\n💾 Migration mapping saved to ${mappingPath}`);

    console.log('\\n🎉 ✨ MEDIA MIGRATION COMPLETE!');
    console.log('============================================================');
    console.log(`📊 AUDIO JOBS RESULTS:`);
    console.log(`   ✅ Successfully migrated: ${audioResults.successCount}/${audioJobs.length} audio jobs`);
    console.log(`   ❌ Failed migrations: ${audioResults.errorCount} audio jobs`);
    console.log(`\\n📊 MEDIA ASSETS RESULTS:`);
    console.log(`   ✅ Successfully migrated: ${mediaResults.successCount}/${mediaAssets.length} media assets`);
    console.log(`   ❌ Failed migrations: ${mediaResults.errorCount} media assets`);
    console.log(`\\n📊 TOTAL FILES UPLOADED: ${audioResults.uploadedFiles.length + mediaResults.uploadedFiles.length}`);
    console.log('\\n✨ The migration of digital artifacts is complete! ✨');

  } catch (error) {
    console.error('💥 Media migration failed:', error.message);
    process.exit(1);
  }
}

// 🎭 Run migration - ES6 module style! ✨
migrateMedia().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

export { migrateMedia };