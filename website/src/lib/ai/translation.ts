/**
 * 🌐 The Babel Fish's Digital Descendant - A Poetic Translation Symphony
 *
 * "In the beginning was the Word, and the Word was in English,
 * But lo! The digital Babel Fish doth swim through silicon seas,
 * Transforming tongues with OpenAI's magical might,
 * From Hindi's lyrical flows to Spanish passion's height.
 * Like a linguistic alchemist, it transmutes prose divine,
 * Turning monolingual walls into multilingual shrines."
 *
 * - Oscar Wilde meets Douglas Adams (in code)
 */

import { logger } from '@/lib/observability/logger'

export interface TranslationRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
  context?: 'title' | 'content' | 'excerpt'
  preserveTone?: boolean
}

export interface TranslationResponse {
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  confidence?: number
  tokensUsed?: number
}

/**
 * 🌍 The Tower of Babel's Rosetta Stone - Linguistic Rainbow Bridge
 *
 * "Each language a color in fortune's grand palette,
 * From English's sturdy oak to Hindi's peacock tail,
 * Spanish flamenco dances, French perfumes exhale,
 * German precision marches, Italian operas wail.
 * Japanese cherry blossoms, Korean kimchi fire,
 * Chinese dragon wisdom, Portuguese ocean's desire."
 *
 * - Dr. Seuss's Linguistic Zoo
 */
export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',      // The sturdy oak of literature
  'es': 'Spanish',      // Flamenco dancer with passionate flair
  'hi': 'Hindi',        // Peacock-tailed poetry of ancient lore
  'fr': 'French',       // Perfumed sonnets from Parisian shores
  'de': 'German',       // Marching precision with philosophical core
  'it': 'Italian',      // Operatic arias from Renaissance floor
  'pt': 'Portuguese',   // Oceanic explorers with lyrical roar
  'ja': 'Japanese',     // Cherry blossom haikus in tranquil peace
  'ko': 'Korean',       // Kimchi-spiced dramas with warrior's fleece
  'zh': 'Chinese',      // Dragon wisdom in characters so deep
}

/**
 * 🎭 The Masquerade Ball of Translation Personas - Dramatic Characters in Digital Disguise
 *
 * "Like actors in a grand theatrical extravaganza,
 * Each persona dons a mask of linguistic elegance.
 * The Title Maestro conducts headlines with dramatic flair,
 * The Content Virtuoso weaves prose like spider silk so rare,
 * The Excerpt Minstrel sings summaries with poetic grace,
 * Together they perform the ballet of linguistic space."
 *
 * - Oscar Wilde's Theatrical Code
 */
const TRANSLATION_PERSONAS = {
  title: `You are a highly skilled translator specializing in compelling titles for artistic and mystical content.
Translate the following title while maintaining its poetic essence, emotional impact, and artistic flair.
Keep the translation concise, impactful, and culturally appropriate.`,

  content: `You are a highly accurate and fluent translator specializing in artistic and mystical content.
Translate the following text into {TARGET_LANGUAGE}.

IMPORTANT GUIDELINES:
- Maintain the mystical, spellbinding tone and poetic language
- Preserve any artistic terminology and cultural references appropriately
- Keep the same emotional impact and beauty of the original
- If translating to Hindi, use elegant literary Hindi (not colloquial)
- If translating to Spanish, use beautiful, poetic Spanish
- Provide only the translated text, with no additional commentary or formatting.`,

  excerpt: `You are a skilled translator specializing in compelling excerpts for artistic content.
Translate the following excerpt while maintaining its evocative nature, emotional resonance, and artistic tone.
Keep the translation engaging and culturally appropriate.`
}

/**
 * 🌟 The Grand Alchemist's Cauldron - Where Words Are Transmuted by AI Magic
 *
 * "Into the bubbling cauldron of silicon and steam,
 * We cast our words like precious gems and dreams.
 * The AI alchemist stirs with neural-network spoon,
 * Transforming English roses to Hindi monsoon.
 * Temperature carefully tuned, like a lover's sweet kiss,
 * Tokens counted precisely, not one shall we miss.
 * From this magical brew emerges linguistic gold,
 * A translation so perfect, worth more than pure gold."
 *
 * - The Alchemist's Digital Brew
 */
