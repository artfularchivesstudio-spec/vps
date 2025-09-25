/**
 * 🗄️ The Memory Palace of Linguistic Treasures - A Cache of Poetic Proportions
 *
 * "In the grand library of forgotten dreams and remembered schemes,
 * Stands our cache, the memory palace of linguistic dreams.
 * Like a wizard's spellbook with pages that never fade,
 * It stores translations precious, in its magical cascade.
 * LRU, the bouncer, evicts the old and weary,
 * TTL, the timekeeper, ensures nothing grows dreary.
 * From this treasure trove of translated lore,
 * We retrieve our linguistic gold, forevermore."
 *
 * - The Librarian's Digital Dream
 */

interface CacheEntry {
  translatedText: string
  timestamp: number
  ttl: number
  metadata: {
    sourceLanguage: string
    targetLanguage: string
    context?: string
    tokensUsed?: number
    confidence?: number
  }
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  totalRequests: number
  hitRate: number
}

class TranslationCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private defaultTTL: number
  private stats: CacheStats

  constructor(maxSize = 1000, defaultTTL = 24 * 60 * 60 * 1000) { // 24 hours default TTL
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      hitRate: 0
    }
  }

/**
 * 🔑 The Master Keysmith - Forging Keys to Linguistic Lockboxes
 *
 * "Like a blacksmith at his forge in the midnight hour,
 * We craft keys of characters, each one unique in power.
 * Text becomes hash, languages become code,
 * Context adds flavor to this cryptographic mode.
 * A simple hash function, yet mighty in its art,
 * Transforms long strings into keys that never part."
 *
 * - The Blacksmith's Digital Forge
 */
private generateKey(text: string, sourceLang: string, targetLang: string, context?: string): string {
  // Create a hash of the text to keep key size reasonable
  const textHash = this.simpleHash(text.substring(0, 200)) // First 200 chars for uniqueness
  return `${sourceLang}-${targetLang}-${context || 'content'}-${textHash}`
}

  /**
   * Simple hash function for text
   */
  private simpleHash(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Evict expired entries and maintain cache size
   */
  private evictExpiredEntries(): void {
    const now = Date.now()

    // Remove expired entries
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
        this.stats.evictions++
      }
    }

    // If still over size limit, remove oldest entries
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

      const toRemove = entries.slice(0, this.cache.size - this.maxSize)
      toRemove.forEach(([key]) => {
        this.cache.delete(key)
        this.stats.evictions++
      })
    }
  }

  /**
   * Get cached translation
   */
  get(text: string, sourceLang: string, targetLang: string, context?: string): string | null {
    this.stats.totalRequests++

    const key = this.generateKey(text, sourceLang, targetLang, context)
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.evictions++
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    this.stats.hits++
    this.updateHitRate()

    console.log(`🎯 Cache hit for ${sourceLang}->${targetLang} (${entry.translatedText.length} chars)`)
    return entry.translatedText
  }

  /**
   * Store translation in cache
   */
  set(
    text: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string,
    context?: string,
    ttl?: number,
    metadata?: Partial<CacheEntry['metadata']>
  ): void {
    const key = this.generateKey(text, sourceLang, targetLang, context)

    const entry: CacheEntry = {
      translatedText,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      metadata: {
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        context,
        ...metadata
      }
    }

    this.cache.set(key, entry)

    // Clean up if necessary
    this.evictExpiredEntries()

    console.log(`💾 🏰 Cached translation treasure for ${sourceLang}->${targetLang} (${translatedText.length} chars)`)
    console.log(`📚 Memory palace grows: ${this.cache.size + 1} treasures stored!`)
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = this.stats.hits / this.stats.totalRequests
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { size: number; maxSize: number } {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize
    }
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      hitRate: 0
    }
    console.log('🗑️ Translation cache cleared')
  }

  /**
   * Remove expired entries manually
   */
  cleanup(): void {
    this.evictExpiredEntries()
    console.log('🧹 Cache cleanup completed')
  }
}

