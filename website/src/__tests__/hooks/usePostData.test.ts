// 🎭 usePostData Hook Test Theater - Where Hooks Perform Under the Spotlight! ✨
// Testing our magnificent enhanced hook with theatrical precision

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePostData } from '@/hooks/usePostData'
import { AudioAssetData, AudioJobData, PrimaryAudioData } from '@/types/api'
import * as apiClient from '@/lib/api/client'

// 🎪 Mock our API client
vi.mock('@/lib/api/client', () => ({
  default: {
    getPostAudioAssets: vi.fn(),
    addPostAudioAsset: vi.fn(),
    setPostPrimaryAudio: vi.fn(),
    createAudioJob: vi.fn(),
    listAudioJobs: vi.fn()
  },
  APIError: class APIError extends Error {
    constructor(message: string, public code: string, public status: number) {
      super(message)
      this.name = 'APIError'
    }
  }
}))

// 🎪 Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              id: 'post_123',
              title: 'Test Post',
              slug: 'test-post',
              content: 'Test content',
              excerpt: 'Test excerpt',
              featured_image_url: null,
              published_at: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              status: 'draft',
              author: {
                id: 1,
                name: 'Test Author',
                email: 'test@example.com',
                avatar_url: null
              },
              categories: [],
              tags: [],
              audio_assets_by_language: {},
              template_type: 'standard',
              seo_metadata: {},
              reading_time: 5,
              revision_number: 1,
              title_translations: {},
              content_translations: {},
              excerpt_translations: {}
            },
            error: null
          })
        })
      })
    })
  })
}))

const mockApiClient = apiClient.default as any

