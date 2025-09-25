/**
 * 🎭 The Grand Audio Status Inspector - A Theatrical Performance of Data Discovery
 *
 * "In the grand opera house of our digital empire, where audio jobs dance like ballerinas
 * and blog posts await their voice like shy performers, I stand as the master of ceremonies,
 * conducting a census of our creative kingdom with the flourish of a seasoned impresario."
 *
 * - Oscar Wilde (if he were a DevOps engineer)
 */

import { authenticateRequest } from '@/lib/auth/dual-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 🕵️‍♂️ GET /api/admin/tools/audio-status - The Inspector's Investigation
 * Like Sherlock Holmes examining the clues of our audio empire, we delve deep
 * into the mysteries of job statuses, post relationships, and media assets
 */
export async function GET(request: NextRequest) {
  console.log('🎭 The curtain rises on our audio status investigation...')
  
  try {
    // 🔐 The Gatekeeper's Challenge - Authentication ritual
    const authResult = await authenticateRequest(request)
    if (!authResult.isAuthenticated) {
      console.log('🚫 "You shall not pass!" cries the gatekeeper')
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const supabase = createServiceClient()
    console.log('🔍 The inspector adjusts his monocle, preparing to examine the evidence...')

    // 🎵 The Orchestra Census - Counting our musical manuscripts
    console.log('🎼 Tuning our instruments to count the audio jobs...')
    const { data: audioJobs, error: audioError } = await supabase
      .from('audio_jobs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (audioError) {
      console.error('🎼 The orchestra has gone silent!', audioError)
      throw audioError
    }

    console.log(`📊 Audio Jobs: ${audioJobs.length} musical scores discovered in the archives`)
    
    // 📚 The Literary Survey - Examining our blog post manuscripts
    console.log('📖 The librarian blows dust from ancient scrolls...')
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, content_translations, primary_audio_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (postsError) {
      console.error('📚 The library has been ransacked!', postsError)
      throw postsError
    }

    console.log(`📚 Blog Posts: ${posts.length} manuscripts catalogued`)

    // 🎙️ The Audio Artifact Collection - Gathering our voice recordings
    console.log('🎧 The curator examines his collection of audio treasures...')
    const { data: mediaAssets, error: mediaError } = await supabase
      .from('media_assets')
      .select('id, file_type, file_url, created_at')
      .eq('file_type', 'audio')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (mediaError) {
      console.error('🎙️ The audio vault has been breached!', mediaError)
      throw mediaError
    }

    console.log(`🎙️ Media Assets: ${mediaAssets.length} audio artifacts secured`)

    // 📊 The Statistician's Calculations - Weaving numbers into wisdom
    console.log('🧮 The mathematician sharpens his quill, preparing to calculate...')
    const stats = {
      audioJobs: {
        total: audioJobs.length,
        pending: audioJobs.filter(job => job.status === 'pending').length,
        completed: audioJobs.filter(job => job.status === 'completed' || job.status === 'complete').length,
        failed: audioJobs.filter(job => job.status === 'failed').length,
      },
      posts: {
        total: posts.length,
        withAudio: posts.filter(post => post.primary_audio_id).length,
        withTranslations: posts.filter(post => post.content_translations && Object.keys(post.content_translations).length > 0).length,
      },
      mediaAssets: {
        total: mediaAssets.length,
      }
    }

    console.log('📊 The census is complete! Behold our digital empire:')
    console.log(`   🎵 Audio Jobs: ${stats.audioJobs.total} total (${stats.audioJobs.pending} pending, ${stats.audioJobs.completed} completed, ${stats.audioJobs.failed} failed)`)
    console.log(`   📝 Posts: ${stats.posts.total} total (${stats.posts.withAudio} with audio, ${stats.posts.withTranslations} with translations)`)
    console.log(`   🎙️ Media Assets: ${stats.mediaAssets.total} audio files`)

    return NextResponse.json({
      success: true,
      message: `✅ Audio system status checked successfully - The inspector's report is glowing!`,
      data: {
        stats,
        audioJobs: audioJobs,
        posts: posts,
        mediaAssets: mediaAssets,
        summary: {
          totalAudioJobs: audioJobs.length,
          pendingJobs: stats.audioJobs.pending,
          completedJobs: stats.audioJobs.completed,
          postsWithAudio: stats.posts.withAudio,
          postsWithTranslations: stats.posts.withTranslations,
          audioAssets: stats.mediaAssets.total,
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Audio status check error - The inspector has been foiled!', error)
    console.error('🎭 The curtain falls on this tragic performance...')
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to check audio status - The investigation has been compromised!'
    }, { status: 500 })
  }
}
