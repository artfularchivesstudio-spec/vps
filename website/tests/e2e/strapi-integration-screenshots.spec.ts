import { test, expect } from '@playwright/test';

test.describe('Strapi Integration Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for admin access
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

    // Mock Strapi health check
    await page.route('**/api/healthCheck', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          strapi: 'healthy',
          wordpress: 'healthy',
          primarySource: 'wordpress',
          stats: {
            articles: 15,
            categories: 5,
            tags: 12,
            authors: 3,
            isHealthy: true
          }
        })
      });
    });

    // Mock Strapi blog posts
    await page.route('**/api/getBlogPosts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          posts: [
            {
              id: 1,
              title: 'Strapi-Managed Art Article',
              slug: 'strapi-managed-art-article',
              excerpt: 'This article is managed through Strapi CMS',
              content: 'Full content from Strapi...',
              featuredImage: '/abstract-art.png',
              author: { name: 'Strapi Author', slug: 'strapi-author' },
              categories: [{ name: 'Digital Art', slug: 'digital-art', color: '#3B82F6' }],
              tags: [{ name: 'Modern', slug: 'modern', color: '#EF4444' }],
              metaData: { source: 'strapi', strapiId: 1 }
            },
            {
              id: 2,
              title: 'WordPress Fallback Article',
              slug: 'wordpress-fallback-article',
              excerpt: 'This article falls back to WordPress',
              content: 'Content from WordPress API...',
              featuredImage: '/sculpture.png',
              author: { name: 'WP Author', slug: 'wp-author' },
              categories: [{ name: 'Traditional Art', slug: 'traditional-art' }],
              tags: [{ name: 'Classic', slug: 'classic' }],
              metaData: { source: 'wordpress' }
            }
          ],
          pagination: { currentPage: 1, totalPages: 1, totalPosts: 2 }
        })
      });
    });

    // Mock featured posts
    await page.route('**/api/getFeaturedPosts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Featured Strapi Article',
            slug: 'featured-strapi-article',
            excerpt: 'This is a featured article from Strapi',
            featuredImage: '/mountain-serenity.png',
            metaData: { source: 'strapi', strapiId: 1 }
          }
        ])
      });
    });

    // Mock categories
    await page.route('**/api/getBlogCategories*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'Abstract Art',
            slug: 'abstract-art',
            description: 'Contemporary abstract artworks',
            color: '#8B5CF6',
            icon: '🎨',
            orderIndex: 1,
            count: 8,
            featuredImage: '/abstract-art.png'
          },
          {
            id: 2,
            name: 'Digital Art',
            slug: 'digital-art',
            description: 'Modern digital creations',
            color: '#3B82F6',
            icon: '💻',
            orderIndex: 2,
            count: 5,
            featuredImage: null
          }
        ])
      });
    });

    // Mock search results
    await page.route('**/api/searchArticles*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Search Result Article',
            slug: 'search-result-article',
            excerpt: 'This article was found via Strapi search',
            metaData: { source: 'strapi' }
          }
        ])
      });
    });
  });

  test('Strapi Test Interface - Health Dashboard', async ({ page }) => {
    await page.goto('/admin/strapi-test');
    
    // Wait for the test interface to load
    await page.waitForSelector('.strapi-test-interface', { timeout: 10000 });
    
    // Full page screenshot of test interface
    await page.screenshot({ 
      path: 'test-report/strapi-test-interface-full.png',
      fullPage: true 
    });

    // Health check section
    await page.locator('.health-check-section').screenshot({ 
      path: 'test-report/strapi-health-check.png' 
    });

    // Statistics section
    if (await page.locator('.statistics-section').count() > 0) {
      await page.locator('.statistics-section').screenshot({ 
        path: 'test-report/strapi-statistics.png' 
      });
    }
  });

  test('Strapi Test Interface - Content Tests', async ({ page }) => {
    await page.goto('/admin/strapi-test');
    await page.waitForSelector('.strapi-test-interface', { timeout: 10000 });
    
    // Wait for content to load
    await page.waitForTimeout(3000);

    // Blog posts section
    if (await page.locator('.blog-posts-section').count() > 0) {
      await page.locator('.blog-posts-section').screenshot({ 
        path: 'test-report/strapi-blog-posts-test.png' 
      });
    }

    // Featured posts section
    if (await page.locator('.featured-posts-section').count() > 0) {
      await page.locator('.featured-posts-section').screenshot({ 
        path: 'test-report/strapi-featured-posts-test.png' 
      });
    }

    // Categories section
    if (await page.locator('.categories-section').count() > 0) {
      await page.locator('.categories-section').screenshot({ 
        path: 'test-report/strapi-categories-test.png' 
      });
    }
  });

  test('Strapi Test Interface - Run Tests Button', async ({ page }) => {
    await page.goto('/admin/strapi-test');
    await page.waitForSelector('.strapi-test-interface', { timeout: 10000 });
    
    // Screenshot before running tests
    await page.screenshot({ 
      path: 'test-report/strapi-test-before-run.png' 
    });

    // Click run tests button if it exists
    const runTestsButton = page.locator('button:has-text("Run Tests"), button:has-text("Test")');
    if (await runTestsButton.count() > 0) {
      await runTestsButton.first().click();
      
      // Wait for tests to "run"
      await page.waitForTimeout(2000);
      
      // Screenshot after running tests
      await page.screenshot({ 
        path: 'test-report/strapi-test-after-run.png',
        fullPage: true 
      });
    }
  });

  test('Strapi Integration Status Indicators', async ({ page }) => {
    await page.goto('/admin/strapi-test');
    await page.waitForSelector('.strapi-test-interface', { timeout: 10000 });
    
    // Look for status indicators
    const healthyIndicators = page.locator('.status-healthy, .text-green-600, .bg-green-100');
    const unhealthyIndicators = page.locator('.status-unhealthy, .text-red-600, .bg-red-100');
    const unknownIndicators = page.locator('.status-unknown, .text-gray-600, .bg-gray-100');

    if (await healthyIndicators.count() > 0) {
      await healthyIndicators.first().screenshot({ 
        path: 'test-report/strapi-status-healthy.png' 
      });
    }

    // Test API source switching indicators
    const primarySourceIndicator = page.locator('.primary-source, .bg-blue-100');
    if (await primarySourceIndicator.count() > 0) {
      await primarySourceIndicator.first().screenshot({ 
        path: 'test-report/strapi-primary-source.png' 
      });
    }
  });

  test('Strapi vs WordPress Data Comparison', async ({ page }) => {
    await page.goto('/admin/strapi-test');
    await page.waitForSelector('.strapi-test-interface', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Look for data source indicators in content
    const strapiContent = page.locator('[data-source="strapi"], .source-strapi, :has-text("Source: strapi")');
    const wordpressContent = page.locator('[data-source="wordpress"], .source-wordpress, :has-text("Source: wordpress")');

    if (await strapiContent.count() > 0) {
      await strapiContent.first().screenshot({ 
        path: 'test-report/strapi-content-example.png' 
      });
    }

    if (await wordpressContent.count() > 0) {
      await wordpressContent.first().screenshot({ 
        path: 'test-report/wordpress-content-example.png' 
      });
    }

    // Screenshot any comparison tables or grids
    const comparisonTable = page.locator('table, .comparison-grid, .content-grid');
    if (await comparisonTable.count() > 0) {
      await comparisonTable.first().screenshot({ 
        path: 'test-report/strapi-content-comparison.png' 
      });
    }
  });

  test('Strapi Mobile Test Interface', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/admin/strapi-test');
    await page.waitForSelector('.strapi-test-interface', { timeout: 10000 });
    
    // Mobile screenshot
    await page.screenshot({ 
      path: 'test-report/strapi-test-mobile.png',
      fullPage: true 
    });

    // Test mobile responsiveness of key sections
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'test-report/strapi-test-mobile-scrolled.png' 
    });
  });

  test('Strapi Error States', async ({ page }) => {
    // Mock error states
    await page.route('**/api/healthCheck', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          strapi: 'unhealthy',
          wordpress: 'healthy',
          primarySource: 'wordpress',
          stats: null
        })
      });
    });

    await page.goto('/admin/strapi-test');
    await page.waitForSelector('.strapi-test-interface', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Screenshot error state
    await page.screenshot({ 
      path: 'test-report/strapi-error-state.png',
      fullPage: true 
    });

    // Look for error messages or indicators
    const errorElements = page.locator('.error, .text-red-600, .bg-red-100, :has-text("unhealthy"), :has-text("error")');
    if (await errorElements.count() > 0) {
      await errorElements.first().screenshot({ 
        path: 'test-report/strapi-error-indicator.png' 
      });
    }
  });
});