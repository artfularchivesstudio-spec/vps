import { test, expect } from '@playwright/test'

// Simple in-memory fixtures for deterministic tests
const voices = {
  voices: [
    { id: 'nova', label: 'Nova', gender: 'female', tags: ['default'], languages: ['en','es','hi'] },
    { id: 'sage', label: 'Sage', gender: 'male', tags: ['calm'], languages: ['en','es','hi'] },
    { id: 'shimmer', label: 'Shimmer', gender: 'female', tags: ['expressive'], languages: ['en','es','hi'] },
    { id: 'fable', label: 'Fable', gender: 'male', tags: ['storyteller'], languages: ['en'] },
  ]
}

const sampleAudio = Buffer.from(
  'SUQzAwAAAAAAFlRFTkMAAAAwAAACAAACAAABAAABAAABAExBTUUyLjM2LjEwMAAAAAAAAAAAAAAA',
  'base64'
)

const mockImageAnalysis = {
  data: {
    blogContent: 'This is a beautiful piece of art that demonstrates the artist\'s mastery of color and composition. The vibrant hues create a sense of movement and energy that captivates the viewer.',
    suggestedTitle: 'Vibrant Expressions: A Study in Color and Movement',
    suggestedSlug: 'vibrant-expressions-study-color-movement',
    excerpt: 'An exploration of how color and composition create emotional resonance in contemporary art.'
  }
}

