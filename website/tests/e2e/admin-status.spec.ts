import { test, expect } from '@playwright/test'

test.describe('Admin Audio Job Status Page', () => {
  test('Paste ID, check once, start polling, screenshots', async ({ page }) => {
    // Mock auth redirect by stubbing /admin/login for this test or set cookie? We'll route status directly.
    await page.route('**/api/audio-job-status/job_e2e_1', async (route) => {
      // First hit: processing
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'processing', updated_at: new Date().toISOString(), progress: 50, language_statuses: { en: { status: 'processing' } } }) })
    })
    await page.route('**/api/audio-job-status/job_e2e_2', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'complete', audio_url: 'https://example.com/audio.mp3', updated_at: new Date().toISOString() }) })
    })

    await page.goto('/admin/audio-jobs/status', { waitUntil: 'networkidle' })
    // Set bypass header for protected admin routes
    await page.setExtraHTTPHeaders({ 'x-e2e-bypass': process.env.E2E_BYPASS_TOKEN || 'test-bypass' })
    await page.reload()
    await page.screenshot({ path: 'test-report/admin-status-empty.png', fullPage: true })

    // Paste job ID and check once
    await page.getByPlaceholder('Enter job ID...').fill('job_e2e_1')
    await page.getByRole('button', { name: /check status/i }).click()
    await expect(page.getByText(/processing/i)).toBeVisible()
    await page.screenshot({ path: 'test-report/admin-status-processing.png', fullPage: true })

    // Switch to a completed job and check
    await page.getByPlaceholder('Enter job ID...').fill('job_e2e_2')
    await page.getByRole('button', { name: /check status/i }).click()
    await expect(page.getByText(/complete/i)).toBeVisible()
    await page.screenshot({ path: 'test-report/admin-status-complete.png', fullPage: true })

    // Start polling (won't loop here due to mocks) just to capture UI state
    await page.getByRole('button', { name: /start polling/i }).click()
    await page.screenshot({ path: 'test-report/admin-status-polling.png', fullPage: true })
  })
})


