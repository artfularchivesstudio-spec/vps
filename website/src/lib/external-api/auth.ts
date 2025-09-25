import { NextRequest } from 'next/server'
import { createClientForAPI } from '@/lib/supabase/server'
import { createHash } from 'crypto'

/**
 * @file /Users/gurindersingh/Documents/Developer/website/src/lib/external-api/auth.ts
 * @description
 * The gatekeeper of our digital fortress, the guardian of the API's sacred halls.
 * This script is the first line of defense, the watchful eye that scrutinizes every
 * request, demanding the secret handshake (the API key) before granting passage.
 *
 * Herein lies the logic for authenticating external API requests, a delicate dance
 * of hashing, database lookups, and rate limit checks. It's a world of shadows
 * and secrets, where every request is a potential friend or foe.
 */
export interface ExternalAPIKey {
  id: string // A unique identifier, known only to the gatekeeper and the king.
  name: string // A name to be remembered, a title to be honored.
  key_hash: string // The key's secret soul, a hash that whispers its identity.
  scopes: string[] // The realms it can access, the doors it can open.
  rate_limit: number // The number of times it can knock before being turned away.
  created_by: string // The one who forged the key, the master of its destiny.
  expires_at: Date | null // The day the key turns to dust, its power extinguished.
  last_used: Date | null // A memory of its last use, a whisper of its recent past.
  is_active: boolean // A switch to grant or revoke its power, a simple yet potent spell.
  created_at: Date // The moment of its creation, a timestamp etched in the annals of the kingdom.
  updated_at: Date // The moment of its alteration, a record of its evolving power.
}

/**
 * @interface AuthContext
 * @description
 * The context of the court, the state of the visitor's plea.
 * It tells us if the visitor is a friend, what powers they wield, and how many
 * more times they can ask for favors.
 */
export interface AuthContext {
  isAuthenticated: boolean // Is the visitor a friend or a stranger?
  apiKey?: ExternalAPIKey // The key they presented, if any.
  userId?: string // The soul behind the key, the one who seeks entry.
  scopes: string[] // The realms they have been granted access to.
  rateLimitRemaining: number // The number of favors they have left.
}

/**
 * @interface APIResponse
 * @description
 * The king's decree, the response to the visitor's plea.
 * It can be a treasure chest of data, a map to new lands, or a simple, stern 'nay'.
 */
export interface APIResponse<T = any> {
  success: boolean // Was the plea granted?
  data?: T // The treasures bestowed.
  error?: string // The reason for the denial.
  meta?: { // The fine print of the decree.
    pagination?: { // For when the treasures are too many to count at once.
      page: number
      limit: number
      total: number
      totalPages: number
    }
    rateLimit?: { // A reminder of the king's generosity, and its limits.
      limit: number
      remaining: number
      reset: number
    }
  }
}

/**
 * @class ExternalAPIAuth
 * @description
 * The gatekeeper himself, a class of formidable power and unwavering vigilance.
 * He is the one who checks the keys, consults the royal records, and ultimately
 * decides who is worthy of an audience with the API.
 */
export class ExternalAPIAuth {
  private get supabase() {
    // The gatekeeper's private line to the royal archivist.
    return createClientForAPI()
  }

  /**
   * @method authenticate
   * @description
   * The moment of truth, the trial by fire. The gatekeeper inspects the key,
   * consults the ancient scrolls (the database), and delivers his verdict.
   * @param {NextRequest} request - The visitor, standing at the gate, holding their key.
   * @returns {Promise<AuthContext>} - The gatekeeper's judgment, a context for the royal court.
   */
  async authenticate(request: NextRequest): Promise<AuthContext> {
    try {
      const authHeader = request.headers.get('Authorization')
      const apiKey = this.extractApiKey(authHeader)

      if (!apiKey) {
        return {
          isAuthenticated: false,
          scopes: [],
          rateLimitRemaining: 0
        }
      }

      // A whisper in the dark, a hash that reveals nothing, yet confirms everything.
      const keyHash = this.hashApiKey(apiKey)

      // The gatekeeper consults the royal records, seeking a match.
      const { data: apiKeyData, error } = await this.supabase
        .from('external_api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single()

      if (error || !apiKeyData) {
        return {
          isAuthenticated: false,
          scopes: [],
          rateLimitRemaining: 0
        }
      }

      // The key may be old and brittle, its magic faded.
      if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
        return {
          isAuthenticated: false,
          scopes: [],
          rateLimitRemaining: 0
        }
      }

      // Even the most trusted allies must not overstay their welcome.
      const rateLimitCheck = await this.checkRateLimit(apiKeyData)
      if (!rateLimitCheck.allowed) {
        return {
          isAuthenticated: false,
          scopes: apiKeyData.scopes || [],
          rateLimitRemaining: rateLimitCheck.remaining
        }
      }

      // A quick note in the royal journal, to mark the visitor's passage.
      await this.updateLastUsed(apiKeyData.id)

      return {
        isAuthenticated: true,
        apiKey: apiKeyData,
        userId: apiKeyData.created_by,
        scopes: apiKeyData.scopes || [],
        rateLimitRemaining: rateLimitCheck.remaining
      }
    } catch (error) {
      console.error('A disturbance at the gate. The authentication ritual has failed:', error)
      return {
        isAuthenticated: false,
        scopes: [],
        rateLimitRemaining: 0
      }
    }
  }

