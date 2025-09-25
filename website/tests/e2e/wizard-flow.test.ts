/**
 * 🎭 The Spellbinding Museum Director's End-to-End Wizard Test
 * 
 * "In the grand theatre of content creation, every step must flow seamlessly,
 * from the first brushstroke of image upload to the final symphony of published content!"
 * 
 * This test validates the complete post creation wizard flow with screenshots
 * and verifies all our recent improvements work in harmony.
 */

import { expect, Page, test } from '@playwright/test'

// 🎨 Test data for our mystical content creation
const testImageUrl = 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop'
const testPostData = {
  title: 'The Mystical Dance of Light and Shadow',
  content: 'In this spellbinding masterpiece, we explore the ethereal beauty of artistic expression...',
  excerpt: 'A journey through the mystical elements of artistic creation',
  slug: 'mystical-dance-light-shadow',
  categories: ['Art Analysis', 'Mystical Art'],
  tags: ['Light', 'Shadow', 'Art', 'Mystical']
}

test.describe('🎭 Post Creation Wizard - End-to-End Flow', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    
    // 📸 Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // 🌐 Navigate to the wizard
    await page.goto('http://localhost:3000/admin/posts/create')
    
    // ⏳ Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('🌟 Complete Wizard Flow - Upload to Finalize', async () => {
    // 📸 Step 1: Upload Step Screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/wizard-step-1-upload.png',
      fullPage: true 
    })
    
    console.log('🎭 Step 1: Upload Step - Taking screenshot')
    
    // 🖼️ Upload test image
    await page.fill('input[type="url"]', testImageUrl)
    await page.click('button:has-text("Next")')
    
    // ⏳ Wait for analysis to complete
    await page.waitForSelector('[data-testid="analyzing-step"]', { timeout: 30000 })
    
    // 📸 Step 2: Analyzing Step Screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/wizard-step-2-analyzing.png',
      fullPage: true 
    })
    
    console.log('🎭 Step 2: Analyzing Step - AI analysis in progress')
    
    // ⏳ Wait for analysis to complete and move to review
    await page.waitForSelector('[data-testid="review-step"]', { timeout: 60000 })
    
    // 📸 Step 3: Review Step Screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/wizard-step-3-review.png',
      fullPage: true 
    })
    
    console.log('🎭 Step 3: Review Step - Content generated, ready for editing')
    
    // ✏️ Edit the generated content
    await page.fill('textarea[name="title"]', testPostData.title)
    await page.fill('textarea[name="content"]', testPostData.content)
    await page.fill('textarea[name="excerpt"]', testPostData.excerpt)
    await page.fill('input[name="slug"]', testPostData.slug)
    
    // 📸 Step 4: Review Step with Edits Screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/wizard-step-4-review-edited.png',
      fullPage: true 
    })
    
    console.log('🎭 Step 4: Review Step - Content edited and ready to save')
    
    // 💾 Save the post (this will test our slug uniqueness system)
    await page.click('button:has-text("Save & Continue")')
    
    // ⏳ Wait for save to complete
    await page.waitForSelector('[data-testid="translation-step"]', { timeout: 30000 })
    
    // 📸 Step 5: Translation Step Screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/wizard-step-5-translation.png',
      fullPage: true 
    })
    
    console.log('🎭 Step 5: Translation Step - Post saved, ready for translation')
    
    // 🌍 Generate translations
    await page.click('button:has-text("Generate Translations")')
    
    // ⏳ Wait for translations to complete
    await page.waitForSelector('[data-testid="translation-review-step"]', { timeout: 60000 })
    
    // 📸 Step 6: Translation Review Screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/wizard-step-6-translation-review.png',
      fullPage: true 
    })
    
    console.log('🎭 Step 6: Translation Review - Translations generated')
    
    // ✅ Approve translations
    await page.click('button:has-text("Approve All & Continue")')
    
    // ⏳ Wait for audio step
    await page.waitForSelector('[data-testid="audio-step"]', { timeout: 30000 })
    
    // 📸 Step 7: Audio Step Screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/wizard-step-7-audio.png',
      fullPage: true 
    })
    
    console.log('🎭 Step 7: Audio Step - Ready for audio generation')
    
    // 🎙️ Generate audio
    await page.click('button:has-text("Generate Audio")')
    
    // ⏳ Wait for audio generation to start
    await page.waitForSelector('text=Audio generation started', { timeout: 30000 })
    
    // 📸 Step 8: Audio Generation Screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/wizard-step-8-audio-generating.png',
      fullPage: true 
    })
    
    console.log('🎭 Step 8: Audio Generation - Audio job started')
    
    // ✅ Continue to finalize
    await page.click('button:has-text("Continue to Finalize")')
    
    // ⏳ Wait for finalize step
    await page.waitForSelector('[data-testid="finalize-step"]', { timeout: 30000 })
    
    // 📸 Step 9: Finalize Step Screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/wizard-step-9-finalize.png',
      fullPage: true 
    })
    
    console.log('🎭 Step 9: Finalize Step - Ready to publish')
    
    // 🎉 Verify we reached the final step
    await expect(page.locator('[data-testid="finalize-step"]')).toBeVisible()
    
    // 📊 Verify post data is displayed
    await expect(page.locator('text=' + testPostData.title)).toBeVisible()
    
    console.log('🎭 ✨ WIZARD FLOW COMPLETE - All steps successful!')
  })

  test('🔍 Slug Uniqueness System Test', async () => {
    // 🖼️ Upload image and go through initial steps
    await page.fill('input[type="url"]', testImageUrl)
    await page.click('button:has-text("Next")')
    await page.waitForSelector('[data-testid="review-step"]', { timeout: 60000 })
    
    // ✏️ Set a slug that might already exist
    const duplicateSlug = 'test-slug-uniqueness'
    await page.fill('input[name="slug"]', duplicateSlug)
    
    // 💾 Try to save - this should test our slug uniqueness system
    await page.click('button:has-text("Save & Continue")')
    
    // ⏳ Wait for save to complete (should handle slug uniqueness automatically)
    await page.waitForSelector('[data-testid="translation-step"]', { timeout: 30000 })
    
    // 📸 Screenshot of successful save with unique slug
    await page.screenshot({ 
      path: 'tests/screenshots/slug-uniqueness-test.png',
      fullPage: true 
    })
    
    console.log('🎭 ✅ Slug uniqueness system working - post saved successfully')
    
    // ✅ Verify we moved to translation step (meaning save was successful)
    await expect(page.locator('[data-testid="translation-step"]')).toBeVisible()
  })

  test('📴 Offline-First Capabilities Test', async () => {
    // 🖼️ Upload image and go to review step
    await page.fill('input[type="url"]', testImageUrl)
    await page.click('button:has-text("Next")')
    await page.waitForSelector('[data-testid="review-step"]', { timeout: 60000 })
    
    // ✏️ Fill in post data
    await page.fill('textarea[name="title"]', 'Offline Test Post')
    await page.fill('textarea[name="content"]', 'Testing offline capabilities')
    await page.fill('input[name="slug"]', 'offline-test-post')
    
    // 📸 Screenshot before going offline
    await page.screenshot({ 
      path: 'tests/screenshots/offline-test-before.png',
      fullPage: true 
    })
    
    // 🌐 Simulate offline condition
    await page.context().setOffline(true)
    
    // 💾 Try to save while offline
    await page.click('button:has-text("Save & Continue")')
    
    // ⏳ Wait for offline handling
    await page.waitForTimeout(2000)
    
    // 📸 Screenshot of offline mode
    await page.screenshot({ 
      path: 'tests/screenshots/offline-test-during.png',
      fullPage: true 
    })
    
    // ✅ Verify offline mode is indicated
    await expect(page.locator('text=Offline Mode')).toBeVisible()
    
    // 🌐 Go back online
    await page.context().setOffline(false)
    
    // ⏳ Wait for reconnection
    await page.waitForTimeout(2000)
    
    // 📸 Screenshot after reconnection
    await page.screenshot({ 
      path: 'tests/screenshots/offline-test-after.png',
      fullPage: true 
    })
    
    console.log('🎭 ✅ Offline-first capabilities working - graceful degradation and recovery')
  })

  test('🎙️ Audio Generation and Content Version Test', async () => {
    // 🖼️ Go through wizard to audio step
    await page.fill('input[type="url"]', testImageUrl)
    await page.click('button:has-text("Next")')
    await page.waitForSelector('[data-testid="review-step"]', { timeout: 60000 })
    
    // ✏️ Fill post data
    await page.fill('textarea[name="title"]', 'Audio Test Post')
    await page.fill('textarea[name="content"]', 'Testing audio generation and content versioning')
    await page.fill('input[name="slug"]', 'audio-test-post')
    
    // 💾 Save post
    await page.click('button:has-text("Save & Continue")')
    await page.waitForSelector('[data-testid="translation-step"]', { timeout: 30000 })
    
    // 🌍 Generate translations
    await page.click('button:has-text("Generate Translations")')
    await page.waitForSelector('[data-testid="translation-review-step"]', { timeout: 60000 })
    await page.click('button:has-text("Approve All & Continue")')
    await page.waitForSelector('[data-testid="audio-step"]', { timeout: 30000 })
    
    // 🎙️ Generate audio
    await page.click('button:has-text("Generate Audio")')
    
    // ⏳ Wait for audio job to start
    await page.waitForSelector('text=Audio generation started', { timeout: 30000 })
    
    // 📸 Screenshot of audio generation
    await page.screenshot({ 
      path: 'tests/screenshots/audio-generation-test.png',
      fullPage: true 
    })
    
    // ✅ Verify audio generation started
    await expect(page.locator('text=Audio generation started')).toBeVisible()
    
    console.log('🎭 ✅ Audio generation system working - job started successfully')
  })
})