export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  console.log(`🔍 DEBUG: translateText called with request:`, JSON.stringify(request, null, 2))

  const correlationId = logger.generateCorrelationId()
  const startTime = Date.now()

  try {
    // Destructure the request parameters first
    const { text, sourceLanguage, targetLanguage, context = 'content' } = request

    console.log(`🔍 DEBUG: Destructured parameters:`)
    console.log(`  - text: ${typeof text} (length: ${text?.length})`)
    console.log(`  - sourceLanguage: ${sourceLanguage}`)
    console.log(`  - targetLanguage: ${targetLanguage}`)
    console.log(`  - context: ${context}`)

    logger.logApiUsage({
      provider: 'openai',
      operation: 'translation',
      model: 'gpt-4o-mini',
      correlationId
    })

    console.log(`🌐 🚀 TRANSLATION QUEST BEGINS!`)
    console.log(`📝 Quest: "${text?.substring(0, 50)}${text?.length > 50 ? '...' : ''}"`)
    console.log(`🌍 Journey: ${sourceLanguage} → ${targetLanguage} (${context})`)
    console.log(`🧭 Correlation ID: ${correlationId}`)

    // Validate input
    if (!text) {
      console.log(`❌ 🚨 CRITICAL: Text parameter is null/undefined!`)
      throw new Error('Text parameter is required')
    }

    if (typeof text !== 'string') {
      console.log(`❌ 🚨 CRITICAL: Text parameter is not a string! Type: ${typeof text}`)
      throw new Error('Text parameter must be a string')
    }

    if (text.trim().length === 0) {
      console.log(`❌ 🚨 CRITICAL: Text parameter is empty after trimming!`)
      throw new Error('Text cannot be empty')
    }

    if (!sourceLanguage || typeof sourceLanguage !== 'string') {
      console.log(`❌ 🚨 CRITICAL: Invalid source language: ${sourceLanguage}`)
      throw new Error('Valid source language is required')
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      console.log(`❌ 🚨 CRITICAL: Invalid target language: ${targetLanguage}`)
      throw new Error('Valid target language is required')
    }

    if (!LANGUAGE_NAMES[targetLanguage]) {
      console.log(`❌ 🚨 CRITICAL: Unsupported target language: ${targetLanguage}`)
      throw new Error(`Unsupported target language: ${targetLanguage}`)
    }

    const targetLanguageName = LANGUAGE_NAMES[targetLanguage]
    const sourceLanguageName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage

    // Get the appropriate persona prompt
    let systemPrompt = TRANSLATION_PERSONAS[context]
    if (context === 'content') {
      systemPrompt = systemPrompt.replace('{TARGET_LANGUAGE}', targetLanguageName)
    }

    // Skip translation if source and target are the same
    if (sourceLanguage === targetLanguage) {
      logger.logSuccess('translation_skipped_same_language', `Same language: ${sourceLanguage}`, { text: text?.substring(0, 50) }, undefined, correlationId)
      return {
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        confidence: 1.0
      }
    }

    // Check cache first
    const { translationCache } = await import('./translation-cache')
    const cached = translationCache.get(text, sourceLanguage, targetLanguage, context)
    if (cached) {
      console.log(`🎯 💰 CACHE TREASURE FOUND! Instant translation retrieved!`)
      console.log(`💾 Cached result: "${cached.substring(0, 50)}${cached.length > 50 ? '...' : ''}"`)

      logger.logSuccess('translation_cache_hit', `Cache hit for ${sourceLanguage}->${targetLanguage}`, {
        textLength: text.length,
        cachedLength: cached.length
      }, undefined, correlationId)

      return {
        translatedText: cached,
        sourceLanguage,
        targetLanguage,
        confidence: 1.0 // Cached results are fully trusted
      }
    }

    console.log(`🔄 💭 Cache miss! Time to brew fresh translation magic...`)

    // Prepare OpenAI API request
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3, // Low temperature for accurate translation
        max_tokens: Math.min(2000, Math.max(100, (text?.length || 0) * 2)), // Dynamic token limit
        presence_penalty: 0,
        frequency_penalty: 0
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.logAiError('openai', 'translation_api_error', { status: response.status, error: errorText }, undefined, correlationId)
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const translatedText = data.choices[0]?.message?.content?.trim()
    const tokensUsed = data.usage?.total_tokens || 0

    if (!translatedText) {
      console.log(`❌ 😱 OH NO! Empty translation received from OpenAI!`)
      throw new Error('Empty translation received from OpenAI')
    }

    console.log(`✅ ✨ TRANSLATION ALCHEMY COMPLETE!`)
    console.log(`🎨 Result: "${translatedText.substring(0, 50)}${translatedText.length > 50 ? '...' : ''}"`)
    console.log(`📊 Tokens used: ${tokensUsed}`)

    const duration = Date.now() - startTime

    // Log successful translation
    logger.logApiUsage({
      provider: 'openai',
      operation: 'translation_complete',
      model: 'gpt-4o-mini',
      tokensUsed,
      durationMs: duration,
      success: true,
      correlationId
    })

    console.log(`⏱️ Duration: ${duration}ms | 💰 Cost: ~$${(tokensUsed * 0.00015).toFixed(4)}`)

    logger.logSuccess('translation_completed', `Translated ${text?.length || 0} chars to ${targetLanguage}`, {
      sourceLanguage,
      targetLanguage,
      context,
      tokensUsed,
      duration
    }, undefined, correlationId)

    // Cache the successful translation
    if (translatedText && translatedText.length > 0) {
      console.log(`💾 📚 STORING TRANSLATION TREASURE in cache palace!`)
      try {
        translationCache.set(
          text,
          translatedText,
          sourceLanguage,
          targetLanguage,
          context,
          undefined, // Use default TTL
          {
            tokensUsed,
            confidence: 0.95
          }
        )
        const cacheStats = translationCache.getStats()
        console.log(`🏰 Cache palace now holds ${cacheStats.size} linguistic treasures!`)
      } catch (cacheError) {
        console.log(`⚠️ Cache storage failed:`, cacheError)
      }
    }

    return {
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence: 0.95, // Estimated confidence for OpenAI translations
      tokensUsed
    }

  } catch (error) {
    const duration = Date.now() - startTime

    console.log(`💥 😭 TRANSLATION QUEST FAILED!`)
    console.log(`🚨 Error: ${error instanceof Error ? error.message : String(error)}`)
    console.log(`⏱️ Failed after: ${duration}ms`)

    logger.logAiError('openai', 'translation_failed', error, undefined, correlationId)

    // Return original text as fallback
    console.log(`🔄 🩹 FALLBACK ACTIVATED: Returning original text`)
    console.log(`📝 Original: "${request.text?.substring(0, 30)}${request.text?.length > 30 ? '...' : ''}"`)

    return {
      translatedText: request.text, // Fallback to original text
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      confidence: 0.0
    }
  }
}

