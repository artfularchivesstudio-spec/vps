import { test, expect } from '@playwright/test'

const voices = {
  voices: [
    { id: 'nova', label: 'Nova', gender: 'female', tags: ['default'], languages: ['en','es','hi'] },
    { id: 'sage', label: 'Sage', gender: 'male', tags: ['calm'], languages: ['en','es','hi'] },
    { id: 'aria', label: 'Aria', gender: 'female', tags: ['warm'], languages: ['en'] },
    { id: 'fable', label: 'Fable', gender: 'male', tags: ['storyteller'], languages: ['en'] },
  ]
}

const sampleAudio = Buffer.from(
  'SUQzAwAAAAAAFlRFTkMAAAAwAAACAAACAAABAAABAAABAExBTUUyLjM2LjEwMAAAAAAAAAAAAAAA',
  'base64'
)

test.describe('Wizard Audio Voices - screenshots', () => {
  test('Filter, search, sample, select', async ({ page }) => {
    await page.route('**/api/ai/voices', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(voices) })
    })
    await page.route('**/api/ai/sample-voice**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'audio/mpeg' }, body: sampleAudio })
    })
    await page.route('**/rest/v1/rpc/get_or_create_admin_profile', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ ok: true }]) })
    })
    await page.route('**/rest/v1/blog_posts', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([{ id: 'post_123' }]) })
        return
      }
      await route.continue()
    })
    await page.route('**/storage/v1/object/**', async (route) => {
      await route.fulfill({ status: 200, body: '' })
    })

    await page.goto('/dev-wizard?e2e=1')

    // Upload a small file to proceed
    await page.setInputFiles('input[type="file"]', {
      name: 'tiny.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a', 'hex')
    })
    await page.getByRole('button', { name: /continue/i }).click()

    // Fill title/content and continue to audio
    await page.fill('input[placeholder="Enter post title..."]', 'Screenshot Voices')
    await page.fill('textarea[placeholder="AI-generated content will appear here. You can edit it directly."]', 'Content.')
    await page.getByRole('button', { name: /continue to audio/i }).click()

    // Voices visible
    await page.getByText('OpenAI Voices', { exact: false }).waitFor()
    await page.screenshot({ path: 'test-report/voices-list.png', fullPage: true })

    // Filter female
    await page.selectOption('select', { label: 'Female' })
    await page.screenshot({ path: 'test-report/voices-female.png', fullPage: true })

    // Search for Nova
    await page.fill('input[placeholder="Search voices..."]', 'nova')
    await page.screenshot({ path: 'test-report/voices-search-nova.png', fullPage: true })

    // Clear search
    await page.fill('input[placeholder="Search voices..."]', '')

    // Sample first
    await page.getByRole('button', { name: 'Sample' }).first().click()
    await page.waitForTimeout(200)

    // Select first
    await page.getByRole('button', { name: 'Select' }).first().click()
    await page.screenshot({ path: 'test-report/voices-selected.png', fullPage: true })
  })
})