describe('🎭 usePostData Hook Theater', () => {
  beforeEach(() => {
    // 🎬 Reset all mocks before each performance
    vi.clearAllMocks()
  })

  describe('🎪 Core Post Data Management', () => {
    it('🎵 should fetch and transform post data successfully', async () => {
      // Given - Mock successful audio assets response
      mockApiClient.getPostAudioAssets.mockResolvedValue({
        success: true,
        data: []
      })

      // When - We use the hook
      const { result } = renderHook(() => usePostData('post_123'))

      // Then - Initially loading
      expect(result.current.loading).toBe(true)
      expect(result.current.post).toBe(null)

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Then - Post data should be loaded and transformed
      expect(result.current.post).toEqual({
        id: 'post_123',
        slug: 'test-post',
        title: 'Test Post',
        content: 'Test content',
        excerpt: 'Test excerpt',
        featured_image_url: null,
        author_id: 1,
        status: 'draft',
        template_type: 'standard',
        reading_time: 5,
        revision_number: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        published_at: null,
        title_translations: {},
        content_translations: {},
        excerpt_translations: {},
        audio_assets_by_language: {},
        seo_metadata: {},
        author: {
          id: 1,
          name: 'Test Author',
          email: 'test@example.com',
          avatar_url: null
        },
        categories: [],
        tags: []
      })
      expect(result.current.error).toBe(null)
    })

    it('🎭 should handle post loading errors gracefully', async () => {
      // Given - Mock Supabase error
      vi.mocked(require('@/lib/supabase/client').createClient).mockReturnValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: null,
                error: { message: 'Post not found' }
              })
            })
          })
        })
      })

      // When - We use the hook
      const { result } = renderHook(() => usePostData('invalid_post'))

      // Wait for error
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Then - Should have error state
      expect(result.current.error).toBe('Post not found')
      expect(result.current.post).toBe(null)
    })
  })

  describe('🎵 Audio Assets Management Theater', () => {
    const mockAudioAsset: AudioAssetData = {
      id: 'audio_123',
      post_id: 'post_123',
      file_url: 'https://example.com/audio.mp3',
      file_type: 'audio',
      mime_type: 'audio/mpeg',
      file_size_bytes: 1024000,
      language: 'en',
      title: 'Test Audio',
      duration_seconds: 120,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('🎪 should fetch audio assets automatically', async () => {
      // Given - Mock successful responses
      mockApiClient.getPostAudioAssets.mockResolvedValue({
        success: true,
        data: [mockAudioAsset]
      })

      // When - We use the hook
      const { result } = renderHook(() => usePostData('post_123'))

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Then - Audio assets should be loaded
      expect(result.current.audioAssets).toEqual([mockAudioAsset])
      expect(result.current.audioLoading).toBe(false)
      expect(result.current.audioError).toBe(null)
      expect(mockApiClient.getPostAudioAssets).toHaveBeenCalledWith('post_123')
    })

    it('🎭 should add audio asset successfully', async () => {
      // Given - Mock successful responses
      mockApiClient.getPostAudioAssets.mockResolvedValue({
        success: true,
        data: []
      })
      mockApiClient.addPostAudioAsset.mockResolvedValue({
        success: true,
        data: mockAudioAsset
      })

      // When - We use the hook and add an asset
      const { result } = renderHook(() => usePostData('post_123'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Add audio asset
      await result.current.addAudioAsset(mockAudioAsset)

      // Then - Asset should be added to local state
      expect(result.current.audioAssets).toContain(mockAudioAsset)
      expect(mockApiClient.addPostAudioAsset).toHaveBeenCalledWith('post_123', mockAudioAsset)
    })

    it('🎪 should handle audio asset errors', async () => {
      // Given - Mock error response
      mockApiClient.getPostAudioAssets.mockResolvedValue({
        success: false,
        message: 'Failed to load audio assets'
      })

      // When - We use the hook
      const { result } = renderHook(() => usePostData('post_123'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Then - Should have audio error
      expect(result.current.audioError).toBe('Failed to load audio assets')
      expect(result.current.audioAssets).toEqual([])
    })

    it('🎵 should set primary audio successfully', async () => {
      // Given - Mock successful responses
      mockApiClient.getPostAudioAssets.mockResolvedValue({
        success: true,
        data: [mockAudioAsset]
      })
      mockApiClient.setPostPrimaryAudio.mockResolvedValue({
        success: true,
        data: { audio_asset_id: 'audio_123', language: 'en' }
      })

      // When - We use the hook and set primary audio
      const { result } = renderHook(() => usePostData('post_123'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const primaryAudioData: PrimaryAudioData = {
        audio_asset_id: 'audio_123',
        language: 'en'
      }

      await result.current.setPrimaryAudio(primaryAudioData)

      // Then - Should call API and refresh assets
      expect(mockApiClient.setPostPrimaryAudio).toHaveBeenCalledWith('post_123', primaryAudioData)
      expect(mockApiClient.getPostAudioAssets).toHaveBeenCalledTimes(2) // Initial + refresh
    })
  })

  describe('🎬 Audio Job Management Theater', () => {
    const mockAudioJob: AudioJobData = {
      id: 'job_123',
      post_id: 'post_123',
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
      // Given - Mock successful responses
      mockApiClient.getPostAudioAssets.mockResolvedValue({
        success: true,
        data: []
      })
      mockApiClient.createAudioJob.mockResolvedValue({
        success: true,
        data: mockAudioJob
      })

      // When - We use the hook and create an audio job
      const { result } = renderHook(() => usePostData('post_123'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const jobData = {
        status: 'pending' as const,
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
      }

      const createdJob = await result.current.createAudioJob(jobData)

      // Then - Should return created job
      expect(createdJob).toEqual(mockAudioJob)
      expect(mockApiClient.createAudioJob).toHaveBeenCalledWith({
        ...jobData,
        post_id: 'post_123'
      })
    })

    it('🎭 should get audio jobs for post', async () => {
      // Given - Mock successful responses
      mockApiClient.getPostAudioAssets.mockResolvedValue({
        success: true,
        data: []
      })
      mockApiClient.listAudioJobs.mockResolvedValue({
        success: true,
        data: [mockAudioJob]
      })

      // When - We use the hook and get audio jobs
      const { result } = renderHook(() => usePostData('post_123'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const jobs = await result.current.getAudioJobs()

      // Then - Should return jobs for the post
      expect(jobs).toEqual([mockAudioJob])
      expect(mockApiClient.listAudioJobs).toHaveBeenCalledWith({ postId: 'post_123' })
    })

    it('🎪 should handle audio job creation errors', async () => {
      // Given - Mock error response
      mockApiClient.getPostAudioAssets.mockResolvedValue({
        success: true,
        data: []
      })
      mockApiClient.createAudioJob.mockResolvedValue({
        success: false,
        message: 'Failed to create audio job'
      })

      // When - We use the hook and try to create a job
      const { result } = renderHook(() => usePostData('post_123'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Then - Should throw error
      await expect(result.current.createAudioJob({} as any)).rejects.toThrow('Failed to create audio job')
    })
  })

  describe('🎨 Error Handling & Edge Cases', () => {
    it('🎭 should handle API errors with proper formatting', async () => {
      // Given - Mock API error
      const apiError = new (apiClient as any).APIError('API Error', 'TEST_ERROR', 400)
      mockApiClient.getPostAudioAssets.mockRejectedValue(apiError)

      // When - We use the hook
      const { result } = renderHook(() => usePostData('post_123'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Then - Should format API error properly
      expect(result.current.audioError).toBe('Audio API Error (TEST_ERROR): API Error')
    })

    it('🎪 should handle empty post ID gracefully', async () => {
      // When - We use the hook with empty ID
      const { result } = renderHook(() => usePostData(''))

      // Then - Should not make any API calls
      expect(result.current.loading).toBe(true)
      expect(result.current.post).toBe(null)
      expect(mockApiClient.getPostAudioAssets).not.toHaveBeenCalled()
    })

    it('🎵 should refresh audio assets on demand', async () => {
      // Given - Mock successful responses
      mockApiClient.getPostAudioAssets.mockResolvedValue({
        success: true,
        data: []
      })

      // When - We use the hook and refresh assets
      const { result } = renderHook(() => usePostData('post_123'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await result.current.refreshAudioAssets()

      // Then - Should call API again
      expect(mockApiClient.getPostAudioAssets).toHaveBeenCalledTimes(2)
    })
  })
})