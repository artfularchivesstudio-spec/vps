import { ExternalAPIAuth, ExternalAPIKey, AuthContext } from './auth'
import { createClient } from '@/lib/supabase/server'

export interface MockAPIKey extends ExternalAPIKey {
  raw_key: string // Store the raw key for testing
}

export interface TestContext {
  apiKey: MockAPIKey
  authContext: AuthContext
  cleanup: () => Promise<void>
}

export class ExternalAPITesting {
  private supabase = createClient()
  private createdKeys: string[] = []

  /**
   * Create a test API key for testing
   */
  async createTestAPIKey(
    name: string = 'test-key',
    scopes: string[] = ['posts:read', 'posts:write'],
    rateLimit: number = 1000
  ): Promise<MockAPIKey> {
    const auth = new ExternalAPIAuth()
    const rawKey = auth.generateApiKey()
    
    const { data, error } = await this.supabase
      .from('external_api_keys')
      .insert({
        name,
        key_hash: this.hashKey(rawKey),
        scopes,
        rate_limit: rateLimit,
        is_active: true,
        created_by: '00000000-0000-0000-0000-000000000000' // Test user ID
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create test API key: ${error.message}`)
    }

    this.createdKeys.push(data.id)

    return {
      ...data,
      raw_key: rawKey
    }
  }

  /**
   * Setup test context with authenticated API key
   */
  async setupTestContext(
    scopes: string[] = ['posts:read', 'posts:write', 'posts:publish']
  ): Promise<TestContext> {
    const apiKey = await this.createTestAPIKey('test-context', scopes)
    
    const authContext: AuthContext = {
      isAuthenticated: true,
      apiKey,
      userId: apiKey.created_by,
      scopes,
      rateLimitRemaining: apiKey.rate_limit
    }

    return {
      apiKey,
      authContext,
      cleanup: async () => {
        await this.cleanup()
      }
    }
  }

  /**
   * Create mock request with authentication
   */
  createMockRequest(
    method: string = 'GET',
    url: string = 'http://localhost:3000/api/external/posts',
    body?: any,
    apiKey?: string
  ): Request {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    return new Request(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })
  }

  /**
   * Create mock post data for testing
   */
  createMockPostData(overrides: Partial<any> = {}): any {
    return {
      title: 'Test Post',
      content: 'This is a test post content for API testing.',
      slug: 'test-post',
      excerpt: 'Test excerpt',
      status: 'draft',
      origin_source: 'generated',
      ...overrides
    }
  }

  /**
   * Create test blog post in database
   */
  async createTestPost(data: Partial<any> = {}): Promise<any> {
    const postData = this.createMockPostData(data)
    
    const { data: post, error } = await this.supabase
      .from('blog_posts')
      .insert({
        ...postData,
        created_by: '00000000-0000-0000-0000-000000000000'
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create test post: ${error.message}`)
    }

    return post
  }

