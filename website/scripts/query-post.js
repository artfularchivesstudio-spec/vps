require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryPost() {
  const targetId = '0c541ee5-7a6a-464b-81a7-c56853cb95d8';
  const correctPostId = 'cbc72f09-623c-48a0-8974-a5aa4197dde9';

  console.log(`Querying for ID: ${targetId}`);
  console.log(`Will link to post: ${correctPostId}`);

  // First check if it's a blog post
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select(`
      *,
      media_assets!fk_blog_posts_primary_audio (
        id,
        title,
        file_url,
        status,
        transcript
      )
    `)
    .eq('id', targetId)
    .maybeSingle();

  if (post) {
    console.log('Found blog post:', JSON.stringify(post, null, 2));
  } else {
    console.log('No blog post found with this ID');
  }

  // Check if it's an audio job
  const { data: audioJob, error: audioJobError } = await supabase
    .from('audio_jobs')
    .select('*')
    .eq('id', targetId)
    .maybeSingle();

  if (audioJob) {
    console.log('Found audio job:', JSON.stringify(audioJob, null, 2));
  } else {
    console.log('No audio job found with this ID');
  }

  // Check if it's a media asset
  const { data: mediaAsset, error: mediaError } = await supabase
    .from('media_assets')
    .select('*')
    .eq('id', targetId)
    .maybeSingle();

  if (mediaAsset) {
    console.log('Found media asset:', JSON.stringify(mediaAsset, null, 2));
  } else {
    console.log('No media asset found with this ID');
  }

  // Search for blog posts containing "osprey" (the theme of the Hindi text)
  console.log('\nSearching for blog posts with osprey content...');
  const { data: ospreyPosts, error: ospreyError } = await supabase
    .from('blog_posts')
    .select('id, title, content, created_at')
    .ilike('content', '%osprey%')
    .order('created_at', { ascending: false })
    .limit(10);

  if (ospreyPosts && ospreyPosts.length > 0) {
    console.log('Found posts with osprey content:', JSON.stringify(ospreyPosts, null, 2));
  } else {
    console.log('No posts found with osprey content');
  }

  // Search for recent posts that might be related
  console.log('\nSearching for recent blog posts...');
  const { data: recentPosts, error: recentError } = await supabase
    .from('blog_posts')
    .select('id, title, content, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentPosts && recentPosts.length > 0) {
    console.log('Recent posts:', JSON.stringify(recentPosts, null, 2));
  }

  // Update the audio job to link to the correct post
  if (audioJob && audioJob.post_id === null) {
    console.log('\nUpdating audio job to link to correct post...');
    const { data: updatedAudioJob, error: updateError } = await supabase
      .from('audio_jobs')
      .update({ post_id: correctPostId })
      .eq('id', targetId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating audio job:', updateError);
    } else {
      console.log('✅ Audio job updated successfully:', JSON.stringify(updatedAudioJob, null, 2));
    }
  } else if (audioJob) {
    console.log('Audio job already linked to post:', audioJob.post_id);
  }

  // Check current primary_audio_id for the post
  console.log('\nChecking current primary_audio_id for the post...');
  const { data: currentPost, error: currentPostError } = await supabase
    .from('blog_posts')
    .select('id, title, primary_audio_id')
    .eq('id', correctPostId)
    .single();

  if (currentPost) {
    console.log('Current post primary_audio_id:', currentPost.primary_audio_id);

    if (!currentPost.primary_audio_id) {
      console.log('Post has no primary audio set - should set to English audio');
    } else {
      // Check what media asset the primary_audio_id points to
      const { data: primaryMediaAsset, error: mediaError } = await supabase
        .from('media_assets')
        .select('id, title, file_url, generation_metadata')
        .eq('id', currentPost.primary_audio_id)
        .single();

      if (primaryMediaAsset) {
        console.log('Current primary media asset:', JSON.stringify(primaryMediaAsset, null, 2));
      } else {
        console.log('Primary media asset not found');
      }
    }
  }

  // Check for other audio jobs for this post
  console.log('\nChecking for other audio jobs for this post...');
  const { data: postAudioJobs, error: postAudioError } = await supabase
    .from('audio_jobs')
    .select('*')
    .eq('post_id', correctPostId)
    .order('created_at', { ascending: false });

  if (postAudioJobs && postAudioJobs.length > 0) {
    console.log('Audio jobs for this post:', JSON.stringify(postAudioJobs, null, 2));

    // Find English audio job
    const englishAudioJob = postAudioJobs.find(job =>
      job.languages.includes('en') && job.completed_languages.includes('en')
    );

    if (englishAudioJob) {
      console.log('Found English audio job:', englishAudioJob.id);
      console.log('English audio URL:', englishAudioJob.audio_urls?.en);

      // Find the media asset for this English audio
      const { data: englishMediaAsset, error: englishMediaError } = await supabase
        .from('media_assets')
        .select('id, title, file_url')
        .eq('file_url', englishAudioJob.audio_urls?.en)
        .eq('related_post_id', correctPostId)
        .single();

      if (englishMediaAsset) {
        console.log('Found English media asset:', englishMediaAsset.id);

        // Update the post's primary_audio_id to point to English audio
        const { error: updatePostError } = await supabase
          .from('blog_posts')
          .update({ primary_audio_id: englishMediaAsset.id })
          .eq('id', correctPostId);

        if (updatePostError) {
          console.error('Error updating post primary_audio_id:', updatePostError);
        } else {
          console.log('✅ Updated post primary_audio_id to English audio:', englishMediaAsset.id);
        }
      } else {
        console.log('English media asset not found');
      }
    } else {
      console.log('No completed English audio found');
    }
  } else {
    console.log('No other audio jobs found for this post');
  }

  // If it's a blog post, check for related audio jobs
  if (post && post.content) {
    const { data: audioJobs, error: audioError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('input_text', post.content)
      .order('created_at', { ascending: false })
      .limit(5);

    if (audioJobs && audioJobs.length > 0) {
      console.log('Related audio jobs:', JSON.stringify(audioJobs, null, 2));
    } else {
      console.log('No related audio jobs found for this post content');
    }
  }
}

queryPost().catch(console.error);