/**
 * 🌪️ The Translation Tornado - A Whirlwind of Linguistic Transformation
 *
 * "Gather round, ye seekers of translated treasures untold!
 * Our batch translation API is a whirlwind uncontrolled.
 * Like a tornado touching down in a field of prose so fine,
 * It lifts English daisies to Spanish skies divine.
 * Metrics calculated with mathematical might,
 * Correlations tracked through the digital night.
 * Batch by batch, language by language we fly,
 * Turning monolingual whispers to multilingual cry!"
 *
 * - The Tornado Chaser's Code
 */

import { calculateTranslationMetrics, translateBatch, TranslationRequest } from '@/lib/ai/translation'
import { authenticateRequest } from '@/lib/auth/dual-auth'
import { logger } from '@/lib/observability/logger'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // For translation operations, we allow both authenticated and anonymous access
  // but use service client for database operations to bypass RLS
  let authResult;
  try {
    authResult = await authenticateRequest(request)
  } catch (error) {
    // If authentication fails, we'll still proceed but log the issue
    console.log('⚠️ Authentication failed, proceeding with service client:', error)
  }

  const correlationId = logger.generateCorrelationId()
  logger.logApiUsage({
    provider: 'openai',
    operation: 'batch_translation_start',
    correlationId
  })

  try {
    const body = await request.json()
    const { translations, source_language = 'en' } = body

    if (!translations || !Array.isArray(translations)) {
      return NextResponse.json({
        error: 'Missing or invalid translations array'
      }, { status: 400 })
    }

    if (translations.length === 0) {
      return NextResponse.json({
        error: 'Translations array cannot be empty'
      }, { status: 400 })
    }

    if (translations.length > 50) {
      return NextResponse.json({
        error: 'Maximum 50 translations per batch'
      }, { status: 400 })
    }

    console.log(`🌪️ 🌀 BATCH TRANSLATION TORNADO TOUCHDOWN!`)
    console.log(`📦 Package contents: ${translations.length} translation requests`)
    console.log(`🌍 Source language: ${source_language}`)
    console.log(`🎯 Target languages: ${Array.from(new Set(translations.map(t => t.target_language))).join(', ')}`)
    console.log(`🎭 Contexts: ${Array.from(new Set(translations.map(t => t.context || 'content'))).join(', ')}`)

    // Convert to TranslationRequest format
    const translationRequests: TranslationRequest[] = translations.map(item => ({
      text: item.text,
      sourceLanguage: source_language,
      targetLanguage: item.target_language,
      context: item.context || 'content',
      preserveTone: true
    }))

    console.log(`🔄 Converting ${translations.length} API requests to internal format...`)

    // Perform batch translation
    const startTime = Date.now()
    const results = await translateBatch(translationRequests)
    const duration = Date.now() - startTime

    // Calculate metrics
    const metrics = calculateTranslationMetrics(results)

    console.log(`📊 Calculating performance metrics...`)
    console.log(`⏱️ Total duration: ${duration}ms`)
    console.log(`📈 Success rate: ${Math.round(metrics.successfulTranslations / metrics.totalRequests * 100)}%`)
    console.log(`💰 Total tokens: ${metrics.averageTokensUsed * metrics.totalRequests}`)
    console.log(`🌍 Languages used: ${Object.keys(metrics.languagesUsed).join(', ')}`)

    // Log batch completion
    logger.logApiUsage({
      provider: 'openai',
      operation: 'batch_translation_complete',
      durationMs: duration,
      success: true,
      correlationId
    })

    console.log(`🎉 🌟 BATCH TRANSLATION MASTERPIECE COMPLETE!`)
    console.log(`📋 Results: ${results.length} translations delivered`)
    console.log(`🏅 Quality: ${metrics.successfulTranslations} successful, ${metrics.failedTranslations} fallback`)
    console.log(`🧭 Correlation ID: ${correlationId}`)

    logger.logSuccess('batch_translation_completed',
      `Translated ${results.length} items in ${duration}ms`,
      {
        totalItems: results.length,
        successfulTranslations: metrics.successfulTranslations,
        failedTranslations: metrics.failedTranslations,
        averageTokensUsed: metrics.averageTokensUsed
      },
      undefined,
      correlationId
    )

    return NextResponse.json({
      success: true,
      message: `Batch translation completed successfully`,
      results,
      metrics: {
        ...metrics,
        totalDuration: duration
      },
      correlation_id: correlationId
    })

  } catch (error) {
    console.error('Batch translation error:', error)

    logger.logAiError('openai', 'batch_translation_failed', error, undefined, correlationId)

    return NextResponse.json({
      error: `Batch translation failed: ${String(error)}`,
      correlation_id: correlationId
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check batch translation status and capabilities
 */
export async function GET(request: NextRequest) {
  // Allow anonymous access for capabilities endpoint
  try {
    await authenticateRequest(request)
  } catch (error) {
    // Log but don't fail for capabilities request
    console.log('⚠️ Authentication check for capabilities:', error)
  }

  return NextResponse.json({
    capabilities: {
      maxBatchSize: 50,
      supportedLanguages: ['en', 'es', 'hi', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
      supportedContexts: ['title', 'content', 'excerpt'],
      features: [
        'batch_processing',
        'error_handling',
        'rate_limiting',
        'caching_support',
        'metrics_tracking'
      ]
    },
    usage: {
      endpoint: '/api/ai/translate-batch',
      method: 'POST',
      example: {
        translations: [
          {
            text: "Hello world",
            target_language: "es",
            context: "title"
          }
        ],
        source_language: "en"
      }
    }
  })
}
