import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'], 
    ['html', { outputFolder: 'test-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3001',
    headless: false, // Keep headed for screenshot tests
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'desktop-screenshots',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          slowMo: 500, // Natural user timing for realistic experience
        }
      },
      testMatch: '**/admin-interface-screenshots.spec.ts'
    },
    {
      name: 'blog-frontend-screenshots', 
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          slowMo: 500, // Natural user timing
        }
      },
      testMatch: '**/blog-frontend-screenshots.spec.ts'
    },
    {
      name: 'strapi-integration-screenshots',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          slowMo: 500, // Natural user timing
        }
      },
      testMatch: '**/strapi-integration-screenshots.spec.ts'
    },
    {
      name: 'wizard-visual-regression',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          slowMo: 750, // Natural timing for wizard flow
        }
      },
      testMatch: '**/wizard-visual-regression.spec.ts'
    },
    {
      name: 'homepage-navigation-screenshots',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          slowMo: 500, // Natural user timing
        }
      },
      testMatch: '**/homepage-and-navigation-screenshots.spec.ts'
    },
    {
      name: 'template-system-screenshots',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          slowMo: 500, // Natural user timing
        }
      },
      testMatch: '**/template-system-screenshots.spec.ts'
    },
    {
      name: 'admin-flow-e2e',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          slowMo: 750, // Slower for admin workflow documentation
        }
      },
      testMatch: '**/admin-post-creation-flow.spec.ts'
    },
    {
      name: 'mobile-screenshots',
      use: { 
        ...devices['iPhone 15'],
        viewport: { width: 393, height: 852 }, // iPhone 15 dimensions
        launchOptions: {
          slowMo: 600, // Natural mobile user timing
        }
      },
      testMatch: '**/*screenshots.spec.ts'
    },
    {
      name: 'functional-tests',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true, // Functional tests can be headless
      },
      testMatch: '**/wizard-functional.spec.ts'
    },
  ],
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  outputDir: 'test-results',
})


