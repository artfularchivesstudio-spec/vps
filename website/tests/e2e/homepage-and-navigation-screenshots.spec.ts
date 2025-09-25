import { test, expect } from '@playwright/test';

test.describe('Homepage and Navigation Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock blog posts for homepage
    await page.route('**/wp-json/wp/v2/posts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: { rendered: 'Latest Art Exhibition' },
            slug: 'latest-art-exhibition',
            excerpt: { rendered: 'Discover our newest collection of contemporary artworks...' },
            date: '2024-01-01T00:00:00',
            featured_media: 123,
            _embedded: {
              'wp:featuredmedia': [{
                source_url: '/abstract-art.png',
                alt_text: 'Abstract art piece'
              }]
            }
          },
          {
            id: 2,
            title: { rendered: 'Artist Spotlight: Modern Masters' },
            slug: 'artist-spotlight-modern-masters',
            excerpt: { rendered: 'Meet the artists shaping contemporary art today...' },
            date: '2024-01-02T00:00:00',
            featured_media: 124,
            _embedded: {
              'wp:featuredmedia': [{
                source_url: '/sculpture.png',
                alt_text: 'Modern sculpture'
              }]
            }
          }
        ])
      });
    });

    // Mock categories for navigation
    await page.route('**/wp-json/wp/v2/categories*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Abstract Art', slug: 'abstract-art', count: 5 },
          { id: 2, name: 'Contemporary', slug: 'contemporary', count: 8 },
          { id: 3, name: 'Digital Art', slug: 'digital-art', count: 3 }
        ])
      });
    });
  });

  test('Homepage - Hero Section and Layout', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Full homepage screenshot
    await page.screenshot({ 
      path: 'test-report/homepage-full.png',
      fullPage: true 
    });

    // Hero section specifically
    const heroSection = page.locator('.hero, .hero-section, header, .banner').first();
    if (await heroSection.count() > 0) {
      await heroSection.screenshot({ 
        path: 'test-report/homepage-hero-section.png' 
      });
    }

    // Featured content section
    const featuredSection = page.locator('.featured, .featured-posts, .latest-posts').first();
    if (await featuredSection.count() > 0) {
      await featuredSection.screenshot({ 
        path: 'test-report/homepage-featured-content.png' 
      });
    }
  });

  test('Homepage - Interactive Elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Test hover states on cards/buttons
    const interactiveElements = page.locator('.card, .btn, button, a[class]');
    
    if (await interactiveElements.count() > 0) {
      const firstElement = interactiveElements.first();
      
      // Normal state
      await firstElement.screenshot({ 
        path: 'test-report/homepage-element-normal.png' 
      });
      
      // Hover state
      await firstElement.hover();
      await page.waitForTimeout(1200); // Natural hover delay
      await firstElement.screenshot({ 
        path: 'test-report/homepage-element-hover.png' 
      });
    }

    // Scroll effects (if any animations)
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1500); // Natural scroll delay
    await page.screenshot({ 
      path: 'test-report/homepage-scrolled.png' 
    });

    // Particles or background animations
    await page.waitForTimeout(3000); // Longer delay for animations
    await page.screenshot({ 
      path: 'test-report/homepage-with-animations.png' 
    });
  });

  test('Main Navigation - Desktop and Mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('nav, header', { timeout: 10000 });
    
    // Desktop navigation
    const mainNav = page.locator('nav, .navigation, .navbar').first();
    if (await mainNav.count() > 0) {
      await mainNav.screenshot({ 
        path: 'test-report/navigation-desktop.png' 
      });
    }

    // Test navigation hover states
    const navLinks = page.locator('nav a, .nav-link');
    if (await navLinks.count() > 0) {
      await navLinks.first().hover();
      await page.waitForTimeout(1000); // Natural hover delay
      await mainNav.screenshot({ 
        path: 'test-report/navigation-hover-state.png' 
      });
    }

    // Mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('nav, header', { timeout: 10000 });
    
    await page.screenshot({ 
      path: 'test-report/navigation-mobile-closed.png' 
    });

    // Look for mobile menu toggle
    const mobileToggle = page.locator('.mobile-menu-toggle, .hamburger, button:has-text("Menu"), .menu-button');
    if (await mobileToggle.count() > 0) {
      await mobileToggle.first().click();
      await page.waitForTimeout(1500); // Natural menu animation delay
      
      await page.screenshot({ 
        path: 'test-report/navigation-mobile-open.png' 
      });
    }
  });

  test('About Page - Team and Layout', async ({ page }) => {
    await page.goto('/about');
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Full about page
    await page.screenshot({ 
      path: 'test-report/about-page-full.png',
      fullPage: true 
    });

    // Team section (if exists)
    const teamSection = page.locator('.team, .about-team, .team-members');
    if (await teamSection.count() > 0) {
      await teamSection.first().screenshot({ 
        path: 'test-report/about-team-section.png' 
      });
    }

    // Individual team member cards
    const teamMember = page.locator('.team-member, .member-card').first();
    if (await teamMember.count() > 0) {
      await teamMember.screenshot({ 
        path: 'test-report/about-team-member.png' 
      });

      // Hover effect on team member
      await teamMember.hover();
      await page.waitForTimeout(1200); // Natural hover delay
      await teamMember.screenshot({ 
        path: 'test-report/about-team-member-hover.png' 
      });
    }
  });

  test('Store Page - Art Gallery Layout', async ({ page }) => {
    await page.goto('/store');
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Full store page
    await page.screenshot({ 
      path: 'test-report/store-page-full.png',
      fullPage: true 
    });

    // Product grid
    const productGrid = page.locator('.products, .art-grid, .store-grid, .gallery');
    if (await productGrid.count() > 0) {
      await productGrid.first().screenshot({ 
        path: 'test-report/store-product-grid.png' 
      });
    }

    // Individual product/artwork
    const productCard = page.locator('.product, .art-piece, .artwork-card').first();
    if (await productCard.count() > 0) {
      await productCard.screenshot({ 
        path: 'test-report/store-product-card.png' 
      });

      // Hover on product
      await productCard.hover();
      await page.waitForTimeout(1200); // Natural hover delay
      await productCard.screenshot({ 
        path: 'test-report/store-product-hover.png' 
      });
    }

    // Shopping cart (if visible)
    const cart = page.locator('.cart, .shopping-cart, :has-text("Cart")');
    if (await cart.count() > 0) {
      await cart.first().screenshot({ 
        path: 'test-report/store-shopping-cart.png' 
      });
    }
  });

  test('Footer and Layout Elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('footer', { timeout: 10000 });
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500); // Natural scroll delay
    
    // Footer screenshot
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await footer.screenshot({ 
        path: 'test-report/footer-section.png' 
      });
    }

    // Social media links (if in footer)
    const socialLinks = page.locator('.social, .social-media, .social-links');
    if (await socialLinks.count() > 0) {
      await socialLinks.first().screenshot({ 
        path: 'test-report/footer-social-links.png' 
      });
    }

    // Newsletter signup (if exists)
    const newsletter = page.locator('.newsletter, .subscribe, form:has(input[type="email"])');
    if (await newsletter.count() > 0) {
      await newsletter.first().screenshot({ 
        path: 'test-report/footer-newsletter.png' 
      });
    }
  });

  test('Search Functionality and Results', async ({ page }) => {
    await page.goto('/search');
    await page.waitForTimeout(2000);
    
    // Search page initial state
    await page.screenshot({ 
      path: 'test-report/search-page-initial.png',
      fullPage: true 
    });

    // Search input field
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], .search-input');
    if (await searchInput.count() > 0) {
      await searchInput.first().screenshot({ 
        path: 'test-report/search-input-field.png' 
      });

      // Fill search and submit
      await searchInput.first().fill('abstract art');
      await page.waitForTimeout(1500); // Natural typing delay
      
      // Search with text
      await searchInput.screenshot({ 
        path: 'test-report/search-input-filled.png' 
      });

      // Submit search (press Enter or click button)
      await searchInput.press('Enter');
      await page.waitForTimeout(3000); // Natural search delay
      
      // Search results
      await page.screenshot({ 
        path: 'test-report/search-results-page.png',
        fullPage: true 
      });
    }
  });

  test('Responsive Design Breakpoints', async ({ page }) => {
    const viewports = [
      { name: 'mobile-small', width: 320, height: 568 },
      { name: 'mobile-large', width: 414, height: 896 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'desktop-small', width: 1280, height: 720 },
      { name: 'desktop-large', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForSelector('main', { timeout: 10000 });
      
      await page.screenshot({ 
        path: `test-report/responsive-${viewport.name}.png` 
      });
    }
  });

  test('Dark Mode and Theme Variations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Check for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, .dark-mode-toggle, button:has-text("Dark"), button:has-text("Light")');
    
    if (await themeToggle.count() > 0) {
      // Light mode
      await page.screenshot({ 
        path: 'test-report/theme-light-mode.png',
        fullPage: true 
      });

      // Switch to dark mode
      await themeToggle.first().click();
      await page.waitForTimeout(1500); // Natural theme transition delay
      
      // Dark mode
      await page.screenshot({ 
        path: 'test-report/theme-dark-mode.png',
        fullPage: true 
      });

      // Theme toggle button state
      await themeToggle.first().screenshot({ 
        path: 'test-report/theme-toggle-button.png' 
      });
    } else {
      // No theme toggle, just capture default
      await page.screenshot({ 
        path: 'test-report/theme-default.png',
        fullPage: true 
      });
    }
  });

  test('Loading States and Transitions', async ({ page }) => {
    // Slow down network to capture loading states
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto('/');
    
    // Capture loading state
    await page.screenshot({ 
      path: 'test-report/loading-state.png' 
    });

    // Wait for full load
    await page.waitForSelector('main', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Loaded state
    await page.screenshot({ 
      path: 'test-report/loaded-state.png',
      fullPage: true 
    });

    // Test page transitions
    await page.click('a[href="/about"]');
    await page.waitForTimeout(2000); // Natural page transition delay
    
    // Transition state
    await page.screenshot({ 
      path: 'test-report/page-transition.png' 
    });
  });
});