test.describe('CreatePostWizard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all API endpoints
    await page.route('**/api/ai/voices', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(voices) })
    })
    
    await page.route('**/api/ai/sample-voice**', async (route) => {
      await route.fulfill({ status: 200, body: sampleAudio, headers: { 'Content-Type': 'audio/mpeg' } })
    })
    
    // Note: In E2E mode, analysis is skipped, but we keep this for completeness
    await page.route('**/api/ai/analyze-image', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockImageAnalysis) })
    })
    
    await page.route('**/api/ai/generate-audio', async (route) => {
      const json = await route.request().postDataJSON()
      expect(json.text).toBeTruthy()
      expect(json.post_id).toBeTruthy()
      await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ jobId: 'job_123' }) })
    })

    // Mock Supabase client calls
    await page.route('**/rest/v1/rpc/get_or_create_admin_profile', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ ok: true }]) })
    })
    
    await page.route('**/rest/v1/blog_posts**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([{ id: 'post_123' }]) })
        return
      }
      await route.continue()
    })
    
    await page.route('**/storage/v1/object/**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ 
          status: 200, 
          contentType: 'application/json',
          body: JSON.stringify({ Key: 'test-image.png' })
        })
        return
      }
      await route.continue()
    })
    
    // Mock getPublicUrl for Supabase storage
    await page.route('**/storage/v1/object/sign/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json', 
        body: JSON.stringify({ signedURL: 'https://example.com/test-image.png' })
      })
    })
  })

  test('Complete wizard flow: Upload → Review → Audio → Finalize', async ({ page }) => {
    // Navigate to the wizard
    await page.goto('/dev-wizard?e2e=1')
    await page.waitForLoadState('networkidle')

    // Verify we start on upload step
    await expect(page.getByText('Step 1: Upload Your Image')).toBeVisible()
    await expect(page.getByText('🖼️ Upload')).toHaveClass(/bg-indigo-100/)

    // Step 1: Upload Image
    await page.screenshot({ path: 'test-report/01-upload-step.png', fullPage: true })
    
    // Set file on the hidden input
    await page.setInputFiles('input[type="file"]', {
      name: 'test-artwork.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108020000009090771d0000000a49444154789c6200010000050001000a00000000000000000000000049454e44ae426082', 'hex')
    })

    // Wait for upload and then continue
    await page.waitForTimeout(3000)
    
    // Debug: check if button is enabled
    await page.screenshot({ path: 'test-report/01b-after-upload.png', fullPage: true })
    
    // Click continue - use locator that definitely finds the button
    const continueButton = page.locator('button', { hasText: 'Continue' })
    await continueButton.click({ force: true })

    // Should go directly to review step in E2E mode (skips analysis)
    await page.waitForSelector('text=Step 3: Review & Edit Content', { timeout: 5000 })
    await page.screenshot({ path: 'test-report/02-review-step.png', fullPage: true })

    // In E2E mode, fields won't be pre-populated, so we'll fill them manually
    await page.fill('input[placeholder="Enter post title..."]', 'Test Post: AI Art Analysis')
    
    // Add content
    await page.fill('textarea[placeholder="AI-generated content will appear here. You can edit it directly."]', 'This is test content for the AI-generated blog post about art analysis.')
    
    // Add excerpt
    await page.fill('textarea[placeholder="A short summary of the post..."]', 'A comprehensive analysis of contemporary art techniques.')

    await page.getByRole('button', { name: /continue to audio/i }).click()

    // Step 3: Audio Settings
    await page.waitForSelector('text=Step 4: Audio Creation', { timeout: 5000 })
    await page.screenshot({ path: 'test-report/03-audio-step.png', fullPage: true })

    // Simply generate audio with default settings
    await page.getByRole('button', { name: /generate audio/i }).click()
    await page.waitForTimeout(1000)

    // Step 4: Finalize
    await page.waitForSelector('text=Step 5: Finalize', { timeout: 5000 })
    await page.screenshot({ path: 'test-report/04-finalize-step.png', fullPage: true })

    // Verify we reached the final step
    await expect(page.getByText('Step 5: Finalize')).toBeVisible()
    
    await page.screenshot({ path: 'test-report/05-wizard-complete.png', fullPage: true })
  })

  test('Navigation between steps works correctly', async ({ page }) => {
    await page.goto('/dev-wizard?e2e=1')
    await page.waitForLoadState('networkidle')

    // Upload image to get past first step
    await page.setInputFiles('input[type="file"]', {
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a', 'hex')
    })
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /continue/i }).click({ force: true })

    // Should be on review step
    await page.waitForSelector('text=Step 3: Review & Edit Content')
    
    // Fill required fields and continue
    await page.fill('input[placeholder="Enter post title..."]', 'Test Navigation')
    await page.getByRole('button', { name: /continue to audio/i }).click()

    // Should be on audio step
    await page.waitForSelector('text=Step 4: Audio Creation')
    
    // Test back navigation
    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.getByText('Step 3: Review & Edit Content')).toBeVisible()
    
    // Go forward again
    await page.getByRole('button', { name: /continue to audio/i }).click()
    await page.waitForSelector('text=Step 4: Audio Creation')
    
    // Generate audio to proceed
    await page.getByRole('button', { name: /generate audio/i }).click()
    await page.waitForTimeout(1000)
    
    // Should be on finalize step
    await page.waitForSelector('text=Step 5: Finalize')
    
    // Test back from finalize
    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.getByText('Step 4: Audio Creation')).toBeVisible()
  })

  test('Form validation works correctly', async ({ page }) => {
    await page.goto('/dev-wizard?e2e=1')
    await page.waitForLoadState('networkidle')

    // Try to continue without uploading image
    await page.getByRole('button', { name: /continue/i }).click()
    
    // Should show error and stay on upload step
    await expect(page.getByText('Please upload an image before proceeding')).toBeVisible()
    await expect(page.getByText('Step 1: Upload Your Image')).toBeVisible()

    // Upload image and proceed
    await page.setInputFiles('input[type="file"]', {
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a', 'hex')
    })
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /continue/i }).click({ force: true })

    // On review step, try to continue without title
    await page.waitForSelector('text=Step 3: Review & Edit Content')
    await page.locator('input[placeholder="Enter post title..."]').clear()
    await page.getByRole('button', { name: /continue to audio/i }).click()

    // Should show validation error
    await expect(page.getByText('Post title is required')).toBeVisible()
    
    // Fill title and try without content
    await page.fill('input[placeholder="Enter post title..."]', 'Test Title')
    await page.locator('textarea[placeholder*="AI-generated content"]').clear()
    await page.getByRole('button', { name: /continue to audio/i }).click()

    // Should show content validation error
    await expect(page.getByText('Post content is required')).toBeVisible()
  })

  test('Progress indicators update correctly', async ({ page }) => {
    await page.goto('/dev-wizard?e2e=1')
    await page.waitForLoadState('networkidle')

    // Check initial progress state
    await expect(page.locator('.bg-indigo-100').getByText('🖼️ Upload')).toBeVisible()
    await expect(page.locator('text=25%')).toBeVisible()

    // Upload and proceed
    await page.setInputFiles('input[type="file"]', {
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a', 'hex')
    })
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /continue/i }).click({ force: true })

    // Check review step progress
    await page.waitForSelector('text=Step 3: Review & Edit Content')
    await expect(page.locator('.bg-indigo-100').getByText('📝 Review')).toBeVisible()
    await expect(page.locator('text=50%')).toBeVisible()

    // Continue to audio
    await page.fill('input[placeholder="Enter post title..."]', 'Test Progress')
    await page.getByRole('button', { name: /continue to audio/i }).click()

    // Check audio step progress
    await page.waitForSelector('text=Step 4: Audio Creation')
    await expect(page.locator('.bg-indigo-100').getByText('🎙️ Audio')).toBeVisible()
    await expect(page.locator('text=75%')).toBeVisible()

    // Generate audio and check final progress
    await page.getByRole('button', { name: /generate audio/i }).click()
    await page.waitForTimeout(1000)
    await page.waitForSelector('text=Step 5: Finalize')
    await expect(page.locator('.bg-indigo-100').getByText('✅ Finalize')).toBeVisible()
    await expect(page.locator('text=100%')).toBeVisible()
  })

  test('Error handling displays properly', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/ai/generate-audio', async (route) => {
      await route.fulfill({ 
        status: 500, 
        contentType: 'application/json', 
        body: JSON.stringify({ error: 'Audio generation failed' }) 
      })
    })

    await page.goto('/dev-wizard?e2e=1')
    await page.waitForLoadState('networkidle')

    // Go through steps quickly
    await page.setInputFiles('input[type="file"]', {
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a', 'hex')
    })
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /continue/i }).click({ force: true })

    await page.waitForSelector('text=Step 3: Review & Edit Content')
    await page.fill('input[placeholder="Enter post title..."]', 'Error Test')
    await page.getByRole('button', { name: /continue to audio/i }).click()

    await page.waitForSelector('text=Step 4: Audio Creation')
    await page.getByRole('button', { name: /generate audio/i }).click()

    // Should show error message
    await expect(page.getByText(/audio generation failed/i)).toBeVisible()
    
    // Should still be on audio step
    await expect(page.getByText('Step 4: Audio Creation')).toBeVisible()
  })
})


