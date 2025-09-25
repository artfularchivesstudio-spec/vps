import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File
    const title = formData.get('title')?.toString() || 'Untitled'
    const providers = formData.get('providers')?.toString() || 'openai'
    const analysisType = formData.get('analysis_type')?.toString() || 'detailed'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Step 1: Upload file to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const fileName = `uploads/${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName)

    if (!publicUrlData.publicUrl) {
      return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 })
    }

    // Step 2: Call the edge function with the public image URL
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-analyze-image-simple`
    
    const edgeRes = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        image_url: publicUrlData.publicUrl,
        title,
        save_to_storage: true,
        providers: providers.split(','),
        analysis_type: analysisType
      })
    })

    if (!edgeRes.ok) {
      const errorText = await edgeRes.text()
      console.error('Edge function error:', errorText)
      return NextResponse.json({ 
        error: 'Analysis failed',
        details: errorText
      }, { status: edgeRes.status })
    }

    const analysisResult = await edgeRes.json()

    return NextResponse.json({
      success: true,
      data: analysisResult.data,
      uploaded_file: {
        filename: fileName,
        public_url: publicUrlData.publicUrl
      }
    })

  } catch (error) {
    console.error('Analyze route error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 