#!/usr/bin/env node

// 🎭 Admin Flow Test Runner - Orchestrating E2E Screenshot Testing! ✨
// A comprehensive script to run admin workflow tests and generate visual reports

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 🎪 Configuration
const CONFIG = {
  screenshotDir: 'test-results/screenshots',
  reportDir: 'test-report',
  testProject: 'admin-flow-e2e',
  devServerPort: 3000,
  devServerTimeout: 30000
};

// 🎨 Utility Functions
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const icons = {
    info: '🎭',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    progress: '🎪'
  };
  console.log(`${icons[type]} [${timestamp}] ${message}`);
}

function ensureDirectories() {
  const dirs = [CONFIG.screenshotDir, CONFIG.reportDir, 'test-results'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`, 'progress');
    }
  });
}

function checkDependencies() {
  log('Checking dependencies...', 'progress');
  
  try {
    // Check if Playwright is installed
    execSync('npx playwright --version', { stdio: 'pipe' });
    log('Playwright is installed', 'success');
  } catch (error) {
    log('Playwright not found. Installing...', 'warning');
    try {
      execSync('npm run playwright:install', { stdio: 'inherit' });
      log('Playwright installed successfully', 'success');
    } catch (installError) {
      log('Failed to install Playwright', 'error');
      process.exit(1);
    }
  }
}

function isDevServerRunning() {
  try {
    const { execSync } = require('child_process');
    execSync(`curl -s http://localhost:${CONFIG.devServerPort} > /dev/null`, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

function startDevServer() {
  return new Promise((resolve, reject) => {
    log('Starting development server...', 'progress');
    
    const devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      detached: false
    });
    
    let serverReady = false;
    const timeout = setTimeout(() => {
      if (!serverReady) {
        devServer.kill();
        reject(new Error('Dev server startup timeout'));
      }
    }, CONFIG.devServerTimeout);
    
    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
        clearTimeout(timeout);
        serverReady = true;
        log('Development server is ready', 'success');
        resolve(devServer);
      }
    });
    
    devServer.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Error') || error.includes('EADDRINUSE')) {
        clearTimeout(timeout);
        reject(new Error(`Dev server error: ${error}`));
      }
    });
    
    devServer.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function runTests() {
  return new Promise((resolve, reject) => {
    log('Running admin flow E2E tests...', 'progress');
    
    const testCommand = `npx playwright test --project=${CONFIG.testProject} --reporter=html`;
    
    try {
      execSync(testCommand, { 
        stdio: 'inherit',
        timeout: 120000 // 2 minutes timeout
      });
      log('Tests completed successfully', 'success');
      resolve();
    } catch (error) {
      if (error.status === 1) {
        log('Some tests failed, but screenshots were captured', 'warning');
        resolve(); // Continue to generate report even if tests failed
      } else {
        log(`Test execution failed: ${error.message}`, 'error');
        reject(error);
      }
    }
  });
}

function generateScreenshotReport() {
  log('Generating screenshot report...', 'progress');
  
  const screenshotFiles = fs.readdirSync(CONFIG.screenshotDir)
    .filter(file => file.endsWith('.png'))
    .sort();
  
  if (screenshotFiles.length === 0) {
    log('No screenshots found', 'warning');
    return;
  }
  
  const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎭 Admin Flow E2E Test Screenshots</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            color: #4a5568;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }
        .screenshot-item {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .screenshot-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(0,0,0,0.15);
        }
        .screenshot-item img {
            width: 100%;
            height: auto;
            display: block;
        }
        .screenshot-title {
            padding: 15px;
            background: #f7fafc;
            font-weight: 600;
            color: #2d3748;
            border-top: 1px solid #e2e8f0;
        }
        .stats {
            background: #f0fff4;
            border: 1px solid #9ae6b4;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .timestamp {
            color: #718096;
            font-size: 0.9em;
            text-align: center;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎭 Admin Flow E2E Test Screenshots</h1>
        
        <div class="stats">
            <strong>📊 Test Results:</strong> ${screenshotFiles.length} screenshots captured<br>
            <strong>🕒 Generated:</strong> ${new Date().toLocaleString()}
        </div>
        
        <div class="screenshot-grid">
            ${screenshotFiles.map(file => {
              const title = file.replace('.png', '').replace(/admin-flow-/, '').replace(/-/g, ' ');
              return `
                <div class="screenshot-item">
                    <img src="../screenshots/${file}" alt="${title}" loading="lazy">
                    <div class="screenshot-title">
                        📸 ${title.charAt(0).toUpperCase() + title.slice(1)}
                    </div>
                </div>
              `;
            }).join('')}
        </div>
        
        <div class="timestamp">
            Generated by the Artful Archives E2E Testing Suite 🎪
        </div>
    </div>
</body>
</html>
  `;
  
  const reportPath = path.join(CONFIG.reportDir, 'admin-flow-screenshots.html');
  fs.writeFileSync(reportPath, reportHtml);
  
  log(`Screenshot report generated: ${reportPath}`, 'success');
  log(`Found ${screenshotFiles.length} screenshots`, 'info');
}

// 🎪 Main Execution
async function main() {
  try {
    log('🎭 Starting Admin Flow E2E Test Suite', 'info');
    log('=' .repeat(50), 'info');
    
    // Setup
    ensureDirectories();
    checkDependencies();
    
    // Check if dev server is running
    let devServer = null;
    if (!isDevServerRunning()) {
      devServer = await startDevServer();
      // Give the server a moment to fully initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      log('Development server is already running', 'success');
    }
    
    // Run tests
    await runTests();
    
    // Generate report
    generateScreenshotReport();
    
    // Cleanup
    if (devServer) {
      log('Stopping development server...', 'progress');
      devServer.kill();
    }
    
    log('🎉 Admin Flow E2E Testing completed successfully!', 'success');
    log('📊 Check the following for results:', 'info');
    log(`   - Screenshots: ${CONFIG.screenshotDir}/`, 'info');
    log(`   - HTML Report: ${CONFIG.reportDir}/admin-flow-screenshots.html`, 'info');
    log(`   - Playwright Report: ${CONFIG.reportDir}/index.html`, 'info');
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Test runner interrupted', 'warning');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Test runner terminated', 'warning');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, runTests, generateScreenshotReport };