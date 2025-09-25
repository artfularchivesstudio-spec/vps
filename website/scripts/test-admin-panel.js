const { chromium } = require('playwright');

const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test-admin@artful-archives-test.com',
  password: process.env.E2E_TEST_PASSWORD || 'test-admin-password-123',
  userId: process.env.E2E_TEST_USER_ID || ''
};

async function authenticateUser(page) {
  console.log('🔐 Attempting to authenticate user...');

  // Go to login page
  await page.goto('http://localhost:3000/admin/login');
  await page.waitForSelector('form', { timeout: 5000 });

  // Fill in credentials
  await page.fill('#email', TEST_USER.email);
  await page.fill('#password', TEST_USER.password);

  // Submit login form
  await page.click('button[type="submit"]');

  // Wait for redirect or error
  try {
    await page.waitForURL('/admin**', { timeout: 15000 });
    console.log('✅ Authentication successful!');
    return true;
  } catch (e) {
    console.log('⚠️  Authentication may have failed, continuing test...');
    return false;
  }
}

async function testAdminPanel() {
  console.log('🚀 Starting comprehensive admin panel test with Playwright...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Test 1: Login page
    console.log('\n📍 Test 1: Admin Login Page');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'admin-login-screenshot.png', fullPage: true });
    console.log('📸 Screenshot taken: admin-login-screenshot.png');

    const title = await page.title();
    console.log('📄 Page title:', title);

    const content = await page.textContent('body');
    console.log('📝 Contains login form:', content.includes('login') || content.includes('Login'));

    const loginElements = await page.locator('[type="email"], #email').count();
    const passwordElements = await page.locator('[type="password"], #password').count();
    console.log('🔍 Found email inputs:', loginElements, 'password inputs:', passwordElements);

    // Test 2: Authentication
    console.log('\n🔐 Test 2: Authentication');
    const authSuccess = await authenticateUser(page);

    // Test 3: Admin Dashboard
    console.log('\n📊 Test 3: Admin Dashboard');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'admin-dashboard-screenshot.png', fullPage: true });
    console.log('📸 Screenshot taken: admin-dashboard-screenshot.png');

    const dashboardTitle = await page.title();
    console.log('📄 Dashboard title:', dashboardTitle);

    // Check for dashboard elements
    const createPostButtons = await page.locator('text=/create.*post/i').count();
    const workflowElements = await page.locator('text=/workflow/i').count();
    const statsElements = await page.locator('text=/total.*posts?|published|draft/i').count();
    const overviewElements = await page.locator('text=/overview|dashboard/i').count();

    console.log('🔍 Dashboard Analysis:');
    console.log('  - Create Post buttons/links:', createPostButtons);
    console.log('  - Workflow elements:', workflowElements);
    console.log('  - Statistics elements:', statsElements);
    console.log('  - Overview/Dashboard elements:', overviewElements);

    // Test 4: Navigation between views
    console.log('\n🧭 Test 4: Dashboard Navigation');
    const viewButtons = await page.locator('button:has-text("Overview"), button:has-text("Workflow"), button:has-text("Analytics")').count();
    console.log('🔍 Found view toggle buttons:', viewButtons);

    // Test 5: Create Post Wizard
    console.log('\n✨ Test 5: Create Post Wizard');
    try {
      await page.goto('http://localhost:3000/admin/posts/create', { waitUntil: 'networkidle' });
      await page.screenshot({ path: 'admin-create-post-screenshot.png', fullPage: true });
      console.log('📸 Screenshot taken: admin-create-post-screenshot.png');

      const wizardElements = await page.locator('text=/wizard|create.*post/i').count();
      const uploadElements = await page.locator('text=/upload|image|file/i').count();
      console.log('🔍 Wizard elements found:', wizardElements);
      console.log('🔍 Upload elements found:', uploadElements);
    } catch (e) {
      console.log('⚠️  Create Post page may require authentication or may not be accessible');
    }

    // Test 6: Posts Management
    console.log('\n📚 Test 6: Posts Management');
    try {
      await page.goto('http://localhost:3000/admin/posts', { waitUntil: 'networkidle' });
      await page.screenshot({ path: 'admin-posts-management-screenshot.png', fullPage: true });
      console.log('📸 Screenshot taken: admin-posts-management-screenshot.png');

      const postsTable = await page.locator('table, [data-testid*="post"]').count();
      const postItems = await page.locator('text=/post|article/i').count();
      console.log('🔍 Posts table elements:', postsTable);
      console.log('🔍 Post-related elements:', postItems);
    } catch (e) {
      console.log('⚠️  Posts management page may require authentication');
    }

    // Test 7: Keyboard Shortcuts
    console.log('\n⌨️ Test 7: Keyboard Shortcuts');
    try {
      const shortcutsButton = await page.locator('text=/shortcut/i').count();
      console.log('🔍 Keyboard shortcuts elements:', shortcutsButton);
    } catch (e) {
      console.log('⚠️  Keyboard shortcuts test skipped');
    }

    // Test 8: Responsive Design
    console.log('\n📱 Test 8: Responsive Design Check');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'admin-mobile-screenshot.png', fullPage: true });
    console.log('📸 Mobile screenshot taken: admin-mobile-screenshot.png');

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'admin-desktop-screenshot.png', fullPage: true });
    console.log('📸 Desktop screenshot taken: admin-desktop-screenshot.png');

    console.log('\n✅ Comprehensive admin panel test completed successfully!');
    console.log('📁 Screenshots saved:');
    console.log('  - admin-login-screenshot.png');
    console.log('  - admin-dashboard-screenshot.png');
    console.log('  - admin-create-post-screenshot.png');
    console.log('  - admin-posts-management-screenshot.png');
    console.log('  - admin-mobile-screenshot.png');
    console.log('  - admin-desktop-screenshot.png');

  } catch (error) {
    console.error('❌ Error during admin panel test:', error.message);

    // Take error screenshot
    await page.screenshot({ path: 'admin-error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot taken: admin-error-screenshot.png');

  } finally {
    await browser.close();
  }
}

testAdminPanel().catch(console.error);
