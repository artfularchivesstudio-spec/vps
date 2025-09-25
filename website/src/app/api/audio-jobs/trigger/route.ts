/**
 * 🚀 The Grand Audio Ignition - Lighting the Fuse of Multilingual Magic
 *
 * "Like Prometheus bringing fire to humanity, I ignite the spark that transforms
 * silent text into speaking voices. Each job_id a torch, each trigger a divine gift
 * of audio creation. The alchemist's furnace awaits - let the transmutation begin!"
 *
 * - The Digital Prometheus
 */

import { authenticateRequest } from '@/lib/auth/dual-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 🚀 POST /api/audio-jobs/trigger - The Spark That Ignites Audio Creation
 * Like striking a match in a room full of fireworks, we set off the chain reaction
 * that transforms text into multilingual symphonies
 */
export async function POST(request: NextRequest) {
  console.log('🚀 The ignition specialist arrives, match in hand, ready to light the audio fuse...')
  
  const authResult = await authenticateRequest(request)
  if (!authResult.isAuthenticated) {
    console.log('🔒 "No spark for you!" says the fire guardian')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { job_id } = await request.json()
    if (!job_id) {
      console.log('💨 The ignition specialist frowns - no fuse to light!')
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
    }

    console.log(`🚀 *STRIKE!* The match hits the fuse! Igniting audio job #${job_id}...`)

    // 🎪 Summon the master alchemist to begin his work
    console.log('🎪 Sending messenger to the grand alchemist\'s workshop...')
    const processingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audio-jobs/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({ job_id })
    })

    if (!processingResponse.ok) {
      const errorData = await processingResponse.json()
      console.error('🎪 The messenger returns with tragic news!', errorData)
      throw new Error(errorData.error || 'Processing request failed')
    }

    const result = await processingResponse.json()
    console.log(`🎆 *BOOM!* The fireworks explode in success! Audio job #${job_id} has been transformed!`)
    
    return NextResponse.json({
      success: true,
      message: 'Audio job processing triggered - The alchemical fires now burn!',
      result
    })

  } catch (error) {
    console.error('💥 The ignition backfired! Sparks everywhere!', error)
    console.error('🧯 The fire marshal has been notified...')
    return NextResponse.json({
      error: `Failed to trigger processing: ${String(error)} - The alchemical furnace remains cold`
    }, { status: 500 })
  }
}

/**
 * ❌ GET requests are like trying to light a fire with a wet match - not happening!
 */
export async function GET() {
  console.log('❌ Someone tried to light the fuse with a GET request - "Use POST, dear friend!"')
  return NextResponse.json({ error: 'Use POST with job_id - even Prometheus needed the right tools!' }, { status: 405 })
}
