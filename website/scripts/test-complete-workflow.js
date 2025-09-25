/**
 * Complete Translation Workflow Test
 * Tests the entire translation process from UI to completion
 */

const puppeteer = require('puppeteer');

async function testCompleteWorkflow() {
  console.log('🚀 Starting Complete Translation Workflow Test...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set up console logging
    page.on('console', msg => {
      if (msg.text().includes('🌐') || msg.text().includes('🏆') || msg.text().includes('✅') || msg.text().includes('❌')) {
        console.log('Browser:', msg.text());
      }
    });

    console.log('📱 Navigating to admin panel...');
    await page.goto('http://localhost:3000/admin/posts/create', {
      waitUntil: 'networkidle2'
    });

    // Wait for the page to load
    await page.waitForSelector('h1', { timeout: 10000 });

    console.log('✅ Admin panel loaded');

    // Fill in the post data
    console.log('📝 Filling in post data...');

    // Wait for form fields and fill them
    await page.waitForSelector('input[name="title"], textarea[name="title"]', { timeout: 5000 });
    await page.type('input[name="title"], textarea[name="title"]', 'Test Post for Translation');

    // Fill content
    const contentSelector = 'textarea[name="content"], [data-testid="content-editor"]';
    await page.waitForSelector(contentSelector, { timeout: 5000 });
    await page.type(contentSelector, 'This is a test content that should be translated to Spanish and Hindi.');

    // Fill excerpt
    const excerptSelector = 'textarea[name="excerpt"], input[name="excerpt"]';
    await page.waitForSelector(excerptSelector, { timeout: 5000 });
    await page.type(excerptSelector, 'A test excerpt for translation.');

    console.log('✅ Form data filled');

    // Navigate to translation step
    console.log('🎯 Navigating to translation step...');

    // Look for next button and click it
    const nextButton = await page.$('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]');
    if (nextButton) {
      await nextButton.click();
      console.log('✅ Clicked next button');
    } else {
      // Try to find by other selectors
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(btn => btn.textContent, button);
        if (text && (text.includes('Continue') || text.includes('Next') || text.includes('Submit'))) {
          await button.click();
          console.log('✅ Found and clicked button:', text);
          break;
        }
      }
    }

    // Wait for translation step
    await page.waitForTimeout(2000);

    // Check if we're on the translation step
    const translationHeader = await page.$('h2:has-text("Multilingual Translations")');
    if (translationHeader) {
      console.log('✅ Reached translation step');

      // Wait for auto-translation to start
      console.log('⏳ Waiting for translation to complete...');

      // Wait for translation to complete (look for success message or completion state)
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent.includes('Continue to Audio') || btn.textContent.includes('Complete'));
      }, { timeout: 60000 });

      console.log('🎉 Translation completed successfully!');

      // Check for any error messages
      const errorElements = await page.$$('[class*="error"], [class*="Error"]');
      if (errorElements.length > 0) {
        console.log('⚠️ Found some error elements, checking details...');
        for (const error of errorElements) {
          const text = await page.evaluate(el => el.textContent, error);
          console.log('Error text:', text);
        }
      }

      // Check for success indicators
      const successElements = await page.$$('[class*="success"], [class*="Success"]');
      if (successElements.length > 0) {
        console.log('✅ Found success indicators');
      }

      return true;
    } else {
      console.log('❌ Did not reach translation step');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testCompleteWorkflow().then(success => {
  console.log('\n📊 Test Result:', success ? '✅ SUCCESS' : '❌ FAILED');
  process.exit(success ? 0 : 1);
}).catch(console.error);
