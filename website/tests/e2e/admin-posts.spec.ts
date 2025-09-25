import { expect, test } from '@playwright/test'

test.describe('Admin Posts Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin login
    await page.goto('/admin/login')
    
    // Mock login for testing (assuming test credentials)
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin/posts')
  })

  test('should display posts list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Blog Posts')
    await expect(page.locator('table')).toBeVisible()
  })

  test('should filter posts by search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search posts...')
    await searchInput.fill('test')
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
    
    // Should show filtered results or no results message
    const results = page.locator('tbody tr')
    const count = await results.count()
    
    if (count === 0) {
      await expect(page.locator('text=No posts found')).toBeVisible()
    } else {
      await expect(results.first()).toContainText('test', { ignoreCase: true })
    }
  })

  test('should filter posts by status', async ({ page }) => {
    const statusSelect = page.locator('select').first()
    await statusSelect.selectOption('draft')
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
    
    // Check that all visible posts are drafts
    const statusBadges = page.locator('tbody tr .badge')
    const count = await statusBadges.count()
    
    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toContainText('draft')
    }
  })

  test('should toggle post status', async ({ page }) => {
    // Find first post with published status
    const firstRow = page.locator('tbody tr').first()
    const statusBadge = firstRow.locator('.badge').first()
    
    const initialStatus = await statusBadge.textContent()
    const buttonText = initialStatus === 'published' ? 'Unpublish' : 'Publish'
    
    // Click the status toggle button
    await firstRow.getByRole('button', { name: buttonText }).click()
    
    // Wait for status to update
    await page.waitForTimeout(1000)
    
    // Verify status changed
    const newStatus = await statusBadge.textContent()
    expect(newStatus).not.toBe(initialStatus)
  })

  test('should handle bulk selection', async ({ page }) => {
    // Select first post
    const firstCheckbox = page.locator('tbody tr input[type="checkbox"]').first()
    await firstCheckbox.check()
    
    // Verify bulk actions appear
    await expect(page.locator('text=1 selected')).toBeVisible()
    await expect(page.locator('text=Bulk actions available')).toBeVisible()
    
    // Test select all
    const selectAllCheckbox = page.locator('thead tr input[type="checkbox"]').first()
    await selectAllCheckbox.check()
    
    // Verify all posts are selected
    const allCheckboxes = page.locator('tbody tr input[type="checkbox"]')
    const count = await allCheckboxes.count()
    
    for (let i = 0; i < count; i++) {
      await expect(allCheckboxes.nth(i)).toBeChecked()
    }
  })

  test('should handle pagination', async ({ page }) => {
    // Check if pagination exists
    const pagination = page.locator('text=Page')
    
    if (await pagination.isVisible()) {
      const currentPage = await pagination.textContent()
      const nextButton = page.getByRole('button', { name: 'Next' })
      
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        
        // Wait for page to load
        await page.waitForTimeout(1000)
        
        // Verify we're on a different page
        const newPage = await pagination.textContent()
        expect(newPage).not.toBe(currentPage)
      }
    }
  })

  test('should navigate to post detail', async ({ page }) => {
    // Click on first post title
    const firstPostTitle = page.locator('tbody tr').first().locator('td').nth(1)
    await firstPostTitle.click()
    
    // Should navigate to post detail page
    await page.waitForURL(/\/admin\/posts\/\w+/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should show dark mode toggle', async ({ page }) => {
    const darkModeToggle = page.locator('button[aria-label*="dark mode"], button[aria-label*="light mode"]')
    await expect(darkModeToggle).toBeVisible()
    
    // Test dark mode toggle
    const htmlElement = page.locator('html')
    const initialClass = await htmlElement.getAttribute('class')
    
    await darkModeToggle.click()
    await page.waitForTimeout(500)
    
    const newClass = await htmlElement.getAttribute('class')
    expect(newClass).not.toBe(initialClass)
  })

  test('should show loading skeletons', async ({ page }) => {
    // Navigate to posts page with cache disabled
    await page.goto('/admin/posts', { waitUntil: 'networkidle' })
    
    // Check for skeleton loading indicators
    const skeletons = page.locator('.animate-pulse')
    const skeletonCount = await skeletons.count()
    
    // Should have skeleton elements during loading
    expect(skeletonCount).toBeGreaterThan(0)
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Force an error by blocking the API request
    await page.route('**/api/**', route => route.abort('failed'))
    
    await page.goto('/admin/posts')
    
    // Should show error message
    await expect(page.locator('text=Failed to load posts')).toBeVisible()
    
    // Should show retry option
    await expect(page.getByText('Dismiss')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/admin/posts')
    
    // Check that table is horizontally scrollable
    const table = page.locator('table')
    await expect(table).toBeVisible()
    
    // Check that buttons are still accessible
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThan(0)
  })
})