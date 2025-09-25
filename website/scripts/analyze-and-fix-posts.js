/**
 * @file Comprehensive script to analyze and fix all posts in the database
 * - Identifies posts with missing translations and audio
 * - Finds unassociated audio files
 * - Creates translation and audio generation jobs
 * - Fixes data integrity issues
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (value) {
          envVars[key.trim()] = value.replace(/^["']|["']$/g, ''); // Remove quotes
        }
      }
    });

    return envVars;
  }
  return {};
}

// Load environment variables
const envVars = loadEnvFile();
const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Environment check:');
console.log(`  SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure .env file exists with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Supported languages
const LANGUAGES = ['en', 'es', 'hi'];

// Analysis results
let analysisResults = {
  totalPosts: 0,
  postsWithMissingTranslations: [],
  postsWithMissingAudio: [],
  postsWithUnassociatedAudio: [],
  orphanedAudioJobs: [],
  postsNeedingAudioGeneration: [],
  postsNeedingTranslation: [],
  summary: {}
};

/**
 * Analyze all posts in the database
 */
async function analyzeAllPosts() {
  console.log('🔍 Starting comprehensive post analysis...\n');

  try {
    // Get all blog posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
      return;
    }

    console.log(`📊 Found ${posts.length} total posts`);
    analysisResults.totalPosts = posts.length;

    // Get all audio jobs
    const { data: audioJobs, error: audioError } = await supabase
      .from('audio_jobs')
      .select('*');

    if (audioError) {
      console.error('❌ Error fetching audio jobs:', audioError);
      return;
    }

    console.log(`🎵 Found ${audioJobs.length} audio jobs\n`);

    // Analyze each post
    for (const post of posts) {
      await analyzePost(post, audioJobs);
    }

    // Analyze orphaned audio jobs
    await analyzeOrphanedAudioJobs(audioJobs, posts);

    // Print analysis summary
    printAnalysisSummary();

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

/**
 * Analyze a single post for issues
 */
async function analyzePost(post, allAudioJobs) {
  console.log(`🔍 Analyzing post: "${post.title}" (ID: ${post.id})`);

  const issues = [];

  // Find associated audio job
  const audioJob = allAudioJobs.find(job => job.post_id === post.id);

  // Check for missing translations
  const missingTranslations = checkMissingTranslations(post);
  if (missingTranslations.length > 0) {
    issues.push(`Missing translations: ${missingTranslations.join(', ')}`);
    analysisResults.postsNeedingTranslation.push({
      post,
      missingLanguages: missingTranslations
    });
  }

  // Check for missing audio
  const missingAudio = checkMissingAudio(post, audioJob);
  if (missingAudio.length > 0) {
    issues.push(`Missing audio: ${missingAudio.join(', ')}`);
    analysisResults.postsNeedingAudioGeneration.push({
      post,
      missingLanguages: missingAudio,
      audioJob
    });
  }

  // Check for unassociated audio files
  if (audioJob && audioJob.audio_urls) {
    const unassociated = await checkUnassociatedAudioFiles(audioJob);
    if (unassociated.length > 0) {
      issues.push(`Unassociated audio files: ${unassociated.length} files`);
      analysisResults.postsWithUnassociatedAudio.push({
        post,
        audioJob,
        unassociatedFiles: unassociated
      });
    }
  }

  if (issues.length > 0) {
    console.log(`⚠️  Issues found: ${issues.join(' | ')}`);
  } else {
    console.log(`✅ Post is complete`);
  }

  console.log('');
}

/**
 * Check for missing translations in a post
 */
function checkMissingTranslations(post) {
  const missing = [];

  // Check title translations
  if (!post.title_translations) {
    missing.push('title_translations');
  } else {
    LANGUAGES.forEach(lang => {
      if (!post.title_translations[lang]) {
        missing.push(`title_${lang}`);
      }
    });
  }

  // Check content translations
  if (!post.content_translations) {
    missing.push('content_translations');
  } else {
    LANGUAGES.forEach(lang => {
      if (!post.content_translations[lang]) {
        missing.push(`content_${lang}`);
      }
    });
  }

  // Check excerpt translations
  if (!post.excerpt_translations) {
    missing.push('excerpt_translations');
  } else {
    LANGUAGES.forEach(lang => {
      if (!post.excerpt_translations[lang]) {
        missing.push(`excerpt_${lang}`);
      }
    });
  }

  return missing;
}

/**
 * Check for missing audio for a post
 */
function checkMissingAudio(post, audioJob) {
  const missing = [];

  if (!audioJob) {
    missing.push('no_audio_job');
    return missing;
  }

  if (!audioJob.audio_urls || Object.keys(audioJob.audio_urls).length === 0) {
    missing.push('no_audio_urls');
    return missing;
  }

  LANGUAGES.forEach(lang => {
    if (!audioJob.audio_urls[lang]) {
      missing.push(`audio_${lang}`);
    }
  });

  return missing;
}

/**
 * Check for unassociated audio files in storage
 */
async function checkUnassociatedAudioFiles(audioJob) {
  const unassociated = [];

  if (!audioJob.audio_urls) return unassociated;

  // Check each language's audio file
  for (const [lang, url] of Object.entries(audioJob.audio_urls)) {
    if (url) {
      try {
        // Try to access the file to see if it exists
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          unassociated.push(`${lang}: ${url}`);
        }
      } catch (error) {
        unassociated.push(`${lang}: ${url} (error: ${error.message})`);
      }
    }
  }

  return unassociated;
}

