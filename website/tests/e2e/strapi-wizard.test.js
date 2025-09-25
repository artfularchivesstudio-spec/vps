const { test, expect } = require('@playwright/test');

test.describe('Strapi Admin Wizard', () => {
  test('should complete the 3-step post creation workflow', async ({ page }) => {
    // Navigate to create post page
    await page.goto('/admin/create-post');
    
    // Step 1: Upload image
    await page.locator('input[type="file"]').setInputFiles('tests/e2e/fixtures/test-image.jpg');
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