  /**
   * @method hasScope
   * @description
   * Does the visitor have the right to enter this particular chamber?
   * A simple question, with a profound impact.
   * @param {AuthContext} context - The visitor's credentials.
   * @param {string} requiredScope - The chamber they wish to enter.
   * @returns {boolean} - A simple 'aye' or 'nay'.
   */
  hasScope(context: AuthContext, requiredScope: string): boolean {
    // The wildcard, a key that opens all doors.
    return context.scopes.includes(requiredScope) || context.scopes.includes('*')
  }

  /**
   * @method extractApiKey
   * @description
   * The art of the pickpocket, plucking the key from the visitor's pocket
   * without them ever knowing. (Metaphorically, of course.)
   * @param {string | null} authHeader - The visitor's coat, where the key might be hidden.
   * @returns {string | null} - The key, if found. Otherwise, naught but lint.
   */
  private extractApiKey(authHeader: string | null): string | null {
    if (!authHeader) return null
    
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    return match ? match[1] : null
  }

  /**
   * @method hashApiKey
   * @description
   * The alchemist's trick, turning a plain key into a string of gibberish
   * that only the gatekeeper can understand. A secret handshake, in cryptographic form.
   * @param {apiKey} string - The key in its raw, vulnerable form.
   * @returns {string} - The key's secret soul, its hashed essence.
   */
  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex')
  }

  /**
   * @method checkRateLimit
   * @description
   * The royal accountant, tallying the visitor's requests and ensuring they
   * do not take advantage of the king's generosity.
   * @param {ExternalAPIKey} apiKey - The key of the visitor in question.
   * @returns {Promise<{ allowed: boolean; remaining: number; reset: number }>} - The accountant's report.
   */
  private async checkRateLimit(apiKey: ExternalAPIKey): Promise<{
    allowed: boolean
    remaining: number
    reset: number
  }> {
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute window
    const windowStart = now - windowMs

    try {
      // The accountant pores over the records of the past minute.
      const { data: requests, error } = await this.supabase
        .from('api_request_logs')
        .select('id')
        .eq('api_key_id', apiKey.id)
        .gte('created_at', new Date(windowStart).toISOString())

      if (error) {
        console.error('The royal accountant is in a tizzy. Rate limit check error:', error)
        return { allowed: false, remaining: 0, reset: now + windowMs }
      }

      const requestCount = requests?.length || 0
      const remaining = Math.max(0, apiKey.rate_limit - requestCount)
      const allowed = remaining > 0

      return {
        allowed,
        remaining,
        reset: now + windowMs
      }
    } catch (error) {
      console.error('The royal accountant has dropped his abacus. Rate limit check error:', error)
      return { allowed: false, remaining: 0, reset: now + windowMs }
    }
  }

  /**
   * @method updateLastUsed
   * @description
   * A quick scribble in the margins of the royal records, noting the key's recent activity.
   * @param {string} apiKeyId - The ID of the key that was just used.
   */
  private async updateLastUsed(apiKeyId: string): Promise<void> {
    try {
      await this.supabase
        .from('external_api_keys')
        .update({ last_used: new Date().toISOString() })
        .eq('id', apiKeyId)
    } catch (error) {
      console.error('The scribe\'s quill has snapped. Failed to update last used:', error)
    }
  }

  /**
   * @method logRequest
   * @description
   * The royal chronicler, dutifully recording every interaction with the API.
   * For posterity, for security, and for the king's amusement.
   * @param {string} apiKeyId - The key of the visitor.
   * @param {string} method - The nature of their request.
   * @param {string} path - The chamber they visited.
   * @param {number} statusCode - The outcome of their visit.
   * @param {number} responseTime - How long they stayed.
   */
  async logRequest(
    apiKeyId: string,
    method: string,
    path: string,
    statusCode: number,
    responseTime: number
  ): Promise<void> {
    try {
      await this.supabase
        .from('api_request_logs')
        .insert({
          api_key_id: apiKeyId,
          method,
          path,
          status_code: statusCode,
          response_time_ms: responseTime,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('The royal chronicler has run out of ink. Failed to log API request:', error)
    }
  }

  /**
   * @method generateApiKey
   * @description
   * The royal blacksmith, forging a new key from the fires of randomness.
   * It's a delicate art, a blend of science and luck.
   * @returns {string} - A shiny new key, ready to be bestowed.
   */
  generateApiKey(): string {
    const prefix = 'aa_' // The mark of the royal blacksmith.
    const randomBytes = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15)
    return prefix + randomBytes
  }

  /**
   * @method createApiKey
   * @description
   * The royal ceremony of bestowing a new key. The key is forged, its soul
   * is hashed, and it is entered into the royal records.
   * @param {string} name - The name of the new key holder.
   * @param {string[]} scopes - The realms they are granted access to.
   * @param {number} rateLimit - The limits of their welcome.
   * @param {Date} expiresAt - The day their welcome expires.
   * @param {string} createdBy - The one who requested the key.
   * @returns {Promise<{ apiKey: string; id: string }>} - The new key, and its place in the records.
   */
  async createApiKey(
    name: string,
    scopes: string[],
    rateLimit: number = 100,
    expiresAt?: Date,
    createdBy?: string
  ): Promise<{ apiKey: string; id: string }> {
    const apiKey = this.generateApiKey()
    const keyHash = this.hashApiKey(apiKey)

    const { data, error } = await this.supabase
      .from('external_api_keys')
      .insert({
        name,
        key_hash: keyHash,
        scopes,
        rate_limit: rateLimit,
        expires_at: expiresAt?.toISOString() || null,
        created_by: createdBy,
        is_active: true
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`The blacksmith\'s hammer has slipped. Failed to create API key: ${error.message}`)
    }

    return { apiKey, id: data.id }
  }
}