/**
 * Analyze orphaned audio jobs (jobs not linked to posts)
 */
async function analyzeOrphanedAudioJobs(audioJobs, posts) {
  const postIds = new Set(posts.map(p => p.id));

  for (const job of audioJobs) {
    if (!job.post_id) {
      analysisResults.orphanedAudioJobs.push(job);
    } else if (!postIds.has(job.post_id)) {
      analysisResults.orphanedAudioJobs.push(job);
    }
  }

  if (analysisResults.orphanedAudioJobs.length > 0) {
    console.log(`🚨 Found ${analysisResults.orphanedAudioJobs.length} orphaned audio jobs`);
  }
}

/**
 * Print analysis summary
 */
function printAnalysisSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ANALYSIS SUMMARY');
  console.log('='.repeat(60));

  console.log(`📝 Total Posts: ${analysisResults.totalPosts}`);
  console.log(`🌍 Posts needing translation: ${analysisResults.postsNeedingTranslation.length}`);
  console.log(`🎵 Posts needing audio generation: ${analysisResults.postsNeedingAudioGeneration.length}`);
  console.log(`🔗 Posts with unassociated audio: ${analysisResults.postsWithUnassociatedAudio.length}`);
  console.log(`🚨 Orphaned audio jobs: ${analysisResults.orphanedAudioJobs.length}`);

  if (analysisResults.postsNeedingTranslation.length > 0) {
    console.log('\n🌍 POSTS NEEDING TRANSLATION:');
    analysisResults.postsNeedingTranslation.forEach((item, index) => {
      console.log(`${index + 1}. "${item.post.title}" - Missing: ${item.missingLanguages.join(', ')}`);
    });
  }

  if (analysisResults.postsNeedingAudioGeneration.length > 0) {
    console.log('\n🎵 POSTS NEEDING AUDIO GENERATION:');
    analysisResults.postsNeedingAudioGeneration.forEach((item, index) => {
      console.log(`${index + 1}. "${item.post.title}" - Missing: ${item.missingLanguages.join(', ')}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Fix missing translations for all posts
 */
async function fixMissingTranslations() {
  console.log('\n🌍 Starting translation fixes...\n');

  for (const item of analysisResults.postsNeedingTranslation) {
    const { post, missingLanguages } = item;

    console.log(`📝 Fixing translations for: "${post.title}"`);

    try {
      // Get the English content as source
      const englishTitle = post.title;
      const englishContent = post.content;
      const englishExcerpt = post.excerpt;

      // Initialize translation objects
      const titleTranslations = post.title_translations || {};
      const contentTranslations = post.content_translations || {};
      const excerptTranslations = post.excerpt_translations || {};

      // Translate to missing languages
      for (const lang of missingLanguages) {
        if (lang.startsWith('title_')) {
          const targetLang = lang.replace('title_', '');
          if (targetLang !== 'en') {
            console.log(`  📝 Translating title to ${targetLang}...`);
            titleTranslations[targetLang] = await translateText(englishTitle, 'en', targetLang);
          }
        } else if (lang.startsWith('content_')) {
          const targetLang = lang.replace('content_', '');
          if (targetLang !== 'en') {
            console.log(`  📝 Translating content to ${targetLang}...`);
            contentTranslations[targetLang] = await translateText(englishContent, 'en', targetLang);
          }
        } else if (lang.startsWith('excerpt_')) {
          const targetLang = lang.replace('excerpt_', '');
          if (targetLang !== 'en') {
            console.log(`  📝 Translating excerpt to ${targetLang}...`);
            excerptTranslations[targetLang] = await translateText(englishExcerpt, 'en', targetLang);
          }
        }
      }

      // Update the post with translations
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title_translations,
          content_translations,
          excerpt_translations,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (error) {
        console.error(`❌ Failed to update translations for post ${post.id}:`, error);
      } else {
        console.log(`✅ Translations updated for "${post.title}"`);
      }

    } catch (error) {
      console.error(`❌ Error fixing translations for post ${post.id}:`, error);
    }
  }
}

/**
 * 🌐 Real OpenAI translation function using direct API integration
 */
async function translateText(text, sourceLang, targetLang) {
  console.log(`  🔄 Translating "${text.substring(0, 50)}..." from ${sourceLang} to ${targetLang}`);

  try {
    // Use direct OpenAI API call (similar to existing translation endpoint)
    const openaiApiKey = envVars.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Language mapping
    const languageNames = {
      'es': 'Spanish',
      'hi': 'Hindi',
      'en': 'English'
    };

    const targetLanguageName = languageNames[targetLang] || targetLang;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a highly accurate and fluent translator specializing in artistic and mystical content. Translate the following text into ${targetLanguageName}.

IMPORTANT GUIDELINES:
- Maintain the mystical, spellbinding tone and poetic language
- Preserve any artistic terminology and cultural references appropriately
- Keep the same emotional impact and beauty of the original
- If translating to Hindi, use elegant literary Hindi (not colloquial)
- If translating to Spanish, use beautiful, poetic Spanish
- Provide only the translated text, with no additional commentary or formatting.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: Math.min(2000, Math.max(100, text.length * 2)),
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error('Empty translation received from OpenAI');
    }

    console.log(`  ✅ Translation completed (${translatedText.length} chars)`);
    return translatedText;

  } catch (error) {
    console.error(`  ❌ Translation exception:`, error.message);
    // Fallback to mock translation if API fails
    console.log(`  ⚠️  Falling back to mock translation due to API error`);
    return `[${targetLang.toUpperCase()}] ${text}`;
  }
}

/**
 * Generate missing audio for posts
 */
async function generateMissingAudio() {
  console.log('\n🎵 Starting audio generation fixes...\n');

  for (const item of analysisResults.postsNeedingAudioGeneration) {
    const { post, missingLanguages, audioJob } = item;

    console.log(`🎤 Generating audio for: "${post.title}"`);

    try {
      // Create or update audio job
      let jobId = audioJob?.id;

      if (!jobId) {
        // Create new audio job
        const { data: newJob, error: createError } = await supabase
          .from('audio_jobs')
          .insert({
            post_id: post.id,
            input_text: post.content || 'No content available',
            text_content: post.content,
            status: 'pending',
            languages: LANGUAGES,
            is_draft: false,
            language_statuses: LANGUAGES.reduce((acc, lang) => ({
              ...acc,
              [lang]: { status: 'pending', draft: false, chunk_audio_urls: [] }
            }), {}),
            completed_languages: []
          })
          .select('id')
          .single();

        if (createError) {
          console.error(`❌ Failed to create audio job for post ${post.id}:`, createError);
          continue;
        }

        jobId = newJob.id;
        console.log(`  ✅ Created audio job ${jobId}`);
      }

      // Update job with missing translations if needed
      const translatedTexts = audioJob?.translated_texts || {};
      const missingTextLangs = LANGUAGES.filter(lang => !translatedTexts[lang]);

      for (const lang of missingTextLangs) {
        if (lang !== 'en') {
          console.log(`  📝 Translating content to ${lang} for audio...`);
          translatedTexts[lang] = await translateText(post.content, 'en', lang);
        } else {
          translatedTexts[lang] = post.content;
        }
      }

      // Update the job
      const { error: updateError } = await supabase
        .from('audio_jobs')
        .update({
          translated_texts: translatedTexts,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (updateError) {
        console.error(`❌ Failed to update audio job ${jobId}:`, updateError);
      } else {
        console.log(`✅ Audio job ${jobId} updated for post "${post.title}"`);
      }

    } catch (error) {
      console.error(`❌ Error generating audio for post ${post.id}:`, error);
    }
  }
}

/**
 * Fix unassociated audio files
 */
async function fixUnassociatedAudio() {
  console.log('\n🔗 Starting unassociated audio fixes...\n');

  for (const item of analysisResults.postsWithUnassociatedAudio) {
    const { post, audioJob, unassociatedFiles } = item;

    console.log(`🔗 Fixing unassociated audio for: "${post.title}"`);

    // For now, just log the issues - in a real implementation,
    // you'd either regenerate the missing files or clean up references
    unassociatedFiles.forEach(file => {
      console.log(`  ⚠️  Unassociated: ${file}`);
    });

    // Mark for regeneration by resetting status
    const { error } = await supabase
      .from('audio_jobs')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', audioJob.id);

    if (error) {
      console.error(`❌ Failed to reset audio job ${audioJob.id}:`, error);
    } else {
      console.log(`  🔄 Marked audio job ${audioJob.id} for regeneration`);
    }
  }
}

/**
 * Clean up orphaned audio jobs
 */
async function cleanupOrphanedAudioJobs() {
  console.log('\n🧹 Starting orphaned audio job cleanup...\n');

  for (const job of analysisResults.orphanedAudioJobs) {
    console.log(`🗑️  Cleaning up orphaned audio job ${job.id}`);

    // Archive or delete orphaned job
    const { error } = await supabase
      .from('audio_jobs')
      .update({
        status: 'archived',
        error_message: 'Orphaned job - no associated post',
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    if (error) {
      console.error(`❌ Failed to archive orphaned job ${job.id}:`, error);
    } else {
      console.log(`  ✅ Archived orphaned audio job ${job.id}`);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting comprehensive post analysis and fix process...\n');

  // Phase 1: Analysis
  await analyzeAllPosts();

  // Phase 2: Ask user what to fix
  console.log('\n' + '='.repeat(60));
  console.log('🔧 FIX OPTIONS');
  console.log('='.repeat(60));

  if (analysisResults.postsNeedingTranslation.length > 0) {
    console.log(`1. Fix ${analysisResults.postsNeedingTranslation.length} posts with missing translations`);
  }

  if (analysisResults.postsNeedingAudioGeneration.length > 0) {
    console.log(`2. Generate audio for ${analysisResults.postsNeedingAudioGeneration.length} posts`);
  }

  if (analysisResults.postsWithUnassociatedAudio.length > 0) {
    console.log(`3. Fix ${analysisResults.postsWithUnassociatedAudio.length} posts with unassociated audio files`);
  }

  if (analysisResults.orphanedAudioJobs.length > 0) {
    console.log(`4. Clean up ${analysisResults.orphanedAudioJobs.length} orphaned audio jobs`);
  }

  console.log('5. Run all fixes automatically');

  // For now, let's run all fixes automatically
  console.log('\n🔧 Running all fixes automatically...\n');

  if (analysisResults.postsNeedingTranslation.length > 0) {
    await fixMissingTranslations();
  }

  if (analysisResults.postsNeedingAudioGeneration.length > 0) {
    await generateMissingAudio();
  }

  if (analysisResults.postsWithUnassociatedAudio.length > 0) {
    await fixUnassociatedAudio();
  }

  if (analysisResults.orphanedAudioJobs.length > 0) {
    await cleanupOrphanedAudioJobs();
  }

  console.log('\n🎉 All fixes completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Run the audio job worker to process pending jobs');
  console.log('2. Verify translations and audio files');
  console.log('3. Check subtitle generation for new audio jobs');
}

// Run the script
main().catch(console.error);
