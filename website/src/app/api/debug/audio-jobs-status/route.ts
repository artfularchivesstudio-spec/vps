import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get counts of audio jobs with and without post_id
    const { data: audioJobStats, error: statsError } = await supabase
      .from('audio_jobs')
      .select('post_id')
    
    if (statsError) {
      throw statsError
    }
    
    const withPostId = audioJobStats.filter(job => job.post_id !== null).length
    const withoutPostId = audioJobStats.filter(job => job.post_id === null).length
    const total = audioJobStats.length
    
    // Get a sample of jobs with post_id for verification
    const { data: sampleJobs, error: sampleError } = await supabase
      .from('audio_jobs')
      .select('id, status, post_id, created_at')
      .not('post_id', 'is', null)
      .limit(5)
      .order('created_at', { ascending: false })
    
    if (sampleError) {
      throw sampleError
    }
    
    // Test the batch-status endpoint with a few post IDs
    const postIds = sampleJobs?.map(job => job.post_id).filter(Boolean) || []
    let batchTestResult = null
    
    if (postIds.length > 0) {
      try {
        const batchResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/audio-jobs/batch-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_ids: postIds.slice(0, 3) })
        })
        
        if (batchResponse.ok) {
          batchTestResult = await batchResponse.json()
        }
      } catch (e) {
        batchTestResult = { error: `Batch test failed: ${e}` }
      }
    }
    
    return NextResponse.json({
      summary: {
        total_audio_jobs: total,
        with_post_id: withPostId,
        without_post_id: withoutPostId,
        fix_percentage: total > 0 ? Math.round((withPostId / total) * 100) : 0
      },
      sample_jobs_with_post_id: sampleJobs,
      batch_status_test: batchTestResult,
      message: withoutPostId === 0 
        ? "✅ All audio jobs have post_id values - 'None' status bug should be fixed!"
        : `⚠️ ${withoutPostId} audio jobs still missing post_id - may still show 'None' in admin`
    })
    
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to check audio jobs status' }, 
      { status: 500 }
    )
  }
}