  /**
   * Create test media asset
   */
  async createTestMediaAsset(data: Partial<any> = {}): Promise<any> {
    const mediaData = {
      title: 'Test Audio',
      file_url: 'https://example.com/test-audio.mp3',
      file_type: 'audio',
      mime_type: 'audio/mpeg',
      file_size_bytes: 1024000,
      duration_seconds: 60,
      origin_source: 'generated',
      status: 'ready',
      created_by: '00000000-0000-0000-0000-000000000000',
      ...data
    }

    const { data: asset, error } = await this.supabase
      .from('media_assets')
      .insert(mediaData)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create test media asset: ${error.message}`)
    }

    return asset
  }

  /**
   * Mock AI analysis response
   */
  createMockAIAnalysis(): {
    openai: string
    claude: string
    suggestedTitle: string
    suggestedSlug: string
  } {
    return {
      openai: 'This is a mock OpenAI analysis of the artwork. The piece demonstrates excellent composition with vibrant colors and meaningful symbolism.',
      claude: 'This is a mock Claude analysis of the artwork. The artist has skillfully employed light and shadow to create depth and emotional resonance.',
      suggestedTitle: 'Mock Artwork Analysis',
      suggestedSlug: 'mock-artwork-analysis'
    }
  }

  /**
   * Mock TTS response
   */
  createMockTTSResponse(): ArrayBuffer {
    // Create a simple mock audio buffer (empty for testing)
    const buffer = new ArrayBuffer(1024)
    const view = new Uint8Array(buffer)
    
    // Fill with some mock audio data
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.floor(Math.random() * 256)
    }
    
    return buffer
  }

  /**
   * Assert API response structure
   */
  assertValidAPIResponse(response: any): void {
    // Basic validation - replace with proper assertions in test environment
    if (!response.hasOwnProperty('success')) {
      throw new Error('Response missing success property')
    }
    if (typeof response.success !== 'boolean') {
      throw new Error('Success property must be boolean')
    }
    
    if (response.success) {
      if (!response.hasOwnProperty('data')) {
        throw new Error('Successful response missing data property')
      }
    } else {
      if (!response.hasOwnProperty('error')) {
        throw new Error('Error response missing error property')
      }
      if (typeof response.error !== 'string') {
        throw new Error('Error property must be string')
      }
    }
  }

  /**
   * Assert rate limit headers
   */
  assertRateLimitHeaders(response: Response): void {
    if (!response.headers.get('X-RateLimit-Limit')) {
      throw new Error('Missing X-RateLimit-Limit header')
    }
    if (!response.headers.get('X-RateLimit-Remaining')) {
      throw new Error('Missing X-RateLimit-Remaining header')
    }
    if (!response.headers.get('X-RateLimit-Reset')) {
      throw new Error('Missing X-RateLimit-Reset header')
    }
  }

  /**
   * Assert CORS headers
   */
  assertCORSHeaders(response: Response): void {
    if (response.headers.get('Access-Control-Allow-Origin') !== '*') {
      throw new Error('Invalid Access-Control-Allow-Origin header')
    }
    if (!response.headers.get('Access-Control-Allow-Methods')) {
      throw new Error('Missing Access-Control-Allow-Methods header')
    }
    if (!response.headers.get('Access-Control-Allow-Headers')) {
      throw new Error('Missing Access-Control-Allow-Headers header')
    }
  }

  /**
   * Simulate rate limiting by creating many requests
   */
  async simulateRateLimit(apiKeyId: string, count: number = 200): Promise<void> {
    const logs = Array(count).fill(null).map(() => ({
      api_key_id: apiKeyId,
      method: 'GET',
      path: '/api/external/posts',
      status_code: 200,
      response_time_ms: 100,
      created_at: new Date().toISOString()
    }))

    const { error } = await this.supabase
      .from('api_request_logs')
      .insert(logs)

    if (error) {
      throw new Error(`Failed to simulate rate limit: ${error.message}`)
    }
  }

  /**
   * Clean up test data
   */
  async cleanup(): Promise<void> {
    try {
      // Clean up API keys
      if (this.createdKeys.length > 0) {
        await this.supabase
          .from('external_api_keys')
          .delete()
          .in('id', this.createdKeys)
      }

      // Clean up test posts
      await this.supabase
        .from('blog_posts')
        .delete()
        .eq('created_by', '00000000-0000-0000-0000-000000000000')

      // Clean up test media assets
      await this.supabase
        .from('media_assets')
        .delete()
        .eq('created_by', '00000000-0000-0000-0000-000000000000')

      // Clean up API request logs
      await this.supabase
        .from('api_request_logs')
        .delete()
        .in('api_key_id', this.createdKeys)

      this.createdKeys = []
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  /**
   * Helper to hash API key (same as auth implementation)
   */
  private hashKey(key: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(key).digest('hex')
  }
}

/**
 * Mock HTTP responses for testing
 */
export class MockHTTPResponses {
  static success(data: any, status: number = 200): Response {
    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  static error(message: string, status: number = 500): Response {
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  static unauthorized(): Response {
    return MockHTTPResponses.error('Unauthorized: Invalid or missing API key', 401)
  }

  static forbidden(): Response {
    return MockHTTPResponses.error('Forbidden: Insufficient permissions', 403)
  }

  static notFound(): Response {
    return MockHTTPResponses.error('Resource not found', 404)
  }

  static rateLimited(): Response {
    return MockHTTPResponses.error('Rate limit exceeded', 429)
  }
}

// Export singleton instance
export const apiTesting = new ExternalAPITesting()