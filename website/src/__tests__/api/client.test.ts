// 🎭 API Client Test Theater - Where Our Client Performs Under Scrutiny! ✨
// Testing our magnificent API client with theatrical precision

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { APIClient, APIError } from '@/lib/api/client'
import { AudioJobData, MediaAssetData, AudioAssetData } from '@/types/api'

// 🎪 Mock fetch for our theatrical testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('🎭 API Client Theater', () => {
  let client: APIClient

  beforeEach(() => {
    // 🎬 Set up our stage for each performance
    client = new APIClient({
      baseURL: '/api/test',
      enableLogging: false,
      timeout: 5000,
      retryAttempts: 1
    })
    mockFetch.mockClear()
  })

  afterEach(() => {
    // 🎪 Clean up after each act
    vi.clearAllMocks()
  })

  describe('🎵 Audio Jobs API - The Musical Theater Section', () => {
    const mockAudioJob: AudioJobData = {
      id: 'job_123',
      post_id: 'post_456',
      status: 'pending',
      text_content: 'Test content',
      input_text: 'Test input',
      config: {
        voice: 'nova',
        voice_preference: 'female',
        personality: 'hybrid',
        speed: 1.0
      },
      languages: ['en'],
      completed_languages: [],
      audio_urls: {},
      translated_texts: { en: 'Test content' },
      language_statuses: { en: { status: 'pending', draft: false } },
      current_language: 'en',
      is_draft: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('🎪 should create audio job successfully', async () => {
      // Given - A successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAudioJob
        })
      })

      // When - We create an audio job
      const result = await client.createAudioJob({
        post_id: 'post_456',
        status: 'pending',
        text_content: 'Test content',
        input_text: 'Test input',
        config: { voice: 'nova' },
        languages: ['en'],
        completed_languages: [],
        audio_urls: {},
        translated_texts: { en: 'Test content' },
        is_draft: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      })

      // Then - We get the expected result
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAudioJob)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/audio-jobs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('🎭 should list audio jobs with filters', async () => {
      // Given - A successful API response with multiple jobs
      const mockJobs = [mockAudioJob, { ...mockAudioJob, id: 'job_124' }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockJobs
        })
      })

      // When - We list audio jobs with filters
      const result = await client.listAudioJobs({
        postId: 'post_456',
        status: 'pending',
        limit: 10
      })

      // Then - We get the filtered results
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockJobs)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/audio-jobs?postId=post_456&status=pending&limit=10',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('🎪 should handle API errors gracefully', async () => {
      // Given - An API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 'INVALID_AUDIO_JOB',
            message: 'The audio job parameters are invalid',
            status: 400,
            timestamp: '2024-01-01T00:00:00Z'
          }
        })
      })

      // When - We try to create an invalid audio job
      // Then - It should throw an APIError
      await expect(client.createAudioJob({} as any)).rejects.toThrow(APIError)
    })
  })

  describe('🖼️ Media Assets API - The Digital Gallery Section', () => {
    const mockMediaAsset: MediaAssetData = {
      id: 'asset_123',
      title: 'Test Asset',
      file_url: 'https://example.com/asset.mp3',
      file_type: 'audio',
      mime_type: 'audio/mpeg',
      file_size_bytes: 1024000,
      related_post_id: 'post_456',
      status: 'ready',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('🎨 should create media asset successfully', async () => {
      // Given - A successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMediaAsset
        })
      })

      // When - We create a media asset
      const result = await client.createMediaAsset({
        title: 'Test Asset',
        file_url: 'https://example.com/asset.mp3',
        file_type: 'audio',
        mime_type: 'audio/mpeg',
        file_size_bytes: 1024000,
        status: 'ready',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      })

      // Then - We get the expected result
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockMediaAsset)
    })

    it('🎪 should list media assets with type filter', async () => {
      // Given - A successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockMediaAsset]
        })
      })

      // When - We list media assets filtered by type
      const result = await client.listMediaAssets({ type: 'audio' })

      // Then - We get the filtered results
      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockMediaAsset])
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/media-assets?type=audio',
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('📝 Posts API - The Content Theater Section', () => {
    const mockAudioAsset: AudioAssetData = {
      id: 'audio_123',
      post_id: 'post_456',
      file_url: 'https://example.com/audio.mp3',
      file_type: 'audio',
      mime_type: 'audio/mpeg',
      file_size_bytes: 2048000,
      language: 'en',
      title: 'Test Audio',
      duration_seconds: 120,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('🎵 should get post audio assets', async () => {
      // Given - A successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockAudioAsset]
        })
      })

      // When - We get audio assets for a post
      const result = await client.getPostAudioAssets('post_456')

      // Then - We get the audio assets
      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockAudioAsset])
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/posts/post_456/audio-assets',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('🎪 should add audio asset to post', async () => {
      // Given - A successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAudioAsset
        })
      })

      // When - We add an audio asset to a post
      const result = await client.addPostAudioAsset('post_456', mockAudioAsset)

      // Then - We get the added asset
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockAudioAsset)
    })
  })

  describe('🎪 Error Handling & Retry Logic', () => {
    it('🎭 should retry on server errors', async () => {
      // Given - First call fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Server error' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { id: 'test' } })
        })

      // When - We make a request
      const result = await client.getAudioJob('test_id')

      // Then - It should succeed after retry
      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('🎪 should not retry on client errors', async () => {
      // Given - A client error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid request',
            status: 400,
            timestamp: '2024-01-01T00:00:00Z'
          }
        })
      })

      // When - We make an invalid request
      // Then - It should throw immediately without retry
      await expect(client.getAudioJob('invalid_id')).rejects.toThrow(APIError)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('🎨 Caching & Performance', () => {
    it('🎪 should cache GET requests', async () => {
      // Given - A successful API response
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, data: { id: 'cached_test' } })
      }
      mockFetch.mockResolvedValue(mockResponse)

      // When - We make the same GET request twice
      await client.getAudioJob('test_id')
      await client.getAudioJob('test_id')

      // Then - Fetch should only be called once (second is cached)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('🎭 should provide cache statistics', () => {
      // When - We get cache stats
      const stats = client.getCacheStats()

      // Then - We get cache information
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('keys')
      expect(Array.isArray(stats.keys)).toBe(true)
    })

    it('🎪 should clear cache when requested', () => {
      // When - We clear the cache
      client.clearCache()

      // Then - Cache should be empty
      const stats = client.getCacheStats()
      expect(stats.size).toBe(0)
    })
  })
})

