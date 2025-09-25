import { test, expect } from '@playwright/test';

test.describe('Blog Frontend Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock blog posts API
    await page.route('**/wp-json/wp/v2/posts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: { rendered: 'Beautiful Abstract Art Piece' },
            slug: 'beautiful-abstract-art-piece',
            excerpt: { rendered: 'Exploring the depths of color and form in contemporary abstract expressionism...' },
            content: { rendered: '<p>This stunning piece represents the intersection of emotion and technique...</p>' },
            date: '2024-01-01T00:00:00',
            featured_media: 123,
            categories: [1],
            tags: [1, 2],
            _embedded: {
              'wp:featuredmedia': [{
                source_url: '/abstract-art.png',
                alt_text: 'Abstract art piece'
              }],
              author: [{
                name: 'Art Curator',
                avatar_urls: { '96': '/jane-doe.png' }
              }]
            }
          }
        ])
      });
    });

    // Mock categories
    await page.route('**/wp-json/wp/v2/categories*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Abstract Art', slug: 'abstract-art', count: 5 },
          { id: 2, name: 'Contemporary', slug: 'contemporary', count: 3 }
        ])
      });
    });

    // Mock single post
    await page.route('**/wp-json/wp/v2/posts?slug=beautiful-abstract-art-piece*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          title: { rendered: 'Beautiful Abstract Art Piece' },
          slug: 'beautiful-abstract-art-piece',
          excerpt: { rendered: 'Exploring the depths of color and form...' },
          content: { rendered: `
            <p>This stunning piece represents the intersection of emotion and technique in contemporary abstract expressionism. The artist's bold use of color creates a dynamic visual narrative that speaks to the human condition.</p>
            
            <p>The composition flows with an organic rhythm, each brushstroke carefully considered yet spontaneous in its execution. Notice how the warm ochres transition into cool blues, creating a sense of movement that draws the viewer's eye across the canvas.</p>
            
            <p>This work is part of a larger series exploring themes of transformation and renewal, using abstract forms to convey complex emotional states that words alone cannot capture.</p>
          ` },
          date: '2024-01-01T00:00:00',
          featured_media: 123,
          _embedded: {
            'wp:featuredmedia': [{
              source_url: '/abstract-art.png',
              alt_text: 'Abstract art piece',
              media_details: {
                width: 1200,
                height: 800
              }
            }],
            author: [{
              name: 'Art Curator',
              description: 'Passionate about contemporary art and its cultural impact.',
              avatar_urls: { '96': '/jane-doe.png' }
            }]
          }
        }])
      });
    });
  });

  test('Blog Homepage - Hero and Post Grid', async ({ page }) => {
    await page.goto('/blog');
    
    // Wait for content to load
    await page.waitForSelector('.blog-post-card', { timeout: 10000 });
    
    // Full page screenshot
    await page.screenshot({ 
      path: 'test-report/blog-homepage-full.png',
      fullPage: true 
    });

    // Hero section screenshot
    await page.locator('header, .hero-section').first().screenshot({ 
      path: 'test-report/blog-hero-section.png' 
    });

    // Post grid screenshot
    await page.locator('.posts-grid, .blog-posts-container').first().screenshot({ 
      path: 'test-report/blog-posts-grid.png' 
    });
  });

  test('Individual Blog Post - Magical Layout', async ({ page }) => {
    await page.goto('/blog/beautiful-abstract-art-piece');
    
    // Wait for MagicalBlogPost component to load
    await page.waitForSelector('.magical-blog-post', { timeout: 10000 });
    
    // Full blog post screenshot
    await page.screenshot({ 
      path: 'test-report/blog-post-magical-full.png',
      fullPage: true 
    });

    // Header area with featured image
    await page.locator('.post-header, .featured-image-container').first().screenshot({ 
      path: 'test-report/blog-post-header.png' 
    });

    // Content area
    await page.locator('.post-content, .blog-content').first().screenshot({ 
      path: 'test-report/blog-post-content.png' 
    });

    // Test scroll effects (if any)
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-report/blog-post-scrolled.png' 
    });
  });

  test('Blog Mobile Experience', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/blog');
    await page.waitForSelector('.blog-post-card', { timeout: 10000 });
    
    // Mobile blog homepage
    await page.screenshot({ 
      path: 'test-report/blog-mobile-homepage.png',
      fullPage: true 
    });

    // Navigate to post
    await page.goto('/blog/beautiful-abstract-art-piece');
    await page.waitForSelector('.magical-blog-post', { timeout: 10000 });
    
    // Mobile blog post
    await page.screenshot({ 
      path: 'test-report/blog-mobile-post.png',
      fullPage: true 
    });

    // Test mobile reading experience
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-report/blog-mobile-reading.png' 
    });
  });

  test('Blog Dark Mode (if implemented)', async ({ page }) => {
    // Check if dark mode toggle exists and test it
    await page.goto('/blog');
    await page.waitForSelector('.blog-post-card', { timeout: 10000 });
    
    // Look for dark mode toggle
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"], .dark-mode-toggle, button:has-text("Dark"), button:has-text("Light")');
    
    if (await darkModeToggle.count() > 0) {
      // Take light mode screenshot first
      await page.screenshot({ 
        path: 'test-report/blog-light-mode.png',
        fullPage: true 
      });

      // Toggle to dark mode
      await darkModeToggle.first().click();
      await page.waitForTimeout(1000);
      
      // Take dark mode screenshot
      await page.screenshot({ 
        path: 'test-report/blog-dark-mode.png',
        fullPage: true 
      });
    } else {
      // Just take a regular screenshot if no dark mode
      await page.screenshot({ 
        path: 'test-report/blog-default-theme.png',
        fullPage: true 
      });
    }
  });

  test('Blog Categories and Navigation', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForSelector('.blog-post-card', { timeout: 10000 });
    
    // Look for category navigation
    const categoryNav = page.locator('.categories, .blog-nav, nav:has-text("Categories")');
    
    if (await categoryNav.count() > 0) {
      await categoryNav.first().screenshot({ 
        path: 'test-report/blog-category-nav.png' 
      });
    }

    // Test category page
    await page.goto('/blog/category/abstract-art');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-report/blog-category-page.png',
      fullPage: true 
    });
  });

  test('Blog Search Functionality', async ({ page }) => {
    await page.goto('/search');
    await page.waitForTimeout(2000);
    
    // Search page screenshot
    await page.screenshot({ 
      path: 'test-report/blog-search-page.png',
      fullPage: true 
    });

    // If search input exists, test search
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('abstract art');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'test-report/blog-search-results.png',
        fullPage: true 
      });
    }
  });
});