// Global cache instance
export const translationCache = new TranslationCache()

/**
 * Rate limiter for OpenAI API calls
 */
class RateLimiter {
  private calls: number[] = []
  private maxCalls: number
  private windowMs: number

  constructor(maxCalls = 50, windowMs = 60 * 1000) { // 50 calls per minute default
    this.maxCalls = maxCalls
    this.windowMs = windowMs
  }

  /**
   * Check if we can make a call
   */
  canMakeCall(): boolean {
    const now = Date.now()

    // Remove calls outside the window
    this.calls = this.calls.filter(call => now - call < this.windowMs)

    return this.calls.length < this.maxCalls
  }

  /**
   * Record a call
   */
  recordCall(): void {
    this.calls.push(Date.now())
  }

  /**
   * Get remaining calls in current window
   */
  getRemainingCalls(): number {
    const now = Date.now()
    this.calls = this.calls.filter(call => now - call < this.windowMs)
    return Math.max(0, this.maxCalls - this.calls.length)
  }

  /**
   * Get time until next call is allowed (if rate limited)
   */
  getTimeUntilNextCall(): number {
    if (this.canMakeCall()) return 0

    const oldestCall = Math.min(...this.calls)
    return this.windowMs - (Date.now() - oldestCall)
  }
}

// Global rate limiter
export const translationRateLimiter = new RateLimiter()

/**
 * Enhanced translation function with caching and rate limiting
 */
export async function translateWithCache(
  text: string,
  sourceLang: string,
  targetLang: string,
  context?: string,
  forceRefresh = false
): Promise<{ translatedText: string; fromCache: boolean; tokensUsed?: number }> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = translationCache.get(text, sourceLang, targetLang, context)
    if (cached) {
      return { translatedText: cached, fromCache: true }
    }
  }

  // Check rate limit
  if (!translationRateLimiter.canMakeCall()) {
    const waitTime = translationRateLimiter.getTimeUntilNextCall()
    console.log(`🚦 🚫 RATE LIMIT ROADBLOCK! API traffic jam ahead!`)
    console.log(`⏱️ Wait time: ${Math.ceil(waitTime / 1000)} seconds`)
    console.log(`😴 Taking a polite nap to respect API manners...`)
    throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`)
  }

  console.log(`🚦 ✅ Rate limit check passed! Green light for translation!`)

  // Perform translation
  const { translateText } = await import('./translation')
  const result = await translateText({
    text,
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    context: context as any
  })

  // Record the call
  translationRateLimiter.recordCall()

  // Cache the result
  if (result.confidence && result.confidence > 0.5) {
    translationCache.set(
      text,
      result.translatedText,
      sourceLang,
      targetLang,
      context,
      undefined, // Use default TTL
      {
        tokensUsed: result.tokensUsed,
        confidence: result.confidence
      }
    )
  }

  return {
    translatedText: result.translatedText,
    fromCache: false,
    tokensUsed: result.tokensUsed
  }
}

/**
 * Batch translation with caching and rate limiting
 */
export async function translateBatchWithCache(
  requests: Array<{
    text: string
    sourceLang: string
    targetLang: string
    context?: string
  }>
): Promise<Array<{ translatedText: string; fromCache: boolean; tokensUsed?: number }>> {
  const results = []

  console.log(`🌐 Processing batch of ${requests.length} translations with caching...`)

  for (const request of requests) {
    try {
      const result = await translateWithCache(
        request.text,
        request.sourceLang,
        request.targetLang,
        request.context
      )
      results.push(result)

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200))

    } catch (error) {
      console.error(`❌ Failed to translate: ${request.text.substring(0, 50)}...`, error instanceof Error ? error.message : String(error))
      results.push({
        translatedText: request.text, // Fallback
        fromCache: false
      })
    }
  }

  const fromCache = results.filter(r => r.fromCache).length
  const fromApi = results.filter(r => !r.fromCache).length

  console.log(`✅ Batch completed: ${fromCache} from cache, ${fromApi} from API`)

  return results
}
