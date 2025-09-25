import { test, expect } from '@playwright/test';
import { TestTiming, TestSelectors } from './config/timing';
import { authenticateUser, logoutUser } from './helpers/auth';

test.describe('Template System Visual Documentation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock AI content generation to avoid external API calls
    await page.route('**/api/ai/generate-content', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: 'This artwork demonstrates masterful use of color and composition, creating a striking visual impact that draws the viewer into a contemplative dialogue with form and meaning.'
        })
      });
    });

    // Use real authentication instead of bypass
    await authenticateUser(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean logout after each test
    await logoutUser(page);
  });

  test('Template Selector - Fixed State Screenshot', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.toString());
    });

    await page.goto('/admin/posts/create');
    
    // Wait for page to load and React to hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if template selector has loaded
    const templateSelectorExists = await page.locator('h1:has-text("Choose a Content Template")').count() > 0;
    
    if (templateSelectorExists) {
      console.log('✅ Template selector loaded successfully!');
      
      // Take full page screenshot
      await page.screenshot({ 
        path: './template-selector-working.png',
        fullPage: true 
      });
      
      // Capture template selector header
      await page.locator('h1:has-text("Choose a Content Template")').screenshot({
        path: './template-selector-header.png'
      });
      
      // Capture template cards if they exist
      const templateCards = page.locator('.bg-white.rounded-lg.shadow-md');
      if (await templateCards.count() > 0) {
        await templateCards.first().screenshot({
          path: './template-card-example.png'
        });
      }
      
    } else {
      console.log('❌ Template selector still not loading, capturing current state');
      
      // Take screenshot of current state for debugging
      await page.screenshot({ 
        path: './template-system-debug-state.png',
        fullPage: true 
      });
      
      // Check what content is actually present
      const pageContent = await page.content();
      console.log('Page contains "Choose a Content Template":', pageContent.includes('Choose a Content Template'));
      console.log('Page contains "Loading":', pageContent.includes('Loading'));
      
      // Try to find any React error or console errors
      const errors = await page.evaluate(() => {
        return {
          hasReactError: window.document.querySelector('[data-reactroot]') === null,
          consoleErrors: window.console?.error ? 'Console errors may exist' : 'No console errors detected'
        };
      });
      console.log('React/Console state:', errors);
    }
    
    // Log captured errors
    if (consoleErrors.length > 0) {
      console.log('🚨 Console Errors:');
      consoleErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    }
    
    if (pageErrors.length > 0) {
      console.log('🚨 Page Errors:');
      pageErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    }
    
    if (consoleErrors.length === 0 && pageErrors.length === 0) {
      console.log('✅ No errors detected');
    }
  });

  test('Template Categories and Filters', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Category filter buttons
    const categorySection = page.locator('.flex:has(button:has-text("All Templates"))');
    await categorySection.screenshot({
      path: 'test-report/template-categories.png'
    });

    // Test different category selections
    await page.click('button:has-text("Art Critique")');
    await page.waitForTimeout(TestTiming.uiTransition);
    await page.screenshot({
      path: 'test-report/template-art-critique-filter.png'
    });

    await page.click('button:has-text("Exhibitions")');
    await page.waitForTimeout(TestTiming.uiTransition);
    await page.screenshot({
      path: 'test-report/template-exhibition-filter.png'
    });

    await page.click('button:has-text("Educational")');
    await page.waitForTimeout(TestTiming.uiTransition);
    await page.screenshot({
      path: 'test-report/template-educational-filter.png'
    });
  });

  test('Template Cards and Details', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Template grid
    const templateGrid = page.locator('.grid:has(.bg-white.rounded-lg.shadow-md)');
    await templateGrid.screenshot({
      path: 'test-report/template-grid.png'
    });

    // Individual template cards
    const templates = page.locator('.bg-white.rounded-lg.shadow-md');
    const templateCount = await templates.count();

    for (let i = 0; i < Math.min(templateCount, 4); i++) {
      const template = templates.nth(i);
      const templateName = await template.locator('h3').textContent();
      const safeName = templateName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `template-${i}`;
      
      await template.screenshot({
        path: `test-report/template-card-${safeName}.png`
      });

      // Hover effect
      await template.hover();
      await page.waitForTimeout(TestTiming.hover);
      await template.screenshot({
        path: `test-report/template-card-${safeName}-hover.png`
      });
    }
  });

  test('Template Search Functionality', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Search for "critique"
    await page.fill('input[placeholder*="Search"]', 'critique');
    await page.waitForTimeout(TestTiming.typing);
    await page.screenshot({
      path: 'test-report/template-search-critique.png',
      fullPage: true
    });

    // Search for "interview"
    await page.fill('input[placeholder*="Search"]', 'interview');
    await page.waitForTimeout(TestTiming.typing);
    await page.screenshot({
      path: 'test-report/template-search-interview.png',
      fullPage: true
    });

    // No results search
    await page.fill('input[placeholder*="Search"]', 'xyz123notfound');
    await page.waitForTimeout(TestTiming.typing);
    await page.screenshot({
      path: 'test-report/template-search-no-results.png',
      fullPage: true
    });
  });

  test('Template Editor - Art Critique Template', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Select Art Critique template
    await page.click('button:has-text("Use This Template")');
    await page.waitForTimeout(TestTiming.processing);

    // Wait for template editor to load
    await page.waitForSelector('h1:has-text("Formal Art Analysis")', { timeout: 10000 });

    // Template editor header
    await page.locator('.flex:has(h1:has-text("Formal Art Analysis"))').screenshot({
      path: 'test-report/template-editor-header.png'
    });

    // Progress bar
    await page.locator('.w-full.bg-gray-200.rounded-full').screenshot({
      path: 'test-report/template-editor-progress.png'
    });

    // Title section
    await page.locator('.bg-gray-50.rounded-lg:has(label:has-text("Content Title"))').screenshot({
      path: 'test-report/template-editor-title-section.png'
    });

    // Current section editor
    const currentSection = page.locator('.bg-white.rounded-lg.shadow-sm.border').first();
    await currentSection.screenshot({
      path: 'test-report/template-editor-current-section.png'
    });
  });

  test('Template Editor - Section Navigation', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Select template and navigate to editor
    await page.click('button:has-text("Use This Template")');
    await page.waitForTimeout(TestTiming.processing);
    await page.waitForSelector('h1:has-text("Formal Art Analysis")', { timeout: 10000 });

    // Fill title
    await page.fill('input[placeholder*="compelling title"]', 'The Persistence of Memory: A Surrealist Masterpiece');
    await page.waitForTimeout(TestTiming.typing);

    // Section navigation dots
    const navigationDots = page.locator('.flex.gap-2:has(.w-3.h-3.rounded-full)');
    await navigationDots.screenshot({
      path: 'test-report/template-editor-navigation-dots.png'
    });

    // Navigation buttons
    const navigationButtons = page.locator('.flex.items-center.justify-between:has(button:has-text("Previous"))');
    await navigationButtons.screenshot({
      path: 'test-report/template-editor-navigation-buttons.png'
    });

    // Navigate to next section
    await page.click('button:has-text("Next Section")');
    await page.waitForTimeout(TestTiming.uiTransition);
    await page.screenshot({
      path: 'test-report/template-editor-section-2.png',
      fullPage: true
    });
  });

  test('Template Editor - AI Content Generation', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Select template and navigate to editor
    await page.click('button:has-text("Use This Template")');
    await page.waitForTimeout(TestTiming.processing);
    await page.waitForSelector('h1:has-text("Formal Art Analysis")', { timeout: 10000 });

    // Navigate to a section with AI generation
    await page.click('button:has-text("Next Section")');
    await page.waitForTimeout(TestTiming.uiTransition);
    await page.click('button:has-text("Next Section")');
    await page.waitForTimeout(TestTiming.uiTransition);
    await page.click('button:has-text("Next Section")');
    await page.waitForTimeout(TestTiming.uiTransition);

    // AI Generate button
    const aiButton = page.locator('button:has-text("✨ AI Generate")');
    if (await aiButton.count() > 0) {
      await aiButton.screenshot({
        path: 'test-report/template-editor-ai-button.png'
      });

      // Click AI generate
      await aiButton.click();
      await page.waitForTimeout(TestTiming.wizard.analysisDelay);

      // AI generated content notification
      const aiNotification = page.locator('.bg-purple-50.border.border-purple-200');
      if (await aiNotification.count() > 0) {
        await aiNotification.screenshot({
          path: 'test-report/template-editor-ai-generated.png'
        });
      }
    }
  });

  test('Template Editor - Different Section Types', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Select Art Critique template
    await page.click('button:has-text("Use This Template")');
    await page.waitForTimeout(TestTiming.processing);
    await page.waitForSelector('h1:has-text("Formal Art Analysis")', { timeout: 10000 });

    const sections = [
      { name: 'Image Upload Section', step: 1 },
      { name: 'Metadata Section', step: 2 },
      { name: 'Text Section', step: 3 },
      { name: 'Rich Text Section', step: 4 }
    ];

    for (const section of sections) {
      // Navigate to specific section
      for (let i = 0; i < section.step; i++) {
        if (i > 0) {
          await page.click('button:has-text("Next Section")');
          await page.waitForTimeout(TestTiming.uiTransition);
        }
      }

      // Screenshot the section
      const currentSection = page.locator('.bg-white.rounded-lg.shadow-sm.border').first();
      await currentSection.screenshot({
        path: `test-report/template-editor-${section.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
      });
    }
  });

  test('Template Editor - Save and Publish Options', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Select template and navigate to editor
    await page.click('button:has-text("Use This Template")');
    await page.waitForTimeout(TestTiming.processing);
    await page.waitForSelector('h1:has-text("Formal Art Analysis")', { timeout: 10000 });

    // Fill required title
    await page.fill('input[placeholder*="compelling title"]', 'Salvador Dalí and the Art of Surrealism');
    await page.waitForTimeout(TestTiming.typing);

    // Save and publish buttons
    const saveButtons = page.locator('.flex.gap-2:has(button:has-text("Save Draft"))');
    await saveButtons.screenshot({
      path: 'test-report/template-editor-save-buttons.png'
    });

    // Back button and header actions
    const headerActions = page.locator('.flex.items-center.justify-between:has(button:has-text("Back"))');
    await headerActions.screenshot({
      path: 'test-report/template-editor-header-actions.png'
    });
  });

  test('Template Editor - Mobile Responsive View', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 393, height: 852 });
    
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Mobile template selector
    await page.screenshot({
      path: 'test-report/template-selector-mobile.png',
      fullPage: true
    });

    // Select template on mobile
    await page.click('button:has-text("Use This Template")');
    await page.waitForTimeout(TestTiming.processing);
    await page.waitForSelector('h1:has-text("Formal Art Analysis")', { timeout: 10000 });

    // Mobile template editor
    await page.screenshot({
      path: 'test-report/template-editor-mobile.png',
      fullPage: true
    });

    // Mobile navigation
    const mobileNav = page.locator('.flex.items-center.justify-between:has(.flex.gap-2)');
    await mobileNav.screenshot({
      path: 'test-report/template-editor-mobile-navigation.png'
    });
  });

  test('Template System Integration with Admin Toggle', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Skip template to see admin toggle
    await page.click('button:has-text("Start from Scratch")');
    await page.waitForTimeout(TestTiming.uiTransition);

    // Admin mode toggle with template button
    const adminToggle = page.locator('.fixed.top-4.right-4');
    await adminToggle.screenshot({
      path: 'test-report/admin-toggle-with-template.png'
    });

    // Click back to templates
    await page.click('button:has-text("📋 Templates")');
    await page.waitForTimeout(TestTiming.uiTransition);
    
    // Verify we're back at template selector
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    await page.screenshot({
      path: 'test-report/template-selector-return.png'
    });
  });

  test('Template Metadata and Features Display', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('h1:has-text("Choose a Content Template")', { timeout: 10000 });
    
    // Focus on template metadata
    const templateCard = page.locator('.bg-white.rounded-lg.shadow-md').first();
    
    // Template difficulty badge
    const difficultyBadge = templateCard.locator('.px-2.py-1.rounded-full.text-xs');
    await difficultyBadge.screenshot({
      path: 'test-report/template-difficulty-badge.png'
    });

    // Template metadata (time, sections)
    const metadata = templateCard.locator('.flex.items-center.gap-4:has(span:has-text("m"))');
    await metadata.screenshot({
      path: 'test-report/template-metadata.png'
    });

    // Template features (SEO Ready, Social Ready)
    const features = templateCard.locator('.flex.flex-wrap.gap-1:has(.px-2.py-1.bg-green-100)');
    await features.screenshot({
      path: 'test-report/template-features.png'
    });
  });
});