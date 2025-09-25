import { test, expect } from '@playwright/test';

test.describe('Admin Interface Visual Tests', () => {
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

    // Mock admin profile check
    await page.route('**/rest/v1/rpc/is_admin_user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(true)
      });
    });

    // Mock blog posts data
    await page.route('**/rest/v1/blog_posts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Sample Blog Post',
            slug: 'sample-blog-post',
            excerpt: 'This is a sample blog post for testing',
            status: 'published',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            workflow_stage: 'published',
            primary_audio_id: null
          },
          {
            id: 2,
            title: 'Draft Article',
            slug: 'draft-article',
            excerpt: 'This is a draft article',
            status: 'draft',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            workflow_stage: 'draft',
            primary_audio_id: null
          }
        ])
      });
    });

    // Mock audio jobs batch status
    await page.route('**/api/audio-jobs/batch-status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          '1': { status: 'completed', progress: 100 },
          '2': { status: 'pending', progress: 0 }
        })
      });
    });
  });

  test('Admin Dashboard - Main View', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'test-report/admin-dashboard-main.png',
      fullPage: true 
    });

    // Take viewport screenshot for responsive design
    await page.screenshot({ 
      path: 'test-report/admin-dashboard-viewport.png' 
    });
  });

  test('Admin Posts List - with Audio Status', async ({ page }) => {
    await page.goto('/admin/posts');
    
    // Wait for posts to load
    await page.waitForSelector('table', { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow audio status to load
    
    // Take screenshot of posts list with audio status indicators
    await page.screenshot({ 
      path: 'test-report/admin-posts-list.png',
      fullPage: true 
    });

    // Screenshot just the table area
    await page.locator('table').screenshot({ 
      path: 'test-report/admin-posts-table.png' 
    });
  });

  test('Admin Navigation States', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('nav', { timeout: 10000 });
    
    // Screenshot default navigation
    await page.locator('nav').screenshot({ 
      path: 'test-report/admin-nav-default.png' 
    });

    // Navigate to posts and screenshot active state
    await page.click('a[href="/admin/posts"]');
    await page.waitForTimeout(1000);
    await page.locator('nav').screenshot({ 
      path: 'test-report/admin-nav-posts-active.png' 
    });

    // Navigate to workflow and screenshot active state
    await page.click('a[href="/admin/workflow"]');
    await page.waitForTimeout(1000);
    await page.locator('nav').screenshot({ 
      path: 'test-report/admin-nav-workflow-active.png' 
    });
  });

  test('Admin Mobile Responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin');
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });
    
    await page.screenshot({ 
      path: 'test-report/admin-mobile-portrait.png',
      fullPage: true 
    });

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });
    
    await page.screenshot({ 
      path: 'test-report/admin-tablet-portrait.png',
      fullPage: true 
    });
  });

  test('Admin Create Post Page', async ({ page }) => {
    await page.goto('/admin/posts/create');
    await page.waitForSelector('.wizard-container', { timeout: 10000 });
    
    // Screenshot initial wizard state
    await page.screenshot({ 
      path: 'test-report/admin-create-post-initial.png',
      fullPage: true 
    });

    // Screenshot just the wizard component
    await page.locator('.wizard-container').screenshot({ 
      path: 'test-report/admin-wizard-component.png' 
    });
  });
});