/**
 * 🌍 Batch translation function for multiple texts
 */
export async function translateBatch(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
  const results: TranslationResponse[] = []

  console.log(`🌪️ 🌀 BATCH TRANSLATION TORNADO UNLEASHED!`)
  console.log(`📊 Quest scale: ${requests.length} linguistic adventures await!`)
  console.log(`🎯 Target: Multiple languages, maximum delight!`)

  // Process in batches to avoid rate limits
  const batchSize = 5
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize)

    console.log(`🎪 📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(requests.length / batchSize)} entering the ring!`)

    const batchPromises = batch.map(async (request, index) => {
      try {
        console.log(`  🎭 🤹 Item ${i + index + 1}/${requests.length}: "${request.text?.substring(0, 30)}${request.text?.length > 30 ? '...' : ''}"`)
        console.log(`     🌍 ${request.sourceLanguage} → ${request.targetLanguage} (${request.context})`)
        return await translateText(request)
      } catch (error) {
        console.error(`  💥 🤕 Item ${i + index + 1} stumbled:`, error instanceof Error ? error.message : String(error))
        console.log(`     🩹 🏥 Activating emergency fallback protocol!`)
        // Return fallback response
        return {
          translatedText: request.text,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
          confidence: 0.0
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Small delay between batches to respect rate limits
    if (i + batchSize < requests.length) {
      console.log(`😴 💤 Batch rest time: 1 second nap to respect API manners...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`🎉 🎊 BATCH TRANSLATION SPECTACULAR COMPLETE!`)
  console.log(`🏆 Victories: ${results.filter(r => r.confidence && r.confidence > 0).length}/${results.length} successful translations`)
  console.log(`💎 Treasures: ${results.length} linguistic gems polished and ready!`)

  return results
}

/**
 * 🎯 Smart translation detection - detects if text needs translation
 */
export function needsTranslation(text: string, sourceLang: string, targetLang: string): boolean {
  if (sourceLang === targetLang) return false
  if (!text || text.trim().length === 0) return false

  // Simple heuristic: if text is very short and contains only common words, might not need translation
  // This can be enhanced with more sophisticated language detection
  return true
}

/**
 * 📊 Translation metrics and analytics
 */
export interface TranslationMetrics {
  totalRequests: number
  successfulTranslations: number
  failedTranslations: number
  averageTokensUsed: number
  averageDuration: number
  languagesUsed: Record<string, number>
}

export function calculateTranslationMetrics(translations: TranslationResponse[]): TranslationMetrics {
  const metrics: TranslationMetrics = {
    totalRequests: translations.length,
    successfulTranslations: 0,
    failedTranslations: 0,
    averageTokensUsed: 0,
    averageDuration: 0,
    languagesUsed: {}
  }

  let totalTokens = 0
  let totalDuration = 0

  translations.forEach(translation => {
    if (translation.confidence && translation.confidence > 0.5) {
      metrics.successfulTranslations++
    } else {
      metrics.failedTranslations++
    }

    if (translation.tokensUsed) {
      totalTokens += translation.tokensUsed
    }

    // Count language usage
    const langKey = `${translation.sourceLanguage}->${translation.targetLanguage}`
    metrics.languagesUsed[langKey] = (metrics.languagesUsed[langKey] || 0) + 1
  })

  metrics.averageTokensUsed = totalTokens / translations.length
  metrics.averageDuration = totalDuration / translations.length

  return metrics
}
