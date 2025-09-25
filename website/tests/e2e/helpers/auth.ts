import { Page } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  userId: string
}

export const TEST_USER: TestUser = {
  email: process.env.E2E_TEST_EMAIL || 'test-admin@artful-archives-test.com',
  password: process.env.E2E_TEST_PASSWORD || 'test-admin-password-123',
  userId: process.env.E2E_TEST_USER_ID || ''
}

/**
 * Authenticate user in E2E tests using real Supabase authentication
 * This is more reliable than bypass mechanisms
 */
export async function authenticateUser(page: Page): Promise<void> {
  // Go to login page
  await page.goto('/admin/login')
  
  // Wait for login form to load
  await page.waitForSelector('form', { timeout: 5000 })
  
  // Fill in credentials using id selectors
  await page.fill('#email', TEST_USER.email)
  await page.fill('#password', TEST_USER.password)
  
  // Submit login form
  await page.click('button[type="submit"]')
  
  // Wait for redirect to admin dashboard
  await page.waitForURL('/admin**', { timeout: 15000 })
  
  // Verify we're logged in by checking for admin header
  await page.waitForSelector('text=Artful Archives Admin', { timeout: 10000 })
}

/**
 * Alternative authentication for API routes
 * Sets up proper auth headers for API testing
 */
export async function setupApiAuth(page: Page): Promise<{ authToken: string }> {
  // First authenticate normally
  await authenticateUser(page)
  
  // Extract auth token from browser storage
  const authToken = await page.evaluate(() => {
    const authData = localStorage.getItem('supabase.auth.token')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed.access_token
    }
    return null
  })
  
  if (!authToken) {
    throw new Error('Failed to extract auth token after login')
  }
  
  return { authToken }
}

/**
 * Clean logout for test cleanup
 */
export async function logoutUser(page: Page): Promise<void> {
  try {
    // Try to logout via UI if possible
    await page.goto('/admin')
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")')
    if (await logoutButton.count() > 0) {
      await logoutButton.click()
    }
    
    // Clear browser storage
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Navigate to public page to confirm logout
    await page.goto('/')
  } catch (e) {
    console.log('Logout cleanup failed:', e)
  }
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto('/admin')
    // If we're redirected to login, we're not authenticated
    await page.waitForTimeout(2000)
    const currentUrl = page.url()
    return !currentUrl.includes('/admin/login')
  } catch {
    return false
  }
}