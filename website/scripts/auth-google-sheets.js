#!/usr/bin/env node

import fs from 'fs';
import { google } from 'googleapis';
import http from 'http';
import open from 'open';
import path from 'path';
import url, { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(__dirname, '..', 'credentials', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'credentials.json');

async function authenticate() {
  try {
    // Load client secrets from local file
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('Error: credentials.json not found!');
      console.error('Please follow the setup guide in scripts/setup-google-sheets-api.sh');
      console.error('Download credentials.json from Google Cloud Console and save it to credentials/credentials.json');
      process.exit(1);
    }

    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token
    if (fs.existsSync(TOKEN_PATH)) {
      const token = fs.readFileSync(TOKEN_PATH);
      oAuth2Client.setCredentials(JSON.parse(token));
      console.log('✓ Using existing authentication token');
      return oAuth2Client;
    }

    // Generate the url that will be used for authorization
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('🔗 Opening browser for Google authentication...');
    console.log('If the browser doesn\'t open automatically, visit this URL:');
    console.log(authorizeUrl);
    console.log('');

    // Open browser for authentication
    await open(authorizeUrl);

    // Create a local server to receive the authorization code
    const server = http.createServer(async (req, res) => {
      try {
        const queryObject = url.parse(req.url, true).query;

        if (queryObject.code) {
          console.log('📝 Received authorization code, exchanging for tokens...');

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #4CAF50;">✓ Authentication Successful!</h1>
                <p>You can close this window and return to your terminal.</p>
                <p>The Google Sheets MCP server is now authenticated.</p>
              </body>
            </html>
          `);

          // Exchange authorization code for access token
          const { tokens } = await oAuth2Client.getToken(queryObject.code);
          oAuth2Client.setCredentials(tokens);

          // Store the token to disk for later program executions
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
          console.log('💾 Authentication token saved to credentials/token.json');

          server.close();
          process.exit(0);
        } else if (queryObject.error) {
          console.error('❌ Authentication failed:', queryObject.error);

          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #f44336;">✗ Authentication Failed</h1>
                <p>Error: ${queryObject.error}</p>
                <p>Please try again.</p>
              </body>
            </html>
          `);

          server.close();
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Error during authentication:', error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #f44336;">✗ Authentication Error</h1>
              <p>${error.message}</p>
            </body>
          </html>
        `);
        server.close();
        process.exit(1);
      }
    });

    // Start the server
    const PORT = 3000;
    server.listen(PORT, () => {
      console.log(`🌐 Local server listening on http://localhost:${PORT}`);
      console.log('Waiting for authentication...');
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      console.error('⏰ Authentication timeout - please try again');
      server.close();
      process.exit(1);
    }, 5 * 60 * 1000);

  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    process.exit(1);
  }
}

// Run authentication
authenticate().catch(console.error);