// 🎭 APIError Class Tests
describe('🎪 APIError Class Theater', () => {
  it('🎵 should create APIError with all properties', () => {
    // Given - Error details
    const error = new APIError('Test error', 'TEST_ERROR', 400, {
      error: {
        code: 'TEST_ERROR',
        message: 'Test error',
        status: 400,
        timestamp: '2024-01-01T00:00:00Z'
      }
    })

    // Then - Error should have all properties
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_ERROR')
    expect(error.status).toBe(400)
    expect(error.name).toBe('APIError')
  })

  it('🎭 should identify retryable errors', () => {
    // Given - Different types of errors
    const serverError = new APIError('Server error', 'SERVER_ERROR', 500)
    const rateLimitError = new APIError('Rate limited', 'RATE_LIMITED', 429)
    const clientError = new APIError('Bad request', 'BAD_REQUEST', 400)

    // Then - Should correctly identify retryable errors
    expect(serverError.isRetryable()).toBe(true)
    expect(rateLimitError.isRetryable()).toBe(true)
    expect(clientError.isRetryable()).toBe(false)
  })

  it('🎪 should identify error types', () => {
    // Given - Different error types
    const clientError = new APIError('Bad request', 'BAD_REQUEST', 400)
    const serverError = new APIError('Server error', 'SERVER_ERROR', 500)

    // Then - Should correctly identify error types
    expect(clientError.isClientError()).toBe(true)
    expect(clientError.isServerError()).toBe(false)
    expect(serverError.isClientError()).toBe(false)
    expect(serverError.isServerError()).toBe(true)
  })
})