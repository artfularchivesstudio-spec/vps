#!/bin/bash

# Run Screenshot Tests Script for Artful Archives
echo "🎨 Starting Visual Regression Tests..."

# Clean previous test results
echo "🧹 Cleaning previous test results..."
rm -rf test-results/
rm -rf test-report/
mkdir -p test-report/screenshots/

# Start the development server if not running
echo "🚀 Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 10

# Function to wait for server
wait_for_server() {
    local url="http://localhost:3001"
    local timeout=60
    local count=0
    
    while [ $count -lt $timeout ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ Server is ready!"
            return 0
        fi
        echo "⏳ Waiting for server... ($count/$timeout)"
        sleep 2
        count=$((count + 1))
    done
    
    echo "❌ Server failed to start within $timeout seconds"
    return 1
}

# Wait for the server
if wait_for_server; then
    echo "🎯 Running screenshot tests..."
    
    # Run specific screenshot test suites
    echo "📸 Running Admin Interface Screenshots..."
    npx playwright test --project=desktop-screenshots --reporter=list
    
    echo "📸 Running Blog Frontend Screenshots..."
    npx playwright test --project=blog-frontend-screenshots --reporter=list
    
    echo "📸 Running Wizard Visual Regression..."
    npx playwright test --project=wizard-visual-regression --reporter=list
    
    echo "📸 Running Strapi Integration Screenshots..."
    npx playwright test --project=strapi-integration-screenshots --reporter=list
    
    echo "📸 Running Homepage & Navigation Screenshots..."
    npx playwright test --project=homepage-navigation-screenshots --reporter=list
    
    echo "📱 Running Mobile Screenshots..."
    npx playwright test --project=mobile-screenshots --reporter=list
    
    # Generate HTML report
    echo "📊 Generating test report..."
    npx playwright show-report --host=localhost --port=9323 &
    REPORT_PID=$!
    
    echo "✅ Screenshot tests completed!"
    echo "📁 Screenshots saved to: test-report/"
    echo "🌐 Test report available at: http://localhost:9323"
    echo "📊 Raw results in: test-results/"
    
    # Organize screenshots by category
    echo "📂 Organizing screenshots..."
    if [ -d "test-report" ]; then
        mkdir -p test-report/screenshots/{admin,blog,wizard,strapi,homepage,mobile}
        
        # Move screenshots to organized folders
        mv test-report/admin-*.png test-report/screenshots/admin/ 2>/dev/null || true
        mv test-report/blog-*.png test-report/screenshots/blog/ 2>/dev/null || true
        mv test-report/wizard-*.png test-report/screenshots/wizard/ 2>/dev/null || true
        mv test-report/strapi-*.png test-report/screenshots/strapi/ 2>/dev/null || true
        mv test-report/homepage-*.png test-report/screenshots/homepage/ 2>/dev/null || true
        mv test-report/*mobile*.png test-report/screenshots/mobile/ 2>/dev/null || true
        mv test-report/responsive-*.png test-report/screenshots/mobile/ 2>/dev/null || true
        mv test-report/theme-*.png test-report/screenshots/homepage/ 2>/dev/null || true
        mv test-report/navigation-*.png test-report/screenshots/homepage/ 2>/dev/null || true
        mv test-report/footer-*.png test-report/screenshots/homepage/ 2>/dev/null || true
        mv test-report/search-*.png test-report/screenshots/homepage/ 2>/dev/null || true
        mv test-report/about-*.png test-report/screenshots/homepage/ 2>/dev/null || true
        mv test-report/store-*.png test-report/screenshots/homepage/ 2>/dev/null || true
        mv test-report/loading-*.png test-report/screenshots/homepage/ 2>/dev/null || true
    fi
    
    echo "📂 Screenshots organized by category!"
    
    # Count screenshots
    TOTAL_SCREENSHOTS=$(find test-report/ -name "*.png" | wc -l)
    echo "📊 Total screenshots captured: $TOTAL_SCREENSHOTS"
    
    # List screenshot categories
    echo "📁 Screenshot categories:"
    for dir in test-report/screenshots/*/; do
        if [ -d "$dir" ]; then
            COUNT=$(find "$dir" -name "*.png" | wc -l)
            CATEGORY=$(basename "$dir")
            echo "  📸 $CATEGORY: $COUNT screenshots"
        fi
    done
    
else
    echo "❌ Failed to start development server"
    exit 1
fi

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    if [ ! -z "$DEV_PID" ] && kill -0 $DEV_PID 2>/dev/null; then
        kill $DEV_PID
        echo "🛑 Stopped development server"
    fi
    if [ ! -z "$REPORT_PID" ] && kill -0 $REPORT_PID 2>/dev/null; then
        kill $REPORT_PID
        echo "🛑 Stopped report server"
    fi
}

# Set up cleanup on script exit
trap cleanup EXIT

echo "🎉 Screenshot testing complete!"
echo "📖 To view the full report, run: npx playwright show-report"
echo "🔍 Screenshots are organized in test-report/screenshots/"

# Keep the script running to show the report
if [ ! -z "$REPORT_PID" ]; then
    echo "📊 Test report is running at http://localhost:9323"
    echo "Press Ctrl+C to exit and stop all servers"
    wait $REPORT_PID
fi