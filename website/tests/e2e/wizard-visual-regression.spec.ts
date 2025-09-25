import { test, expect } from '@playwright/test';
import { TestTiming, TestSelectors } from './config/timing';

test.describe('Wizard Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          user: {
            id: 'test-user-id',
            email: 'admin@artful-archives.com',
            role: 'authenticated'
          }
        })
      });
    });

    await page.route('**/rest/v1/rpc/is_admin_user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(true)
      });
    });

    // Mock voices API
    await page.route('**/api/ai/voices', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          voices: [
            {
              id: 'alloy',
              name: 'Alloy',
              gender: 'neutral',
              description: 'A balanced, versatile voice',
              provider: 'openai'
            },
            {
              id: 'echo',
              name: 'Echo',
              gender: 'male',
              description: 'A clear, professional male voice',
              provider: 'openai'
            },
            {
              id: 'nova',
              name: 'Nova',
              gender: 'female',
              description: 'A warm, engaging female voice',
              provider: 'openai'
            }
          ]
        })
      });
    });

    // Mock voice sampling
    await page.route('**/api/ai/sample-voice*', async route => {
      // Return a small audio blob
      await route.fulfill({
        status: 200,
        contentType: 'audio/mpeg',
        body: Buffer.from('mock-audio-data')
      });
    });

    // Mock image upload
    await page.route('**/storage/v1/object/images/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Key: 'images/test-image.jpg',
          publicUrl: 'https://example.com/test-image.jpg'
        })
      });
    });

    // Mock AI analysis
    await page.route('**/api/ai/analyze-image', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          openai: {
            title: 'Abstract Expressionist Masterpiece',
            slug: 'abstract-expressionist-masterpiece',
            excerpt: 'A vibrant exploration of color and form',
            content: 'This artwork demonstrates masterful use of color theory...',
            categories: ['Abstract Art', 'Contemporary'],
            tags: ['colorful', 'expressive', 'modern']
          },
          claude: {
            title: 'Contemporary Color Study',
            slug: 'contemporary-color-study',
            excerpt: 'An investigation into chromatic relationships',
            content: 'The artist skillfully explores the relationship between...',
            categories: ['Color Theory', 'Modern Art'],
            tags: ['analytical', 'thoughtful', 'academic']
          }
        })
      });
    });

    // Mock save post
    await page.route('**/rest/v1/blog_posts', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 123,
            title: 'Test Blog Post',
            slug: 'test-blog-post',
            status: 'draft'
          })
        });
      }
    });

    // Mock audio generation
    await page.route('**/api/ai/generate-audio', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'audio-job-123',
          status: 'pending'
        })
      });
    });
  });

  test('Wizard Step 1 - Upload State Variations', async ({ page }) => {
    await page.goto('/dev-wizard?e2e=1');
    await page.waitForSelector(TestSelectors.wizard.container, { timeout: 10000 });
    
    // Initial upload step
    await page.screenshot({ 
      path: 'test-report/wizard-step1-initial.png',
      fullPage: true 
    });

    // Hover state on upload area
    await page.hover(TestSelectors.wizard.uploadArea);
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'test-report/wizard-step1-hover.png' 
    });

    // Simulate file selection (create a test file)
    const fileInput = page.locator(TestSelectors.wizard.fileInput);
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-report/wizard-step1-file-selected.png',
      fullPage: true 
    });

    // Progress bar state (if visible)
    const progressBar = page.locator('.progress-bar, .upload-progress');
    if (await progressBar.count() > 0) {
      await progressBar.screenshot({ 
        path: 'test-report/wizard-step1-progress.png' 
      });
    }
  });

  test('Wizard Step 2 - AI Analysis Results', async ({ page }) => {
    await page.goto('/dev-wizard?e2e=1');
    await page.waitForSelector(TestSelectors.wizard.container, { timeout: 10000 });
    
    // Upload an image and proceed to step 2
    const fileInput = page.locator(TestSelectors.wizard.fileInput);
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    await page.waitForTimeout(1000);
    await page.click(TestSelectors.wizard.continueButton);
    await page.waitForTimeout(TestTiming.wizard.stepTransition); // Natural processing delay

    // Step 2 - AI analysis results
    await page.screenshot({ 
      path: 'test-report/wizard-step2-analysis-results.png',
      fullPage: true 
    });

    // OpenAI analysis section
    const openaiSection = page.locator('.openai-analysis, [data-provider="openai"]');
    if (await openaiSection.count() > 0) {
      await openaiSection.screenshot({ 
        path: 'test-report/wizard-step2-openai-analysis.png' 
      });
    }

    // Claude analysis section
    const claudeSection = page.locator('.claude-analysis, [data-provider="claude"]');
    if (await claudeSection.count() > 0) {
      await claudeSection.screenshot({ 
        path: 'test-report/wizard-step2-claude-analysis.png' 
      });
    }

    // Comparison view (if available)
    const comparisonView = page.locator('.analysis-comparison, .side-by-side');
    if (await comparisonView.count() > 0) {
      await comparisonView.screenshot({ 
        path: 'test-report/wizard-step2-comparison.png' 
      });
    }
  });

  test('Wizard Step 3 - Voice Selection Interface', async ({ page }) => {
    await page.goto('/dev-wizard?e2e=1');
    await page.waitForSelector(TestSelectors.wizard.container, { timeout: 10000 });
    
    // Navigate to audio step
    const fileInput = page.locator(TestSelectors.wizard.fileInput);
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    await page.waitForTimeout(1000);
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(TestTiming.wizard.stepTransition); // Natural processing delay
    await page.click('button:has-text("Continue"), button:has-text("Save")');
    await page.waitForTimeout(TestTiming.wizard.stepTransition); // Natural processing delay

    // Audio step - voice selection
    await page.screenshot({ 
      path: 'test-report/wizard-step3-voice-selection.png',
      fullPage: true 
    });

    // Voice grid/list
    const voiceGrid = page.locator('.voice-grid, .voices-list, .voice-options');
    if (await voiceGrid.count() > 0) {
      await voiceGrid.screenshot({ 
        path: 'test-report/wizard-step3-voice-grid.png' 
      });
    }

    // Individual voice card
    const voiceCard = page.locator('.voice-card, .voice-option').first();
    if (await voiceCard.count() > 0) {
      await voiceCard.screenshot({ 
        path: 'test-report/wizard-step3-voice-card.png' 
      });

      // Hover on voice card
      await voiceCard.hover();
      await page.waitForTimeout(TestTiming.hover);
      await voiceCard.screenshot({ 
        path: 'test-report/wizard-step3-voice-card-hover.png' 
      });
    }

    // Voice player/sample button
    const sampleButton = page.locator('button:has-text("Sample"), .sample-button, .play-button').first();
    if (await sampleButton.count() > 0) {
      await sampleButton.click();
      await page.waitForTimeout(TestTiming.wizard.fileProcessing);
      await page.screenshot({ 
        path: 'test-report/wizard-step3-voice-playing.png' 
      });
    }
  });

  test('Wizard Step 4 - Final Review and Progress', async ({ page }) => {
    await page.goto('/dev-wizard?e2e=1');
    await page.waitForSelector(TestSelectors.wizard.container, { timeout: 10000 });
    
    // Navigate through all steps to finalize
    const fileInput = page.locator(TestSelectors.wizard.fileInput);
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    await page.waitForTimeout(1000);
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(TestTiming.wizard.stepTransition); // Natural processing delay
    await page.click('button:has-text("Continue"), button:has-text("Save")');
    await page.waitForTimeout(TestTiming.wizard.stepTransition); // Natural processing delay
    await page.click('button:has-text("Generate"), button:has-text("Create")');
    await page.waitForTimeout(TestTiming.wizard.stepTransition); // Natural processing delay

    // Final step - review and completion
    await page.screenshot({ 
      path: 'test-report/wizard-step4-final-review.png',
      fullPage: true 
    });

    // Summary section
    const summarySection = page.locator('.summary, .review-section, .final-details');
    if (await summarySection.count() > 0) {
      await summarySection.screenshot({ 
        path: 'test-report/wizard-step4-summary.png' 
      });
    }

    // Success state
    const successIndicator = page.locator('.success, .completed, .checkmark, :has-text("Success")');
    if (await successIndicator.count() > 0) {
      await successIndicator.screenshot({ 
        path: 'test-report/wizard-step4-success.png' 
      });
    }
  });

  test('Wizard Progress Indicator States', async ({ page }) => {
    await page.goto('/dev-wizard?e2e=1');
    await page.waitForSelector(TestSelectors.wizard.container, { timeout: 10000 });
    
    // Step 1 progress
    const progressIndicator = page.locator('.progress-indicator, .wizard-steps, .step-indicator');
    if (await progressIndicator.count() > 0) {
      await progressIndicator.screenshot({ 
        path: 'test-report/wizard-progress-step1.png' 
      });
    }

    // Navigate to step 2
    const fileInput = page.locator(TestSelectors.wizard.fileInput);
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    await page.waitForTimeout(1000);
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(1000);

    // Step 2 progress
    if (await progressIndicator.count() > 0) {
      await progressIndicator.screenshot({ 
        path: 'test-report/wizard-progress-step2.png' 
      });
    }

    // Navigate to step 3
    await page.click('button:has-text("Continue"), button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Step 3 progress
    if (await progressIndicator.count() > 0) {
      await progressIndicator.screenshot({ 
        path: 'test-report/wizard-progress-step3.png' 
      });
    }
  });

  test('Wizard Mobile Responsive Layouts', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dev-wizard?e2e=1');
    await page.waitForSelector(TestSelectors.wizard.container, { timeout: 10000 });
    
    // Mobile step 1
    await page.screenshot({ 
      path: 'test-report/wizard-mobile-step1.png',
      fullPage: true 
    });

    // Navigate through steps on mobile
    const fileInput = page.locator(TestSelectors.wizard.fileInput);
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    await page.waitForTimeout(1000);
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(TestTiming.wizard.stepTransition); // Natural processing delay

    // Mobile step 2
    await page.screenshot({ 
      path: 'test-report/wizard-mobile-step2.png',
      fullPage: true 
    });

    await page.click('button:has-text("Continue"), button:has-text("Save")');
    await page.waitForTimeout(TestTiming.wizard.stepTransition); // Natural processing delay

    // Mobile step 3
    await page.screenshot({ 
      path: 'test-report/wizard-mobile-step3.png',
      fullPage: true 
    });

    // Test tablet size too
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForSelector(TestSelectors.wizard.container, { timeout: 10000 });
    
    await page.screenshot({ 
      path: 'test-report/wizard-tablet-layout.png',
      fullPage: true 
    });
  });

  test('Wizard Error States and Validation', async ({ page }) => {
    await page.goto('/dev-wizard?e2e=1');
    await page.waitForSelector(TestSelectors.wizard.container, { timeout: 10000 });
    
    // Try to continue without uploading
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(1000);
    
    // Validation error state
    await page.screenshot({ 
      path: 'test-report/wizard-validation-error.png' 
    });

    // Look for error messages
    const errorMessage = page.locator('.error, .text-red-500, .validation-error, :has-text("required")');
    if (await errorMessage.count() > 0) {
      await errorMessage.first().screenshot({ 
        path: 'test-report/wizard-error-message.png' 
      });
    }

    // Mock a network error
    await page.route('**/api/ai/analyze-image', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Analysis failed' })
      });
    });

    // Upload file and try to continue
    const fileInput = page.locator(TestSelectors.wizard.fileInput);
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });

    await page.waitForTimeout(1000);
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(TestTiming.wizard.stepTransition);

    // Network error state
    await page.screenshot({ 
      path: 'test-report/wizard-network-error.png',
      fullPage: true 
    });
  });
});