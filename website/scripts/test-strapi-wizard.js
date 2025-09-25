const { test, expect } = require('@playwright/test');

test.describe('Strapi Admin Wizard', () => {
  test('should complete the 3-step post creation workflow', async ({ page }) => {
    // Navigate to create post page
    await page.goto('/admin/create-post');
    
    // Step 1: Upload image
    await page.locator('input[type="file"]').setInputFiles('path/to/test-image.jpg');
    await expect(page.locator('img')).toBeVisible();
    
    // Click Next to AI Magic
    await page.click('button:has-text("Next: AI Magic")');
    await expect(page.locator('h2:has-text("AI Magic")')).toBeVisible();
    
    // Step 2: Select language and generate
    await page.selectOption('select', 'en');
    await page.click('button:has-text("Generate Content")');
    await expect(page.locator('button:has-text("Next: Publish")')).toBeEnabled();
    
    // Step 3: Review and publish
    await page.click('button:has-text("Next: Publish")');
    await expect(page.locator('h2:has-text("Review & Publish")')).toBeVisible();
    
    // Fill in title and slug if needed
    await page.fill('input[placeholder="Enter post title..."]', 'Test Post Title');
    await page.fill('input[placeholder="post-slug-url"]', 'test-post-slug');
    
    // Publish
    await page.click('button:has-text("Publish Post")');
    
    // Verify success (redirect to posts list)
    await expect(page).toHaveURL(/\/admin\/posts/);
  });
});

test.describe('Strapi AI Integration', () => {
  test('should generate content from image upload', async ({ page }) => {
    await page.goto('/admin/create-post');
    
    // Upload image
    await page.locator('input[type="file"]').setInputFiles('path/to/artwork.jpg');
    
    // Proceed to AI Magic step
    await page.click('button:has-text("Next: AI Magic")');
    
    // Select language
    await page.selectOption('select', 'en');
    
    // Generate content
    await page.click('button:has-text("Generate Content")');
    
    // Wait for generation to complete
    await expect(page.locator('textarea')).toHaveValue(expect.stringContaining('Spellbinding'));
    
    // Verify content is populated
    const content = await page.locator('textarea').inputValue();
    expect(content.length).toBeGreaterThan(500);
    expect(content).toMatch(/mystical|enchant|portal/i);
  });
});

test.describe('Strapi Publishing', () => {
  test('should publish post successfully', async ({ page }) => {
    await page.goto('/admin/create-post');
    
    // Complete steps 1-2 (upload and generate)
    await page.locator('input[type="file"]').setInputFiles('path/to/test-image.jpg');
    await page.click('button:has-text("Next: AI Magic")');
    await page.selectOption('select', 'en');
    await page.click('button:has-text("Generate Content")');
    await page.waitForTimeout(5000); // Wait for AI generation
    
    // Proceed to publish
    await page.click('button:has-text("Next: Publish")');
    
    // Fill form
    await page.fill('input[placeholder="Enter post title..."]', 'Published Test Post');
    await page.fill('input[placeholder="post-slug-url"]', 'published-test-post');
    
    // Publish
    await page.click('button:has-text("Publish Post")');
    
    // Verify success
    await expect(page).toHaveURL(/\/admin\/posts/);
    await expect(page.locator('text=Published Test Post')).toBeVisible();
  });
});