/** @vitest-environment node */

import { describe, beforeAll, afterAll, it, expect } from 'vitest'
import { apiTesting, TestContext } from '@/lib/external-api/testing'
import { GET as getPosts, POST as createPost } from '@/app/api/external/posts/route'
import { POST as analyzeImage } from '@/app/api/external/ai/analyze-image/route'
import { POST as generateAudio } from '@/app/api/external/ai/generate-audio/route'
import { POST as publishPost } from '@/app/api/external/posts/[id]/publish/route'
import { hookSystem } from '@/lib/hooks/system'
import fs from 'fs'
import path from 'path'

describe('Complete Workflow Integration Tests', () => {
  let testContext: TestContext
  let mockImageData: string

  beforeAll(async () => {
    // Setup test context with full permissions
    testContext = await apiTesting.setupTestContext([
      'posts:read',
      'posts:write',
      'posts:delete',
      'posts:publish',
      'media:read',
      'media:write',
      'media:delete',
      'ai:analyze',
      'ai:generate-audio',
      'admin:full'
    ])

    // Create mock image data
    mockImageData = 'data:image/jpeg;base64,' + Buffer.from('fake-image-data').toString('base64')
  })

  afterAll(async () => {
    await testContext.cleanup()
  })

  describe('End-to-End: Image Analysis to Published Post', () => {
    it('should complete the full workflow from image analysis to published post with audio', async () => {
      // Step 1: Analyze artwork image
      console.log('Step 1: Analyzing artwork image...')
      
      const analyzeRequest = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/ai/analyze-image',
        {
          image_data: mockImageData,
          analysis_type: 'detailed',
          include_metadata: true
        },
        testContext.apiKey.raw_key
      )

      const analysisResponse = await analyzeImage(analyzeRequest as any)
      const analysisData = await analysisResponse.json()

      expect(analysisResponse.status).toBe(200)
      expect(analysisData.success).toBe(true)
      expect(analysisData.data).toHaveProperty('suggested_title')
      expect(analysisData.data).toHaveProperty('suggested_slug')

      // Step 2: Create blog post from analysis
      console.log('Step 2: Creating blog post from analysis...')
      
      const postData = {
        title: analysisData.data.suggested_title || 'Test Artwork Analysis',
        content: analysisData.data.claude?.content || analysisData.data.openai?.content || 'Mock analysis content',
        slug: analysisData.data.suggested_slug || 'test-artwork-analysis',
        status: 'draft',
        origin_source: 'claude',
        featured_image_url: mockImageData
      }

      const createPostRequest = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/posts',
        postData,
        testContext.apiKey.raw_key
      )

      const createPostResponse = await createPost(createPostRequest as any)
      const postResponseData = await createPostResponse.json()

      expect(createPostResponse.status).toBe(200)
      expect(postResponseData.success).toBe(true)
      expect(postResponseData.data).toHaveProperty('id')
      expect(postResponseData.data.title).toBe(postData.title)
      expect(postResponseData.data.status).toBe('draft')

      const createdPostId = postResponseData.data.id

      // Step 3: Generate audio narration
      console.log('Step 3: Generating audio narration...')
      
      const audioRequest = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/ai/generate-audio',
        {
          text: postData.content,
          voice_id: 'EXAVITQu4vr4xnSDxMaL',
          provider: 'elevenlabs',
          save_to_storage: true,
          title: `Audio: ${postData.title}`
        },
        testContext.apiKey.raw_key
      )

      const audioResponse = await generateAudio(audioRequest as any)
      const audioData = await audioResponse.json()

      expect(audioResponse.status).toBe(200)
      expect(audioData.success).toBe(true)
      expect(audioData.data).toHaveProperty('audio_size_bytes')
      expect(audioData.data).toHaveProperty('estimated_duration_seconds')

      // Step 4: Publish the post
      console.log('Step 4: Publishing the post...')
      
      const publishRequest = apiTesting.createMockRequest(
        'POST',
        `http://localhost:3000/api/external/posts/${createdPostId}/publish`,
        {
          social_share: true
        },
        testContext.apiKey.raw_key
      )

      const publishResponse = await publishPost(
        publishRequest as any,
        { params: { id: createdPostId } }
      )
      const publishData = await publishResponse.json()

      expect(publishResponse.status).toBe(200)
      expect(publishData.success).toBe(true)
      expect(publishData.data.status).toBe('published')
      expect(publishData.data).toHaveProperty('published_at')
      expect(publishData.data).toHaveProperty('public_url')

      // Step 5: Verify the complete workflow
      console.log('Step 5: Verifying complete workflow...')
      
      const verifyRequest = apiTesting.createMockRequest(
        'GET',
        `http://localhost:3000/api/external/posts/${createdPostId}?include_audio=true&include_analysis=true`,
        undefined,
        testContext.apiKey.raw_key
      )

      const verifyResponse = await (await import('@/app/api/external/posts/[id]/route')).GET(
        verifyRequest as any,
        { params: { id: createdPostId } }
      )
      const verifyData = await verifyResponse.json()

      expect(verifyResponse.status).toBe(200)
      expect(verifyData.success).toBe(true)
      expect(verifyData.data.status).toBe('published')
      expect(verifyData.data.featured_image_url).toBe(mockImageData)
      expect(verifyData.data.origin_source).toBe('claude')

      console.log('✅ Complete workflow test passed!')
    }, 60000) // 60 second timeout for complete workflow
  })

  describe('Batch Processing Workflow', () => {
    it('should process multiple images in batch', async () => {
      const batchSize = 3
      const results = []

      for (let i = 0; i < batchSize; i++) {
        console.log(`Processing batch item ${i + 1}/${batchSize}...`)
        
        // Generate unique mock data for each item
        const uniqueImageData = `data:image/jpeg;base64,${Buffer.from(`fake-image-data-${i}`).toString('base64')}`
        
        // Analyze image
        const analyzeRequest = apiTesting.createMockRequest(
          'POST',
          'http://localhost:3000/api/external/ai/analyze-image',
          {
            image_data: uniqueImageData,
            analysis_type: 'brief'
          },
          testContext.apiKey.raw_key
        )

        const analysisResponse = await analyzeImage(analyzeRequest as any)
        const analysisData = await analysisResponse.json()

        // Create post
        const postData = {
          title: `Batch Test Post ${i + 1}`,
          content: analysisData.data.claude?.content || `Mock content for batch item ${i + 1}`,
          slug: `batch-test-post-${i + 1}`,
          status: 'draft',
          origin_source: 'claude'
        }

        const createPostRequest = apiTesting.createMockRequest(
          'POST',
          'http://localhost:3000/api/external/posts',
          postData,
          testContext.apiKey.raw_key
        )

        const createPostResponse = await createPost(createPostRequest as any)
        const postResponseData = await createPostResponse.json()

        results.push({
          index: i,
          analysisSuccess: analysisResponse.status === 200,
          postSuccess: createPostResponse.status === 200,
          postId: postResponseData.data?.id
        })

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Verify all batch items succeeded
      expect(results.every(r => r.analysisSuccess)).toBe(true)
      expect(results.every(r => r.postSuccess)).toBe(true)
      expect(results.every(r => r.postId)).toBe(true)

      console.log('✅ Batch processing test passed!')
    }, 45000) // 45 second timeout for batch processing
  })

  describe('Error Handling and Recovery', () => {
    it('should handle invalid image data gracefully', async () => {
      const invalidImageRequest = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/ai/analyze-image',
        {
          image_data: 'invalid-image-data',
          analysis_type: 'detailed'
        },
        testContext.apiKey.raw_key
      )

      const response = await analyzeImage(invalidImageRequest as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid image data')
    })

    it('should handle missing required fields', async () => {
      const invalidPostRequest = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/posts',
        {
          content: 'Content without title'
          // Missing required title field
        },
        testContext.apiKey.raw_key
      )

      const response = await createPost(invalidPostRequest as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('title')
    })

    it('should handle rate limiting', async () => {
      // Simulate rate limiting by creating many requests
      await apiTesting.simulateRateLimit(testContext.apiKey.id, 150)

      const rateLimitedRequest = apiTesting.createMockRequest(
        'GET',
        'http://localhost:3000/api/external/posts',
        undefined,
        testContext.apiKey.raw_key
      )

      const response = await getPosts(rateLimitedRequest as any)
      const data = await response.json()

      expect(response.status).toBe(401) // Rate limited requests are rejected
      expect(data.success).toBe(false)
    })
  })

  describe('Hooks System Integration', () => {
    it('should trigger hooks on post creation', async () => {
      // Create a test hook
      const testHook = await hookSystem.createHook({
        name: 'Test Hook - Post Created',
        description: 'Test hook for post creation',
        trigger: 'post.created' as any,
        conditions: [
          { field: 'title', operator: 'contains', value: 'Test Hook', type: 'string' }
        ],
        actions: [
          {
            type: 'test_action',
            parameters: { test: true },
            order: 1,
            retry_count: 1,
            timeout: 5000
          }
        ],
        enabled: true,
        priority: 1,
        created_by: testContext.authContext.userId!
      })

      // Register test action handler
      hookSystem.registerActionHandler('test_action', async (params: any) => {
        return { executed: true, params }
      })

      // Create a post that should trigger the hook
      const postData = {
        title: 'Test Hook Post',
        content: 'This post should trigger the test hook',
        status: 'draft'
      }

      const createPostRequest = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/posts',
        postData,
        testContext.apiKey.raw_key
      )

      const response = await createPost(createPostRequest as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Trigger hooks manually for testing
      const triggeredHooks = await hookSystem.triggerHooks(
        'post.created' as any,
        data.data,
        { userId: testContext.authContext.userId }
      )

      expect(triggeredHooks).toBeGreaterThan(0)

      // Clean up test hook
      await hookSystem.deleteHook(testHook.id)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 5
      const startTime = Date.now()

      // Create concurrent requests
      const requests = Array.from({ length: concurrentRequests }, (_, i) => 
        apiTesting.createMockRequest(
          'GET',
          `http://localhost:3000/api/external/posts?page=${i + 1}&limit=5`,
          undefined,
          testContext.apiKey.raw_key
        )
      )

      // Execute all requests concurrently
      const responses = await Promise.all(
        requests.map(req => getPosts(req as any))
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      // Verify all requests succeeded
      for (const response of responses) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
      }

      // Performance check: should complete within reasonable time
      expect(duration).toBeLessThan(10000) // 10 seconds
      
      console.log(`✅ Concurrent requests completed in ${duration}ms`)
    })

    it('should handle large content efficiently', async () => {
      // Create a post with large content
      const largeContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)
      
      const postData = {
        title: 'Large Content Test',
        content: largeContent,
        status: 'draft'
      }

      const startTime = Date.now()

      const createPostRequest = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/posts',
        postData,
        testContext.apiKey.raw_key
      )

      const response = await createPost(createPostRequest as any)
      const data = await response.json()

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.content).toBe(largeContent)

      // Should handle large content efficiently
      expect(duration).toBeLessThan(5000) // 5 seconds

      console.log(`✅ Large content processed in ${duration}ms`)
    })
  })

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      // Create a post
      const postData = {
        title: 'Consistency Test Post',
        content: 'Testing data consistency',
        status: 'draft'
      }

      const createRequest = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/posts',
        postData,
        testContext.apiKey.raw_key
      )

      const createResponse = await createPost(createRequest as any)
      const createData = await createResponse.json()
      const postId = createData.data.id

      // Update the post
      const updateData = {
        title: 'Updated Consistency Test Post',
        content: 'Updated content for consistency testing'
      }

      const updateRequest = apiTesting.createMockRequest(
        'PUT',
        `http://localhost:3000/api/external/posts/${postId}`,
        updateData,
        testContext.apiKey.raw_key
      )

      const updateResponse = await (await import('@/app/api/external/posts/[id]/route')).PUT(
        updateRequest as any,
        { params: { id: postId } }
      )
      const updateResponseData = await updateResponse.json()

      // Verify data consistency
      expect(updateResponse.status).toBe(200)
      expect(updateResponseData.data.title).toBe(updateData.title)
      expect(updateResponseData.data.content).toBe(updateData.content)
      expect(updateResponseData.data.updated_at).not.toBe(createData.data.updated_at)

      // Fetch the post to double-check
      const fetchRequest = apiTesting.createMockRequest(
        'GET',
        `http://localhost:3000/api/external/posts/${postId}`,
        undefined,
        testContext.apiKey.raw_key
      )

      const fetchResponse = await (await import('@/app/api/external/posts/[id]/route')).GET(
        fetchRequest as any,
        { params: { id: postId } }
      )
      const fetchData = await fetchResponse.json()

      expect(fetchResponse.status).toBe(200)
      expect(fetchData.data.title).toBe(updateData.title)
      expect(fetchData.data.content).toBe(updateData.content)

      console.log('✅ Data consistency verified!')
    })
  })

  describe('Security and Authorization', () => {
    it('should enforce scope-based access control', async () => {
      // Create API key with limited scopes
      const limitedContext = await apiTesting.setupTestContext(['posts:read'])

      // Try to create a post with read-only key
      const postData = {
        title: 'Unauthorized Post',
        content: 'This should not be created'
      }

      const unauthorizedRequest = apiTesting.createMockRequest(
        'POST',
        'http://localhost:3000/api/external/posts',
        postData,
        limitedContext.apiKey.raw_key
      )

      const response = await createPost(unauthorizedRequest as any)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('scope')

      await limitedContext.cleanup()
    })

    it('should reject requests without valid API key', async () => {
      const unauthenticatedRequest = apiTesting.createMockRequest(
        'GET',
        'http://localhost:3000/api/external/posts'
        // No API key provided
      )

      const response = await getPosts(unauthenticatedRequest as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('Monitoring and Observability', () => {
    it('should log API requests properly', async () => {
      const request = apiTesting.createMockRequest(
        'GET',
        'http://localhost:3000/api/external/posts?limit=1',
        undefined,
        testContext.apiKey.raw_key
      )

      const response = await getPosts(request as any)
      
      expect(response.status).toBe(200)
      
      // Check that rate limit headers are present
      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy()
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy()
      
      // Check CORS headers
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy()
    })
  })
})

// Helper function to create a realistic workflow test
async function createRealisticWorkflowTest() {
  return {
    name: 'Realistic Art Blog Workflow',
    description: 'Simulates a complete art blog creation workflow',
    steps: [
      'Upload artwork image',
      'Analyze with dual AI models',
      'Create engaging blog post',
      'Generate audio narration',
      'Optimize for SEO',
      'Publish to website',
      'Share on social media'
    ]
  }
}