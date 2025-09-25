// 🎨 Test Google Sheets Integration - Artful Archives
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testGoogleSheetsConnection() {
  console.log('🎭 Testing Google Sheets Connection...\n');

  try {
    // Check if credentials file exists
    const credentialsPath = path.join(__dirname, 'google-sheets-credentials.json');
    if (!fs.existsSync(credentialsPath)) {
      console.log('❌ google-sheets-credentials.json not found');
      console.log('💡 Please download your service account JSON key from Google Cloud Console');
      return;
    }

    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('✅ Credentials loaded successfully');
    console.log(`📧 Service Account: ${credentials.client_email}\n`);

    // Check environment variables
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId || spreadsheetId === 'your_spreadsheet_id_here') {
      console.log('❌ GOOGLE_SHEETS_SPREADSHEET_ID not set in .env');
      console.log('💡 Please update your .env file with the actual spreadsheet ID');
      return;
    }
    console.log(`📊 Spreadsheet ID: ${spreadsheetId}\n`);

    // Initialize Google Sheets client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Test connection by getting spreadsheet info
    console.log('🔗 Testing connection to Google Sheets...');
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    console.log('✅ Connection successful!');
    console.log(`📋 Spreadsheet Title: ${response.data.properties.title}`);
    console.log(`👥 Sheets Count: ${response.data.sheets.length}`);

    // List all sheets
    console.log('\n📑 Available Sheets:');
    response.data.sheets.forEach((sheet, index) => {
      console.log(`  ${index + 1}. ${sheet.properties.title}`);
    });

    console.log('\n🎉 Google Sheets integration is working perfectly!');
    console.log('🚀 You can now run: npm run sheets:init && npm run sheets:sync');

  } catch (error) {
    console.log('\n❌ Connection failed:');
    console.log(`Error: ${error.message}`);

    if (error.message.includes('The caller does not have permission')) {
      console.log('\n💡 Solution: Share your Google Sheet with the service account email');
      console.log('   Give "Editor" permissions to:');
      console.log(`   ${credentials.client_email}`);
    }

    if (error.message.includes('Spreadsheet not found')) {
      console.log('\n💡 Solution: Check your GOOGLE_SHEETS_SPREADSHEET_ID in .env');
      console.log('   Make sure it matches the ID from your Google Sheet URL');
    }
  }
}

// Run the test
testGoogleSheetsConnection();
