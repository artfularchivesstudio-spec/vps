#!/bin/bash

echo "=========================================="
echo "Google Sheets API Setup Guide"
echo "=========================================="
echo ""

echo "This script will guide you through setting up Google Sheets API for MCP integration."
echo "Follow the steps below to configure your Google Cloud Console:"
echo ""

echo "STEP 1: Create a Google Cloud Project"
echo "----------------------------------------"
echo "1. Go to https://console.cloud.google.com/"
echo "2. Click on the project dropdown at the top"
echo "3. Click 'New Project'"
echo "4. Enter a project name (e.g., 'mcp-google-sheets')"
echo "5. Click 'Create'"
echo "6. Wait for the project to be created and select it"
echo ""

echo "STEP 2: Enable Google Sheets API"
echo "----------------------------------------"
echo "1. In the Google Cloud Console, go to 'APIs & Services' > 'Library'"
echo "2. Search for 'Google Sheets API'"
echo "3. Click on 'Google Sheets API'"
echo "4. Click 'Enable'"
echo ""

echo "STEP 3: Create OAuth 2.0 Credentials"
echo "----------------------------------------"
echo "1. Go to 'APIs & Services' > 'Credentials'"
echo "2. Click '+ CREATE CREDENTIALS' > 'OAuth 2.0 Client IDs'"
echo ""

echo "STEP 4: Configure OAuth Consent Screen"
echo "----------------------------------------"
echo "If prompted, configure the OAuth consent screen:"
echo "1. Choose 'External' user type"
echo "2. Fill in the required fields:"
echo "   - App name: MCP Google Sheets Integration"
echo "   - User support email: [your email]"
echo "   - Developer contact information: [your email]"
echo "3. Click 'Save and Continue'"
echo "4. Add scopes (if needed): https://www.googleapis.com/auth/spreadsheets"
echo "5. Add test users (your email)"
echo "6. Click 'Save and Continue'"
echo ""

echo "STEP 5: Create Desktop Application Credentials"
echo "----------------------------------------"
echo "1. Application type: 'Desktop application'"
echo "2. Name: 'MCP Google Sheets Client'"
echo "3. Click 'Create'"
echo "4. Download the JSON file"
echo "5. Save it as 'credentials/credentials.json' in your project root"
echo ""

echo "STEP 6: First-time Authentication"
echo "----------------------------------------"
echo "After setting up credentials, run the authentication script:"
echo "npm run auth:google-sheets"
echo ""
echo "This will:"
echo "1. Open a browser for Google authentication"
echo "2. Generate and save an access token"
echo ""

echo "=========================================="
echo "Setup Complete Checklist:"
echo "=========================================="
echo "□ Created Google Cloud Project"
echo "□ Enabled Google Sheets API"
echo "□ Configured OAuth Consent Screen"
echo "□ Created Desktop Application Credentials"
echo "□ Downloaded credentials.json to credentials/ folder"
echo "□ Ran authentication script"
echo ""

echo "Once all steps are complete, you can use the Google Sheets MCP server!"
echo ""

# Check if credentials file exists
if [ -f "credentials/credentials.json" ]; then
    echo "✓ credentials/credentials.json found"
else
    echo "⚠ credentials/credentials.json not found - please download it from Google Cloud Console"
fi

# Check if token file exists
if [ -f "credentials/token.json" ]; then
    echo "✓ credentials/token.json found"
else
    echo "⚠ credentials/token.json not found - run authentication after setting up credentials"
fi

echo ""
echo "For more information, see: docs/google-sheets-setup.md"