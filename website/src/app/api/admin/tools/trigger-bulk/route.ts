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

    console.log('🚀 Triggering processing for pending audio jobs...')

    // Get all pending audio jobs from the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    const { data: jobs, error } = await supabase
      .from('audio_jobs')
      .select('id, languages, status, config, created_at, post_id')
      .eq('status', 'pending')
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20) // Limit to prevent overwhelming

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`)
    }

    console.log(`✅ Found ${jobs.length} pending jobs to process`)

    const results = {
      jobsFound: jobs.length,
      successfullyTriggered: 0,
      failedToTrigger: 0,
      errors: [] as string[]
    }

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'ℹ️ No pending jobs found',
        data: {
          summary: results,
          message: 'All jobs may already be processing or completed.'
        }
      })
    }

    // Process jobs by triggering them through the internal API
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      const createdAt = new Date(job.created_at).toLocaleString()
      const title = job.config?.title || 'Untitled'
      const language = job.languages?.[0] || 'unknown'
      
      console.log(`🔄 Processing job ${i + 1}/${jobs.length}: ${title} (${language})`)
      console.log(`   Job ID: ${job.id}`)
      console.log(`   Created: ${createdAt}`)

      try {
        // Trigger processing via internal Next.js API route
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audio-jobs/trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            job_id: job.id
          })
        })

        if (response.ok) {
          console.log(`   ✅ Processing triggered successfully`)
          results.successfullyTriggered++
        } else {
          const errorText = await response.text()
          console.log(`   ❌ Failed to trigger processing: ${response.status} - ${errorText}`)
          results.failedToTrigger++
          results.errors.push(`Job ${job.id}: ${response.status} - ${errorText}`)
        }

      } catch (error: any) {
        console.log(`   ❌ Error triggering job: ${error.message}`)
        results.failedToTrigger++
        results.errors.push(`Job ${job.id}: ${error.message}`)
      }

      // Small delay between jobs to avoid overwhelming the system
      if (i < jobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
    }

    console.log('\n🎉 Bulk processing trigger completed!')

    return NextResponse.json({
      success: true,
      message: `⚡ Bulk processing trigger completed`,
      data: {
        summary: {
          jobsFound: results.jobsFound,
          successfullyTriggered: results.successfullyTriggered,
          failedToTrigger: results.failedToTrigger,
          successRate: results.jobsFound > 0 ? Math.round((results.successfullyTriggered / results.jobsFound) * 100) : 0,
          errorsEncountered: results.errors.length
        },
        details: {
          processedJobs: jobs.map(job => ({
            id: job.id,
            title: job.config?.title || 'Untitled',
            languages: job.languages,
            created_at: job.created_at,
            post_id: job.post_id
          })),
          errors: results.errors
        },
        message: results.successfullyTriggered > 0 
          ? 'Audio generation is now running in the background. Check individual job status for progress.'
          : 'No jobs were successfully triggered. Check the errors for details.'
      }
    })

  } catch (error: any) {
    console.error('❌ Trigger bulk processing error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to trigger bulk processing'
    }, { status: 500 })
  }
}
