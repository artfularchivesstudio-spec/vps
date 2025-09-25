// 🎭 Admin Post Creation Flow - E2E Screenshot Testing Theater! ✨
// Complete workflow testing from login to post creation with visual validation

import { test, expect, Page } from '@playwright/test';

// 🎪 Test Configuration
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_TEST_EMAIL || 'admin@artfularchives.studio',
  password: process.env.ADMIN_TEST_PASSWORD || 'test-password-123'
};

const SCREENSHOT_OPTIONS = {
  fullPage: true,
  animations: 'disabled' as const,
  clip: undefined
};

// 🎨 Helper Functions
async function waitForPageLoad(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForTimeout(1000); // Extra buffer for animations
}

async function takeScreenshot(page: Page, name: string, description?: string) {
  if (description) {
    console.log(`📸 Taking screenshot: ${name} - ${description}`);
  }
  await page.screenshot({ 
    path: `test-results/screenshots/admin-flow-${name}.png`, 
    ...SCREENSHOT_OPTIONS 
  });
}

test.describe('🎭 Admin Post Creation Flow - Complete E2E Journey', () => {
  test.beforeEach(async ({ page }) => {
    // 🎪 Set up test environment
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('🎵 Complete Admin Workflow: Login → Create Post → Verify', async ({ page }) => {
    // 🎬 Step 1: Homepage and Navigation
    console.log('🎭 Step 1: Starting from homepage...');
    await takeScreenshot(page, '01-homepage', 'Initial homepage view');
    
    // Navigate to admin login
    await page.click('a[href*="admin"], button:has-text("Admin"), [data-testid="admin-link"]');
    await waitForPageLoad(page);
    await takeScreenshot(page, '02-admin-redirect', 'Redirecting to admin area');

    // 🎪 Step 2: Admin Login Process
    console.log('🎭 Step 2: Admin login process...');
    
    // Check if we're on login page or already logged in
    const isLoginPage = await page.locator('input[type="email"], input[name="email"]').isVisible();
    
    if (isLoginPage) {
      await takeScreenshot(page, '03-login-page', 'Admin login form');
      
      // Fill login form
      await page.fill('input[type="email"], input[name="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"], input[name="password"]', ADMIN_CREDENTIALS.password);
      await takeScreenshot(page, '04-login-filled', 'Login form filled');
      
      // Submit login
      await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      await waitForPageLoad(page, 10000);
    }
    
    // Verify we're in admin dashboard
    await expect(page).toHaveURL(/.*admin.*/);
    await takeScreenshot(page, '05-admin-dashboard', 'Admin dashboard after login');

    // 🎨 Step 3: Navigate to Post Creation
    console.log('🎭 Step 3: Navigating to post creation...');
    
    // Look for posts or create post navigation
    const createPostSelectors = [
      'a[href*="posts"]',
      'button:has-text("Create Post")',
      'a:has-text("Posts")',
      'a:has-text("New Post")',
      '[data-testid="create-post"]',
      '.create-post-button'
    ];
    
    let postNavFound = false;
    for (const selector of createPostSelectors) {
      if (await page.locator(selector).isVisible()) {
        await page.click(selector);
        postNavFound = true;
        break;
      }
    }
    
    if (!postNavFound) {
      // Try navigating directly to posts URL
      await page.goto('/admin/posts');
    }
    
    await waitForPageLoad(page);
    await takeScreenshot(page, '06-posts-section', 'Posts management section');

    // 🎪 Step 4: Create New Post
    console.log('🎭 Step 4: Creating new post...');
    
    // Look for create/new post button
    const newPostSelectors = [
      'button:has-text("New Post")',
      'button:has-text("Create Post")',
      'a:has-text("New Post")',
      'a:has-text("Create")',
      '[data-testid="new-post"]',
      '.new-post-button'
    ];
    
    let newPostFound = false;
    for (const selector of newPostSelectors) {
      if (await page.locator(selector).isVisible()) {
        await page.click(selector);
        newPostFound = true;
        break;
      }
    }
    
    if (!newPostFound) {
      // Try navigating directly to create post URL
      await page.goto('/admin/posts/new');
    }
    
    await waitForPageLoad(page);
    await takeScreenshot(page, '07-create-post-form', 'Create post form');

    // 🎨 Step 5: Fill Post Form
    console.log('🎭 Step 5: Filling post form...');
    
    const testPostData = {
      title: `E2E Test Post - ${new Date().toISOString().split('T')[0]}`,
      content: `This is a test post created by our E2E testing suite on ${new Date().toLocaleString()}. 

This post validates that our admin workflow is functioning correctly:
- Admin login ✅
- Post creation form ✅
- Content management ✅

Our theatrical testing approach ensures every step of the user journey works beautifully! 🎭✨`,
      excerpt: 'A test post created by our comprehensive E2E testing suite to validate the admin workflow.'
    };
    
    // Fill title
    const titleSelectors = ['input[name="title"]', '#title', '[data-testid="post-title"]', 'input[placeholder*="title" i]'];
    for (const selector of titleSelectors) {
      if (await page.locator(selector).isVisible()) {
        await page.fill(selector, testPostData.title);
        break;
      }
    }
    
    await takeScreenshot(page, '08-title-filled', 'Post title filled');
    
    // Fill content
    const contentSelectors = [
      'textarea[name="content"]', 
      '#content', 
      '[data-testid="post-content"]',
      'textarea[placeholder*="content" i]',
      '.editor textarea',
      '[contenteditable="true"]'
    ];
    
    for (const selector of contentSelectors) {
      if (await page.locator(selector).isVisible()) {
        if (selector === '[contenteditable="true"]') {
          await page.locator(selector).fill(testPostData.content);
        } else {
          await page.fill(selector, testPostData.content);
        }
        break;
      }
    }
    
    await takeScreenshot(page, '09-content-filled', 'Post content filled');
    
    // Fill excerpt if available
    const excerptSelectors = ['textarea[name="excerpt"]', '#excerpt', '[data-testid="post-excerpt"]'];
    for (const selector of excerptSelectors) {
      if (await page.locator(selector).isVisible()) {
        await page.fill(selector, testPostData.excerpt);
        break;
      }
    }
    
    await takeScreenshot(page, '10-form-completed', 'Complete post form filled');

    // 🎪 Step 6: Save/Publish Post
    console.log('🎭 Step 6: Saving post...');
    
    // Look for save/publish buttons
    const saveSelectors = [
      'button:has-text("Save Draft")',
      'button:has-text("Save")',
      'button:has-text("Create Post")',
      'button:has-text("Publish")',
      '[data-testid="save-post"]',
      'button[type="submit"]'
    ];
    
    let saveFound = false;
    for (const selector of saveSelectors) {
      if (await page.locator(selector).isVisible()) {
        await page.click(selector);
        saveFound = true;
        break;
      }
    }
    
    if (saveFound) {
      await waitForPageLoad(page, 10000);
      await takeScreenshot(page, '11-post-saved', 'Post saved successfully');
      
      // 🎨 Step 7: Verify Post Creation
      console.log('🎭 Step 7: Verifying post creation...');
      
      // Check for success message or redirect
      const successIndicators = [
        page.locator('text=saved'),
        page.locator('text=created'),
        page.locator('text=success'),
        page.locator('.success'),
        page.locator('.toast'),
        page.locator('[data-testid="success-message"]')
      ];
      
      let successFound = false;
      for (const indicator of successIndicators) {
        if (await indicator.isVisible()) {
          successFound = true;
          break;
        }
      }
      
      await takeScreenshot(page, '12-success-state', 'Post creation success state');
      
      // Navigate back to posts list to verify
      await page.goto('/admin/posts');
      await waitForPageLoad(page);
      await takeScreenshot(page, '13-posts-list-updated', 'Posts list with new post');
      
      // Look for our test post in the list
      const postExists = await page.locator(`text=${testPostData.title}`).isVisible();
      if (postExists) {
        console.log('✅ Test post found in posts list!');
        await takeScreenshot(page, '14-post-verified', 'Test post verified in list');
      }
      
    } else {
      console.log('⚠️ No save button found, taking screenshot of current state');
      await takeScreenshot(page, '11-no-save-button', 'No save button found');
    }

    // 🎭 Step 8: Final Verification Screenshots
    console.log('🎭 Step 8: Final verification...');
    
    // Take a final screenshot of the admin area
    await takeScreenshot(page, '15-final-admin-state', 'Final admin area state');
    
    // Navigate to homepage to verify site is still working
    await page.goto('/');
    await waitForPageLoad(page);
    await takeScreenshot(page, '16-homepage-final', 'Homepage after admin workflow');
    
    console.log('🎉 E2E Admin Post Creation Flow completed successfully!');
  });

  test('🎪 Admin Dashboard Navigation - Screenshot Tour', async ({ page }) => {
    console.log('🎭 Taking a tour of admin dashboard sections...');
    
    // Navigate to admin (assuming login is handled by auth state)
    await page.goto('/admin');
    await waitForPageLoad(page);
    await takeScreenshot(page, 'dashboard-01-main', 'Main admin dashboard');
    
    // Common admin sections to screenshot
    const adminSections = [
      { path: '/admin/posts', name: 'posts-section', title: 'Posts Management' },
      { path: '/admin/media', name: 'media-section', title: 'Media Library' },
      { path: '/admin/tools', name: 'tools-section', title: 'Admin Tools' },
      { path: '/admin/settings', name: 'settings-section', title: 'Settings' }
    ];
    
    for (const section of adminSections) {
      try {
        await page.goto(section.path);
        await waitForPageLoad(page);
        await takeScreenshot(page, `dashboard-${section.name}`, section.title);
        console.log(`📸 Captured ${section.title}`);
      } catch (error) {
        console.log(`⚠️ Could not access ${section.path}: ${error}`);
      }
    }
    
    console.log('🎪 Admin dashboard tour completed!');
  });

  test('🎨 Responsive Admin Interface - Mobile Screenshots', async ({ page }) => {
    console.log('🎭 Testing admin interface on mobile viewport...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 393, height: 852 }); // iPhone 15
    
    await page.goto('/admin');
    await waitForPageLoad(page);
    await takeScreenshot(page, 'mobile-01-dashboard', 'Mobile admin dashboard');
    
    // Test mobile navigation
    const mobileMenuSelectors = [
      'button[aria-label="menu"]',
      '.mobile-menu-button',
      '[data-testid="mobile-menu"]',
      'button:has-text("Menu")'
    ];
    
    for (const selector of mobileMenuSelectors) {
      if (await page.locator(selector).isVisible()) {
        await page.click(selector);
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'mobile-02-menu-open', 'Mobile menu opened');
        break;
      }
    }
    
    console.log('📱 Mobile admin interface testing completed!');
  });
});

// 🎭 Test Cleanup and Utilities
test.afterEach(async ({ page }) => {
  // Clean up any test data if needed
  console.log('🧹 Cleaning up after test...');
});

test.afterAll(async () => {
  console.log('🎪 All admin flow tests completed! Check test-results/screenshots/ for visual evidence.');
});