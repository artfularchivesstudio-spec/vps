/** @vitest-environment node */

import { describe, beforeEach, afterEach, it, expect } from 'vitest'
import { apiTesting, TestContext } from '@/lib/external-api/testing'
import { GET, POST } from '@/app/api/external/posts/route'
import { GET as getPost, PUT, DELETE } from '@/app/api/external/posts/[id]/route'
import { POST as publishPost } from '@/app/api/external/posts/[id]/publish/route'

describe('External API - Posts Management', () => {
  let testContext: TestContext

  beforeEach(async () => {
    testContext = await apiTesting.setupTestContext([
      'posts:read',
      'posts:write',
      'posts:delete',
      'posts:publish'
    ])
  })

  afterEach(async () => {
    await testContext.cleanup()
  })

  describe('GET /api/external/posts', () => {
    it('should return list of posts with valid API key', async () => {
      // Create test posts
      const post1 = await apiTesting.createTestPost({ title: 'Test Post 1' })
      const post2 = await apiTesting.createTestPost({ title: 'Test Post 2' })

      // Create request
      const request = apiTesting.createMockRequest(
        'GET',
        'http://localhost:3000/api/external/posts',
        undefined,
        testContext.apiKey.raw_key
      )

      // Execute request
      const response = await GET(request as any)
      const data = await response.json()

      // Assertions
      expect(response.status).toBe(200)
      apiTesting.assertValidAPIResponse(data)
      apiTesting.assertRateLimitHeaders(response)
      apiTesting.assertCORSHeaders(response)
      
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThanOrEqual(2)
      expect(data.meta).toHaveProperty('pagination')
    })

    it('should return 401 without API key', async () => {
      const request = apiTesting.createMockRequest('GET', 'http://localhost:3000/api/external/posts')
      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unauthorized')
    })

    it('should filter posts by status', async () => {
      // Create posts with different statuses
      await apiTesting.createTestPost({ title: 'Draft Post', status: 'draft' })
      await apiTesting.createTestPost({ title: 'Published Post', status: 'published' })

      const request = apiTesting.createMockRequest(
        'GET',
        'http://localhost:3000/api/external/posts?status=published',
        undefined,
        testContext.apiKey.raw_key
      )

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.every((post: any) => post.status === 'published')).toBe(true)
    })

    it('should paginate results', async () => {
      // Create multiple posts
      for (let i = 0; i < 15; i++) {
        await apiTesting.createTestPost({ title: `Post ${i}` })
      }

      const request = apiTesting.createMockRequest(
        'GET',
        'http://localhost:3000/api/external/posts?page=2&limit=5',
        undefined,
        testContext.apiKey.raw_key
      )

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.length).toBe(5)
      expect(data.meta.pagination.page).toBe(2)
      expect(data.meta.pagination.limit).toBe(5)
    })
  })

  describe('POST /api/external/posts', () => {
    it('should create new post with valid data', async () => {
      const postData = apiTesting.createMockPostData({
        title: 'New API Post',
        content: 'This post was created via API'
      })

      const request = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/posts',
        postData,
        testContext.apiKey.raw_key
      )

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe(postData.title)
      expect(data.data.content).toBe(postData.content)
      expect(data.data.slug).toBe(postData.slug)
      expect(data.data.id).toBeTruthy()
    })

    it('should validate required fields', async () => {
      const request = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/posts',
        { content: 'Missing title' }, // Missing required title
        testContext.apiKey.raw_key
      )

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('title')
    })

    it('should generate unique slug when not provided', async () => {
      const postData = {
        title: 'Auto Generated Slug!@#$%',
        content: 'Testing slug generation'
      }

      const request = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/posts',
        postData,
        testContext.apiKey.raw_key
      )

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.slug).toBe('auto-generated-slug')
    })
  })

  describe('GET /api/external/posts/[id]', () => {
    it('should return specific post', async () => {
      const testPost = await apiTesting.createTestPost()

      const response = await getPost(
        apiTesting.createMockRequest('GET', '', undefined, testContext.apiKey.raw_key) as any,
        { params: { id: testPost.id } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testPost.id)
      expect(data.data.title).toBe(testPost.title)
    })

    it('should return 404 for non-existent post', async () => {
      const response = await getPost(
        apiTesting.createMockRequest('GET', '', undefined, testContext.apiKey.raw_key) as any,
        { params: { id: '00000000-0000-0000-0000-000000000000' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('not found')
    })

    it('should include audio when requested', async () => {
      const audioAsset = await apiTesting.createTestMediaAsset()
      const testPost = await apiTesting.createTestPost({ primary_audio_id: audioAsset.id })

      const request = apiTesting.createMockRequest(
        'GET',
        `http://localhost:3000/api/external/posts/${testPost.id}?include_audio=true`,
        undefined,
        testContext.apiKey.raw_key
      )

      const response = await getPost(request as any, { params: { id: testPost.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.audio).toBeTruthy()
      expect(data.data.audio.id).toBe(audioAsset.id)
    })
  })

  describe('PUT /api/external/posts/[id]', () => {
    it('should update existing post', async () => {
      const testPost = await apiTesting.createTestPost()
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      }

      const response = await PUT(
        apiTesting.createMockRequest('PUT', '', updateData, testContext.apiKey.raw_key) as any,
        { params: { id: testPost.id } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe(updateData.title)
      expect(data.data.content).toBe(updateData.content)
      expect(data.data.updated_at).not.toBe(testPost.updated_at)
    })

    it('should set published_at when changing status to published', async () => {
      const testPost = await apiTesting.createTestPost({ status: 'draft' })

      const response = await PUT(
        apiTesting.createMockRequest('PUT', '', { status: 'published' }, testContext.apiKey.raw_key) as any,
        { params: { id: testPost.id } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.status).toBe('published')
      expect(data.data.published_at).toBeTruthy()
    })
  })

  describe('DELETE /api/external/posts/[id]', () => {
    it('should delete existing post', async () => {
      const testPost = await apiTesting.createTestPost()

      const response = await DELETE(
        apiTesting.createMockRequest('DELETE', '', undefined, testContext.apiKey.raw_key) as any,
        { params: { id: testPost.id } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.deleted).toBe(true)
      expect(data.data.id).toBe(testPost.id)
    })

    it('should return 404 for non-existent post', async () => {
      const response = await DELETE(
        apiTesting.createMockRequest('DELETE', '', undefined, testContext.apiKey.raw_key) as any,
        { params: { id: '00000000-0000-0000-0000-000000000000' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/external/posts/[id]/publish', () => {
    it('should publish draft post', async () => {
      const testPost = await apiTesting.createTestPost({ 
        status: 'draft',
        title: 'Ready to Publish',
        content: 'This post is ready for publishing'
      })

      const response = await publishPost(
        apiTesting.createMockRequest('POST', '', {}, testContext.apiKey.raw_key) as any,
        { params: { id: testPost.id } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('published')
      expect(data.data.published_at).toBeTruthy()
      expect(data.data.public_url).toContain(testPost.slug)
    })

    it('should reject publishing post without content', async () => {
      const testPost = await apiTesting.createTestPost({ 
        title: '',
        content: '' 
      })

      const response = await publishPost(
        apiTesting.createMockRequest('POST', '', {}, testContext.apiKey.raw_key) as any,
        { params: { id: testPost.id } }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('title and content')
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Simulate hitting rate limit
      await apiTesting.simulateRateLimit(testContext.apiKey.id, 150)

      const request = apiTesting.createMockRequest(
        'GET',
        'http://localhost:3000/api/external/posts',
        undefined,
        testContext.apiKey.raw_key
      )

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(401) // Should be rejected due to rate limit
      expect(data.success).toBe(false)
    })
  })

  describe('Authorization', () => {
    it('should enforce scope requirements', async () => {
      // Create API key with limited scopes
      const limitedContext = await apiTesting.setupTestContext(['posts:read']) // No write access

      const request = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/posts',
        apiTesting.createMockPostData(),
        limitedContext.apiKey.raw_key
      )

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('scope')

      await limitedContext.cleanup()
    })
  })
})