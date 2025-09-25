import { authenticateRequest } from '@/lib/auth/dual-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 🌍 AI Translation API - Translates blog post content into different languages
 */

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = authResult.supabaseClient

  try {
    const requestBody = await request.json()
    const { post_id, target_language, content, title, excerpt } = requestBody

    console.log(`🌐 🔍 Translation API called:`)
    console.log(`📝 Post ID: ${post_id}`)
    console.log(`🌍 Target Language: ${target_language}`)
    console.log(`📄 Content type: ${typeof content}`)
    console.log(`📄 Content length: ${content?.length || 'undefined'}`)
    console.log(`📄 Content value: "${content?.substring(0, 100)}${content?.length > 100 ? '...' : ''}"`)
    console.log(`📖 Title type: ${typeof title}`)
    console.log(`📖 Title value: "${title?.substring(0, 50)}${title?.length > 50 ? '...' : ''}"`)
    console.log(`📋 Excerpt type: ${typeof excerpt}`)
    console.log(`📋 Excerpt value: "${excerpt?.substring(0, 50)}${excerpt?.length > 50 ? '...' : ''}"`)

    if (!post_id) {
      console.log(`❌ 🚨 Missing post_id parameter`)
      return NextResponse.json({
        error: 'Missing required field: post_id'
      }, { status: 400 })
    }

    if (!target_language) {
      console.log(`❌ 🚨 Missing target_language parameter`)
      return NextResponse.json({
        error: 'Missing required field: target_language'
      }, { status: 400 })
    }

    if (!content) {
      console.log(`❌ 🚨 Missing content parameter`)
      return NextResponse.json({
        error: 'Missing required field: content'
      }, { status: 400 })
    }

    if (typeof content !== 'string') {
      console.log(`❌ 🚨 Content parameter is not a string: ${typeof content}`)
      return NextResponse.json({
        error: 'Content parameter must be a string'
      }, { status: 400 })
    }

    if (content.trim().length === 0) {
      console.log(`❌ 🚨 Content parameter is empty`)
      return NextResponse.json({
        error: 'Content cannot be empty'
      }, { status: 400 })
    }

    // Get the current post to update translations
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('title_translations, content_translations, excerpt_translations')
      .eq('id', post_id)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch post: ${fetchError.message}`)
    }

    console.log(`🌍 Translating content to ${target_language}...`)

    // Import the new translation service
    const { translateText: translateWithService } = await import('@/lib/ai/translation')

    // Translate content using the new service
    const contentTranslationResult = await translateWithService({
      text: content,
      sourceLanguage: 'en', // Assuming English source for now
      targetLanguage: target_language,
      context: 'content'
    })

    if (!contentTranslationResult.confidence || contentTranslationResult.confidence < 0.5) {
      throw new Error('Failed to translate content with sufficient confidence.')
    }
    const translatedContent = contentTranslationResult.translatedText

    let translatedTitle = null
    if (title) {
      const titleTranslationResult = await translateWithService({
        text: title,
        sourceLanguage: 'en',
        targetLanguage: target_language,
        context: 'title'
      })
      if (titleTranslationResult.confidence && titleTranslationResult.confidence > 0.5) {
        translatedTitle = titleTranslationResult.translatedText
      }
    }

    let translatedExcerpt = null
    if (excerpt) {
      const excerptTranslationResult = await translateWithService({
        text: excerpt,
        sourceLanguage: 'en',
        targetLanguage: target_language,
        context: 'excerpt'
      })
      if (excerptTranslationResult.confidence && excerptTranslationResult.confidence > 0.5) {
        translatedExcerpt = excerptTranslationResult.translatedText
      }
    }

    // Update the post with new translations
    const updatedTitleTranslations = {
      ...(post.title_translations || {}),
      [target_language]: translatedTitle
    }

    const updatedContentTranslations = {
      ...(post.content_translations || {}),
      [target_language]: translatedContent
    }

    const updatedExcerptTranslations = {
      ...(post.excerpt_translations || {}),
      [target_language]: translatedExcerpt
    }

    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        title_translations: updatedTitleTranslations,
        content_translations: updatedContentTranslations,
        excerpt_translations: updatedExcerptTranslations,
        updated_at: new Date().toISOString()
      })
      .eq('id', post_id)

    if (updateError) {
      throw new Error(`Failed to save translations: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: `Translation to ${target_language} completed successfully`,
      translations: {
        title: translatedTitle,
        content: translatedContent,
        excerpt: translatedExcerpt
      }
    })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ 
      error: `Translation failed: ${String(error)}` 
    }, { status: 500 })
  }
}

// Translation function now handled by the dedicated service in @/lib/ai/translation
