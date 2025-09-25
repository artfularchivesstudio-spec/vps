import { GET } from '@/app/api/admin/posts/check-slug/route'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// 🧪🎭 Test the slug uniqueness checker endpoint
// Function-level comment: ensures API properly validates slugs and checks database 🌟🔍

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('/api/admin/posts/check-slug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up environment variables for tests
    process.env.SUPABASE_URL = 'https://test-project.supabase.co'
    
    // Reset fetch mock
    mockFetch.mockClear()
  })

  it('returns false for non-existent slug', async () => {
    // Mock edge function response for non-existent slug
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        success: true,
        data: {
          slug_check: {
            exists: false
          }
        }
      })
    })

    const request = new Request('http://localhost/api/admin/posts/check-slug?slug=my-test-post')
    const response = await GET(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.data.exists).toBe(false)
    expect(result.data.slug).toBe('my-test-post')
    expect(result.error).toBe(null)
  })

  it('returns true for existing slug', async () => {
    // Mock edge function response for existing slug
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        success: true,
        data: {
          slug_check: {
            exists: true
          }
        }
      })
    })

    const request = new Request('http://localhost/api/admin/posts/check-slug?slug=my-test-post')
    const response = await GET(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.data.exists).toBe(true)
    expect(result.data.slug).toBe('my-test-post')
    expect(result.error).toBe(null)
  })

  it('validates missing slug parameter', async () => {
    const request = new Request('http://localhost/api/admin/posts/check-slug')
    const response = await GET(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Missing required parameter: slug')
    expect(result.data).toBe(null)
  })

  it('validates invalid slug format', async () => {
    const request = new Request('http://localhost/api/admin/posts/check-slug?slug=INVALID_SLUG!')
    const response = await GET(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid slug format')
    expect(result.data).toBe(null)
  })

  it('handles database errors gracefully', async () => {
    // Mock edge function error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const request = new Request('http://localhost/api/admin/posts/check-slug?slug=my-test-post')
    const response = await GET(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Edge function error: 500')
    expect(result.data).toBe(null)
  })

  it('accepts valid slug formats', async () => {
    // Mock edge function response for valid slugs
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        success: true,
        data: {
          slug_check: {
            exists: false
          }
        }
      })
    })

    const validSlugs = [
      'simple-slug',
      'complex-slug-123',
      'a',
      'slug-with-multiple-hyphens',
      '123-numeric-start'
    ]

    for (const slug of validSlugs) {
      const request = new Request(`http://localhost/api/admin/posts/check-slug?slug=${slug}`)
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.slug).toBe(slug)
    }
  })

  it('rejects invalid slug formats', async () => {
    const invalidSlugs = [
      'INVALID_UPPERCASE',
      'invalid spaces',
      'invalid@symbols!',
      'invalid.dots',
      'invalid/slashes',
      'invalid-trailing-',
      '-invalid-leading'
    ]

    for (const slug of invalidSlugs) {
      const request = new Request(`http://localhost/api/admin/posts/check-slug?slug=${slug}`)
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid slug format')
    }
  })

  it('rejects empty slug parameter', async () => {
    const request = new Request('http://localhost/api/admin/posts/check-slug?slug=')
    const response = await GET(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Missing required parameter: slug')
  })

  it('properly encodes URL parameters', async () => {
    // Mock edge function response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        success: true,
        data: {
          slug_check: {
            exists: false
          }
        }
      })
    })

    // Test with URL-encoded slug
    const slug = 'test-slug-with-spaces'
    const encodedSlug = encodeURIComponent(slug)
    const request = new Request(`http://localhost/api/admin/posts/check-slug?slug=${encodedSlug}`)
    const response = await GET(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.data.slug).toBe(slug)
  })
})
