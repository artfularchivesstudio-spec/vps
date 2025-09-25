#!/usr/bin/env node

import fs from 'fs';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(__dirname, '..', 'credentials', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'credentials.json');

async function testGoogleSheetsIntegration() {
  console.log('🧪 Testing Google Sheets MCP Integration...\n');

  try {
    // Check if credentials exist
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('❌ credentials.json not found!');
      console.log('Please run: npm run sheets:setup');
      console.log('Then download credentials from Google Cloud Console and save as credentials/credentials.json');
      process.exit(1);
    }

    // Check if token exists
    if (!fs.existsSync(TOKEN_PATH)) {
      console.error('❌ token.json not found!');
      console.log('Please run: npm run auth:google-sheets');
      process.exit(1);
    }

    console.log('✅ Credentials and tokens found');

    // Load credentials and initialize auth
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));

    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

    console.log('✅ Google Sheets API client initialized');

    // Test 1: Create a test spreadsheet
    console.log('\n📝 Test 1: Creating test spreadsheet...');
    const createResponse = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: 'MCP Test Spreadsheet - ' + new Date().toISOString().split('T')[0],
        },
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    console.log(`✅ Created spreadsheet: ${createResponse.data.spreadsheetUrl}`);

    // Test 2: Write data to the spreadsheet
    console.log('\n✍️  Test 2: Writing data to spreadsheet...');
    const writeResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A1:C1',
      valueInputOption: 'RAW',
      resource: {
        values: [['Name', 'Email', 'Role']],
      },
    });
    console.log('✅ Data written successfully');

    // Test 3: Append data
    console.log('\n📎 Test 3: Appending data to spreadsheet...');
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A:C',
      valueInputOption: 'RAW',
      resource: {
        values: [
          ['John Doe', 'john@example.com', 'Developer'],
          ['Jane Smith', 'jane@example.com', 'Designer'],
        ],
      },
    });
    console.log('✅ Data appended successfully');

    // Test 4: Read data back
    console.log('\n📖 Test 4: Reading data from spreadsheet...');
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A1:C10',
    });

    const values = readResponse.data.values || [];
    console.log('✅ Data read successfully:');
    values.forEach((row, index) => {
      console.log(`  Row ${index + 1}: ${row.join(' | ')}`);
    });

    // Test 5: Get spreadsheet metadata
    console.log('\n📊 Test 5: Getting spreadsheet metadata...');
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    console.log('✅ Spreadsheet metadata:');
    console.log(`  Title: ${metadataResponse.data.properties.title}`);
    console.log(`  Sheets: ${metadataResponse.data.sheets.length}`);
    metadataResponse.data.sheets.forEach(sheet => {
      console.log(`    - ${sheet.properties.title} (ID: ${sheet.properties.sheetId})`);
    });

    console.log('\n🎉 All tests passed! Google Sheets MCP integration is working correctly.');
    console.log(`\n📋 Test spreadsheet URL: ${createResponse.data.spreadsheetUrl}`);
    console.log('You can view and edit this spreadsheet in your browser.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);

    if (error.code === 403) {
      console.log('\n🔐 This might be an authentication issue. Try:');
      console.log('1. Run: npm run auth:google-sheets');
      console.log('2. Make sure the OAuth consent screen is configured');
      console.log('3. Verify your email is added as a test user');
    } else if (error.code === 404) {
      console.log('\n📭 API not enabled. Make sure:');
      console.log('1. Google Sheets API is enabled in Google Cloud Console');
      console.log('2. The correct project is selected');
    }

    process.exit(1);
  }
}

// Run the test
testGoogleSheetsIntegration().catch(console.error);