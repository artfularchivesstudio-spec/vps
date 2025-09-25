/**
 * @file Playwright E2E tests for audio job workflow
 * Tests complete user journey from job creation to completion monitoring
 * Includes streaming status updates and error handling scenarios
 */

import { test, expect } from '@playwright/test';

test.describe('Audio Job Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the audio tools page
    await page.goto('/admin/tools');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should create audio job and monitor progress via streaming', async ({ page }) => {
    // Mock the streaming endpoint
    await page.route('**/functions/v1/audio-job-streaming**', async route => {
      const url = new URL(route.request().url());
      const jobId = url.searchParams.get('jobId');

      if (route.request().headers()['accept'] === 'text/event-stream') {
        // Simulate SSE stream
        const streamData = [
          'data: {"type":"connection_established","message":"🔗 Streaming connection established"}\n\n',
          'data: {"status":"processing","message":"🔄 Processing EN... 25%","progress":25}\n\n',
          'data: {"status":"processing","message":"🌍 Translating to ES...","progress":50}\n\n',
          'data: {"status":"processing","message":"🎤 Generating audio for ES...","progress":75}\n\n',
          'data: {"status":"complete","message":"✅ Job completed successfully!","progress":100,"final":true}\n\n'
        ];

        // Send streaming data with delays to simulate real-time updates
        let dataIndex = 0;
        const sendData = () => {
          if (dataIndex < streamData.length) {
            route.fulfill({
              status: 200,
              contentType: 'text/event-stream',
              body: streamData[dataIndex],
              headers: {
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              }
            });
            dataIndex++;
            setTimeout(sendData, 1000); // Send next update after 1 second
          }
        };

        sendData();
      } else {
        // Handle regular HTTP request
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            job_id: jobId,
            status: 'processing',
            progress: 25,
            message: '🔄 Processing EN... 25%'
          })
        });
      }
    });

    // Click on create audio job button
    await page.getByRole('button', { name: /create audio job/i }).click();

    // Fill in the job creation form
    await page.getByLabel('Content Text').fill('This is a test blog post about art and creativity.');

    // Select languages
    await page.getByLabel('English').check();
    await page.getByLabel('Spanish').check();

    // Set voice preferences
    await page.getByLabel('English Voice').selectOption('alloy');
    await page.getByLabel('Spanish Voice').selectOption('nova');

    // Enable streaming monitoring
    await page.getByLabel('Enable Real-time Monitoring').check();

    // Submit the job
    await page.getByRole('button', { name: /create job/i }).click();

    // Wait for job creation confirmation
    await expect(page.getByText('Audio job created successfully!')).toBeVisible();

    // Verify streaming status updates appear
    await expect(page.getByText('🔗 Streaming connection established')).toBeVisible();

    // Wait for progress updates
    await expect(page.getByText('🔄 Processing EN... 25%')).toBeVisible();
    await expect(page.getByText('🌍 Translating to ES...')).toBeVisible();
    await expect(page.getByText('🎤 Generating audio for ES...')).toBeVisible();

    // Verify final completion
    await expect(page.getByText('✅ Job completed successfully!')).toBeVisible();

    // Check that audio URLs are displayed
    await expect(page.getByText(/audio.*\.mp3/)).toBeVisible();
  });

  test('should handle job creation errors gracefully', async ({ page }) => {
    // Mock API error for job creation
    await page.route('**/functions/v1/audio-job-submit**', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to create audio job',
          details: 'Database connection error'
        })
      })
    );

    // Attempt to create job
    await page.getByRole('button', { name: /create audio job/i }).click();
    await page.getByLabel('Content Text').fill('Test content');
    await page.getByRole('button', { name: /create job/i }).click();

    // Verify error handling
    await expect(page.getByText('Failed to create audio job')).toBeVisible();
    await expect(page.getByText('Database connection error')).toBeVisible();

    // Verify user can retry
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('should display subtitle integrity information', async ({ page }) => {
    // Mock successful job with subtitle data
    await page.route('**/functions/v1/audio-job-status/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          job_id: 'test-job-123',
          status: 'complete',
          subtitle_urls: {
            en: {
              srt: 'https://example.com/subtitles/en.srt',
              vtt: 'https://example.com/subtitles/en.vtt'
            },
            es: {
              srt: 'https://example.com/subtitles/es.srt',
              vtt: 'https://example.com/subtitles/es.vtt'
            }
          },
          integrity_hashes: {
            en: {
              srt_hash: 'abc123...',
              vtt_hash: 'def456...'
            }
          }
        })
      })
    );

    // Navigate to job status page
    await page.goto('/admin/tools/audio-status/test-job-123');

    // Verify subtitle links are present
    await expect(page.getByRole('link', { name: 'Download SRT (EN)' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download VTT (EN)' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download SRT (ES)' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download VTT (ES)' })).toBeVisible();

    // Verify integrity information is displayed
    await expect(page.getByText('SHA-256: abc123...')).toBeVisible();
    await expect(page.getByText('SHA-256: def456...')).toBeVisible();
  });

  test('should handle streaming connection failures', async ({ page }) => {
    // Mock streaming endpoint failure
    await page.route('**/functions/v1/audio-job-streaming**', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Streaming service unavailable'
        })
      })
    );

    // Attempt to monitor job with streaming
    await page.goto('/admin/tools/audio-status/test-job-123');
    await page.getByRole('button', { name: /enable streaming/i }).click();

    // Verify fallback to polling
    await expect(page.getByText('Streaming unavailable, falling back to polling')).toBeVisible();

    // Verify polling still works
    await expect(page.getByText(/status:/i)).toBeVisible();
  });

  test('should support callback URL configuration', async ({ page }) => {
    // Fill job creation form with callback URL
    await page.getByRole('button', { name: /create audio job/i }).click();
    await page.getByLabel('Content Text').fill('Test content for callback');

    // Configure callback URL
    await page.getByLabel('Callback URL').fill('https://example.com/webhook/audio-complete');

    // Mock the callback being sent
    let callbackReceived = false;
    await page.route('https://example.com/webhook/audio-complete', route => {
      callbackReceived = true;
      route.fulfill({ status: 200 });
    });

    // Submit job
    await page.getByRole('button', { name: /create job/i }).click();

    // Mock job completion to trigger callback
    await page.route('**/functions/v1/audio-job-worker-chunked**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Job completed successfully',
          job: { status: 'complete' }
        })
      })
    );

    // Wait for callback to be sent
    await page.waitForTimeout(2000);
    expect(callbackReceived).toBe(true);
  });

  test('should display progress bars and visual indicators', async ({ page }) => {
    // Create job and monitor progress
    await page.getByRole('button', { name: /create audio job/i }).click();
    await page.getByLabel('Content Text').fill('Test content for progress tracking');
    await page.getByRole('button', { name: /create job/i }).click();

    // Verify progress bar appears
    await expect(page.locator('.progress-bar')).toBeVisible();

    // Verify progress percentage updates
    await expect(page.getByText('25%')).toBeVisible();
    await expect(page.getByText('50%')).toBeVisible();
    await expect(page.getByText('75%')).toBeVisible();
    await expect(page.getByText('100%')).toBeVisible();

    // Verify emoji status indicators
    await expect(page.getByText('🔄')).toBeVisible(); // Processing
    await expect(page.getByText('🌍')).toBeVisible(); // Translating
    await expect(page.getByText('🎤')).toBeVisible(); // Audio generation
    await expect(page.getByText('✅')).toBeVisible(); // Complete
  });

  test('should handle multilingual audio generation', async ({ page }) => {
    // Create job with multiple languages
    await page.getByRole('button', { name: /create audio job/i }).click();
    await page.getByLabel('Content Text').fill('This is a multilingual test post.');

    // Select all available languages
    await page.getByLabel('English').check();
    await page.getByLabel('Spanish').check();
    await page.getByLabel('Hindi').check();

    // Configure different voices for each language
    await page.getByLabel('English Voice').selectOption('alloy');
    await page.getByLabel('Spanish Voice').selectOption('nova');
    await page.getByLabel('Hindi Voice').selectOption('fable');

    await page.getByRole('button', { name: /create job/i }).click();

    // Verify language-specific progress tracking
    await expect(page.getByText('EN: 🔄 Processing')).toBeVisible();
    await expect(page.getByText('ES: 🌍 Translating')).toBeVisible();
    await expect(page.getByText('HI: 🎤 Generating audio')).toBeVisible();

    // Verify all language audio files are generated
    await expect(page.getByText(/audio.*en.*\.mp3/)).toBeVisible();
    await expect(page.getByText(/audio.*es.*\.mp3/)).toBeVisible();
    await expect(page.getByText(/audio.*hi.*\.mp3/)).toBeVisible();
  });

  test('should validate input data', async ({ page }) => {
    // Try to create job without content
    await page.getByRole('button', { name: /create audio job/i }).click();
    await page.getByRole('button', { name: /create job/i }).click();

    // Verify validation error
    await expect(page.getByText('Content text is required')).toBeVisible();

    // Try with empty content
    await page.getByLabel('Content Text').fill('   ');
    await page.getByRole('button', { name: /create job/i }).click();

    // Verify validation still triggers
    await expect(page.getByText('Content text cannot be empty')).toBeVisible();

    // Try without selecting any languages
    await page.getByLabel('Content Text').fill('Valid content');
    await page.getByLabel('English').uncheck();
    await page.getByLabel('Spanish').uncheck();
    await page.getByLabel('Hindi').uncheck();
    await page.getByRole('button', { name: /create job/i }).click();

    // Verify language selection validation
    await expect(page.getByText('At least one language must be selected')).toBeVisible();
  });

  test('should handle browser refresh during job processing', async ({ page, context }) => {
    // Create job
    await page.getByRole('button', { name: /create audio job/i }).click();
    await page.getByLabel('Content Text').fill('Test content for refresh');
    await page.getByRole('button', { name: /create job/i }).click();

    // Get job ID from URL or response
    const url = page.url();
    const jobIdMatch = url.match(/job\/([^/?]+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : 'test-job-123';

    // Simulate page refresh
    await page.reload();

    // Navigate back to job status
    await page.goto(`/admin/tools/audio-status/${jobId}`);

    // Verify job status is still accessible
    await expect(page.getByText(/job.*status/i)).toBeVisible();

    // Verify streaming reconnects
    await expect(page.getByText('🔗 Streaming connection established')).toBeVisible();
  });
});
