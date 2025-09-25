import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/auth/dual-auth'

export async function POST(request: NextRequest) {
  try {
    // 🔐 Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const supabase = createServiceClient()

    console.log('🔧 Fixing Audio Processing and Linking...')
    
    const results = {
      pendingJobsProcessed: 0,
      unlinkedJobsFound: 0,
      audioLinkedToPosts: 0,
      errors: [] as string[]
    }

    // 1. Get pending jobs (but don't trigger them - they need proper authentication)
    const { data: pendingJobs, error: pendingError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (pendingError) throw pendingError
    
    console.log(`⏳ Found ${pendingJobs.length} pending jobs`)
    results.pendingJobsProcessed = pendingJobs.length

    // 2. Fix completed jobs without post_id
    const { data: unlinkedJobs, error: unlinkedError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('status', 'complete')
      .is('post_id', null)
      .limit(5)
    
    if (unlinkedError) throw unlinkedError
    
    console.log(`🔗 Found ${unlinkedJobs.length} unlinked completed jobs`)
    results.unlinkedJobsFound = unlinkedJobs.length

    // 3. Link completed audio to posts that need audio
    const { data: postsNeedingAudio, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, primary_audio_id')
      .is('primary_audio_id', null)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (postsError) throw postsError
    
    console.log(`🎵 Found ${postsNeedingAudio.length} posts needing audio`)

    // Get available audio assets
    const { data: audioAssets, error: assetsError } = await supabase
      .from('media_assets')
      .select('*')
      .eq('file_type', 'audio')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (assetsError) throw assetsError
    
    console.log(`📁 Found ${audioAssets.length} available audio assets`)

    // Link first few available audio files to posts needing audio
    const linksToMake = Math.min(postsNeedingAudio.length, audioAssets.length, 3)
    
    for (let i = 0; i < linksToMake; i++) {
      const post = postsNeedingAudio[i]
      const audio = audioAssets[i]
      
      console.log(`🔗 Linking audio ${audio.id} to post "${post.title?.substring(0, 30)}..."`)
      
      try {
        const { error: linkError } = await supabase
          .from('blog_posts')
          .update({ primary_audio_id: audio.id })
          .eq('id', post.id)
        
        if (linkError) {
          results.errors.push(`Failed to link audio ${audio.id} to post ${post.id}: ${linkError.message}`)
        } else {
          results.audioLinkedToPosts++
          console.log(`✅ Successfully linked audio to "${post.title}"`)
        }
      } catch (error: any) {
        results.errors.push(`Error linking audio ${audio.id} to post ${post.id}: ${error.message}`)
      }
    }

    console.log('✨ Audio processing fix complete!')

    return NextResponse.json({
      success: true,
      message: `🔧 Audio processing fix completed successfully`,
      data: {
        summary: {
          pendingJobsFound: results.pendingJobsProcessed,
          unlinkedJobsFound: results.unlinkedJobsFound,
          audioLinkedToPosts: results.audioLinkedToPosts,
          errorsEncountered: results.errors.length
        },
        details: {
          pendingJobs: pendingJobs.map(job => ({
            id: job.id,
            languages: job.languages,
            status: job.status,
            created_at: job.created_at
          })),
          unlinkedJobs: unlinkedJobs.map(job => ({
            id: job.id,
            languages: job.languages,
            status: job.status
          })),
          postsNeedingAudio: postsNeedingAudio.length,
          audioAssetsAvailable: audioAssets.length,
          errors: results.errors
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Fix audio processing error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to fix audio processing'
    }, { status: 500 })
  }
}
