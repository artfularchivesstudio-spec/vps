import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/auth/dual-auth'

/**
 * 🔧 Audio Jobs Repair - Fix posts that have completed audio jobs but no primary_audio_id
 * This will help fix your existing posts that have audio but aren't showing it
 */

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = authResult.supabaseClient

  try {
    console.log('🔧 Starting audio jobs repair process...')
    
    // Find all completed audio jobs that have audio_urls but their posts don't have primary_audio_id
    const { data: audioJobs, error: jobsError } = await supabase
      .from('audio_jobs')
      .select(`
        id,
        post_id,
        status,
        audio_urls,
        completed_languages,
        config
      `)
      .eq('status', 'completed')
      .not('post_id', 'is', null)
      .not('audio_urls', 'is', null)

    if (jobsError) {
      throw new Error(`Failed to fetch audio jobs: ${jobsError.message}`)
    }

    console.log(`🔍 Found ${audioJobs?.length || 0} completed audio jobs`)

    const repairedPosts: string[] = []
    const createdAssets: string[] = []

    for (const job of audioJobs || []) {
      try {
        // Check if the post already has primary_audio_id
        const { data: post, error: postError } = await supabase
          .from('blog_posts')
          .select('id, title, primary_audio_id')
          .eq('id', job.post_id)
          .single()

        if (postError) {
          console.error(`❌ Error fetching post ${job.post_id}:`, postError)
          continue
        }

        if (post.primary_audio_id) {
          console.log(`✅ Post ${post.id} already has primary_audio_id: ${post.primary_audio_id}`)
          continue
        }

        console.log(`🔧 Repairing post: ${post.title} (${post.id})`)

        // Get the primary language audio URL (usually English or first available)
        const audioUrls = job.audio_urls as Record<string, string>
        const primaryLanguage = job.completed_languages?.[0] || 'en'
        const primaryAudioUrl = audioUrls[primaryLanguage] || Object.values(audioUrls)[0]

        if (!primaryAudioUrl) {
          console.warn(`⚠️ No audio URL found for job ${job.id}`)
          continue
        }

        // Check if media asset already exists for this audio
        const { data: existingAssets, error: assetError } = await supabase
          .from('media_assets')
          .select('id')
          .eq('file_url', primaryAudioUrl)
          .eq('related_post_id', job.post_id)

        let mediaAssetId: string

        if (assetError) {
          console.error(`❌ Error checking media assets:`, assetError)
          continue
        }

        if (existingAssets?.length) {
          // Use existing media asset
          mediaAssetId = existingAssets[0].id
          console.log(`✅ Using existing media asset: ${mediaAssetId}`)
        } else {
          // Create new media asset
          const { data: newAsset, error: createError } = await supabase
            .from('media_assets')
            .insert({
              title: `Audio: ${post.title}`,
              file_url: primaryAudioUrl,
              file_type: 'audio',
              mime_type: 'audio/mpeg',
              related_post_id: job.post_id,
              generation_metadata: {
                type: 'tts',
                language: primaryLanguage,
                repaired: true,
                repaired_at: new Date().toISOString(),
                original_job_id: job.id
              },
              status: 'ready'
            })
            .select('id')
            .single()

          if (createError) {
            console.error(`❌ Error creating media asset:`, createError)
            continue
          }

          mediaAssetId = newAsset.id
          createdAssets.push(mediaAssetId)
          console.log(`🆕 Created new media asset: ${mediaAssetId}`)
        }

        // Update the blog post with primary_audio_id
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ primary_audio_id: mediaAssetId })
          .eq('id', job.post_id)

        if (updateError) {
          console.error(`❌ Error updating post ${job.post_id}:`, updateError)
          continue
        }

        repairedPosts.push(job.post_id)
        console.log(`✅ Repaired post ${post.id} -> audio asset ${mediaAssetId}`)

      } catch (error) {
        console.error(`❌ Error repairing job ${job.id}:`, error)
        continue
      }
    }

    const summary = {
      total_jobs_checked: audioJobs?.length || 0,
      posts_repaired: repairedPosts.length,
      assets_created: createdAssets.length,
      repaired_post_ids: repairedPosts,
      created_asset_ids: createdAssets
    }

    console.log('🎉 Audio jobs repair completed:', summary)

    return NextResponse.json({
      success: true,
      message: `Repaired ${repairedPosts.length} posts with audio`,
      summary
    })

  } catch (error) {
    console.error('❌ Audio jobs repair error:', error)
    return NextResponse.json({ 
      error: `Repair failed: ${String(error)}` 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Audio Jobs Repair Endpoint',
    usage: 'POST to repair posts with completed audio jobs but missing primary_audio_id'
  })
}
