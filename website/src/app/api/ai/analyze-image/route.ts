import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { authenticateRequest } from '@/lib/auth/dual-auth'

// Helper function to sanitize filenames
function sanitizeFileName(fileName: string): string {
  // Replace spaces and special characters with underscores, and convert to lowercase
  return fileName.replace(/[\s\W]+/g, '_').toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    
    // Handle JSON requests (from AnalyzingStep component)
    if (contentType.includes('application/json')) {
      let body
      try {
        body = await request.json()
      } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
      }
      
      const { image_url, prompt, analysis_type = 'detailed', providers = ['openai'] } = body
      
      if (!image_url) {
        return NextResponse.json({ error: 'No image_url provided' }, { status: 400 })
      }

      const supabase = authResult.supabaseClient
      
      // Use service role key for authentication (supported by simple function)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      // Use the Supabase simple function to get analysis AND blog content
      const { data: functionData, error: functionError } = await supabase.functions.invoke('ai-analyze-image-simple', {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: { 
          image_url: image_url, 
          prompt: prompt,
          providers: ['openai'],
          analysis_type: analysis_type
        }
      })

      if (functionError) {
        console.error('Edge function error:', functionError)
        return NextResponse.json({ 
          success: false,
          error: 'Failed to analyze image'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: functionData?.data || functionData // Handle cases where structure might vary
      })
    }
    
    // Handle FormData requests (for file uploads)
    const formData = await request.formData()
    const image = formData.get('image') as File
    const variationsRaw = formData.get('variations') as string | null
    const variations = Math.min(3, Math.max(1, parseInt(variationsRaw || '1', 10) || 1))

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const supabase = createClient()

    // 1. Sanitize the filename and upload the image to Supabase Storage
    const sanitizedFileName = sanitizeFileName(image.name);
    const fileName = `uploads/${Date.now()}-${sanitizedFileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, image)

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // 2. Get the public URL of the uploaded image
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(uploadData.path)

    const imageUrl = urlData.publicUrl

    // 3. Invoke the Supabase Edge Function with service role auth
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const { data: functionData, error: functionError } = await supabase.functions.invoke('ai-analyze-image-simple', {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: { image_url: imageUrl, providers: ['openai'] },
    })

    if (functionError) {
      console.error('Edge function error:', functionError)
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 })
    }

    // 4. Return the result from the Edge Function
    return NextResponse.json({
      success: true,
      data: functionData?.data || functionData // Handle cases where structure might vary
    })

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}