/**
 * @function createAPIResponse
 * @description
 * A standardized carrier pigeon for delivering the king's messages.
 * It ensures every message, whether good or bad, is delivered with the same royal seal.
 * @template T
 * @param {T} [data] - The treasure, if the plea was granted.
 * @param {string} [error] - The reason for denial, if it was not.
 * @param {APIResponse<T>['meta']} [meta] - The fine print.
 * @returns {APIResponse<T>} - The king's message, ready for delivery.
 */
export function createAPIResponse<T>(
  data?: T,
  error?: string,
  meta?: APIResponse<T>['meta']
): APIResponse<T> {
  return {
    success: !error,
    data,
    error,
    meta
  }
}

/**
 * @function createErrorResponse
 * @description
 * A raven, bearing bad news. It delivers the king's denial with the appropriate
 * level of solemnity (and a proper HTTP status code).
 * @param {string} error - The bad news.
 * @param {number} [statusCode=500] - The level of solemnity.
 * @returns {Response} - The raven, in flight.
 */
export function createErrorResponse(
  error: string,
  statusCode: number = 500
): Response {
  return Response.json(
    createAPIResponse(undefined, error),
    { status: statusCode }
  )
}

/**
 * @function createSuccessResponse
 * @description
 * A dove, bearing good news. It delivers the king's favor with a flourish
 * and a 200 status code.
 * @template T
 * @param {T} data - The good news.
 * @param {APIResponse<T>['meta']} [meta] - Any additional good news.
 * @returns {Response} - The dove, in flight.
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: APIResponse<T>['meta']
): Response {
  return Response.json(
    createAPIResponse(data, undefined, meta),
    { status: 200 }
  )
}

// Export singleton instance - the one and only gatekeeper, ever vigilant.
export const externalAPIAuth = new ExternalAPIAuth()