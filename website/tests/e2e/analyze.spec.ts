import { test, expect } from '@playwright/test'

test.describe('Analyze image flow (end-to-end, no mocks)', () => {
  test('Upload image → pause → run analyze → wait for real result → screenshots', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/dev-analyze')
    await page.screenshot({ path: 'test-report/analyze-form.png', fullPage: true })

    // Set a small PNG file
    await page.setInputFiles('input[type="file"]', {
      name: 'tiny.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a', 'hex')
    })

    // Pause briefly after upload to capture state
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-report/analyze-selected.png', fullPage: true })

    // Start analysis
    await page.getByRole('button', { name: /analyze/i }).click()

    // Spinner/Waiting text
    await expect(page.getByText('Please wait, analyzing image…')).toBeVisible({ timeout: 10_000 })
    await page.screenshot({ path: 'test-report/analyze-waiting.png', fullPage: true })

    // Wait up to 2 minutes for real result
    await expect(page.getByText('Result')).toBeVisible({ timeout: 120_000 })
    await page.screenshot({ path: 'test-report/analyze-result.png', fullPage: true })
  })
})


