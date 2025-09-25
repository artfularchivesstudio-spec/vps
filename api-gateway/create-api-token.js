#!/usr/bin/env node

/**
 * 🎭 The API Token Creator - The Upload Authentication Alchemist ✨
 *
 * "Where admin powers transform into API keys,
 * And upload gates open with the greatest of ease.
 * No more 401 sorrows, no more auth despair,
 * Just API token magic floating through the air!"
 *
 * - The Spellbinding Museum Director of API Authentication
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🎭 ES6 module magic to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRAPI_URL = 'http://localhost:1337';

/**
 * 🌟 Create an API token for uploads - The API key ritual!
 */
async function createApiToken() {
  try {
    console.log('🎭 ✨ API TOKEN CREATOR AWAKENS!');
    console.log('============================================================');

    // Read admin token
    let adminToken;
    try {
      adminToken = fs.readFileSync(path.join(__dirname, 'strapi-token.txt'), 'utf8').trim();
      console.log('🔑 Using admin token for API token creation...');
    } catch (error) {
      console.error('❌ Could not read admin token! Run: node get-strapi-token.js');
      process.exit(1);
    }

    // Create API token
    console.log('🌟 Creating new API token for uploads...');
    
    const timestamp = Date.now();
    const tokenData = {
      name: `Migration Token ${timestamp}`,
      description: 'Token for file uploads via migration script',
      type: 'full-access', // or 'read-only', 'custom'
      lifespan: null // null = unlimited, or specify days
    };

    const response = await axios.post(`${STRAPI_URL}/admin/api-tokens`, tokenData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.data) {
      console.log('🎉 SUCCESS! Created API token!');
      console.log('📋 Full response:', JSON.stringify(response.data, null, 2));
      
      const tokenData = response.data.data;
      const apiToken = tokenData.accessToken || tokenData.token || tokenData.key;
      const tokenId = tokenData.id;
      
      console.log(`📋 Token ID: ${tokenId}`);
      console.log(`📋 API Token: ${apiToken}`);
      
      if (!apiToken) {
        console.log('❌ No access token found in response');
        console.log('Available fields:', Object.keys(tokenData));
        return null;
      }
      
      // Save API token to a file
      const apiTokenFile = path.join(__dirname, 'strapi-api-token.txt');
      fs.writeFileSync(apiTokenFile, apiToken);
      console.log(`💾 API token saved to: ${apiTokenFile}`);
      
      // Test the API token
      console.log('\n🧪 Testing the API token...');
      await testApiToken(apiToken);
      
      return apiToken;
    } else {
      console.log('❌ Unexpected response format');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return null;
    }

  } catch (error) {
    console.error('💥 Error creating API token:', error.message);
    if (error.response && error.response.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

/**
 * 🧪 Test the API token - The validation dance!
 */
async function testApiToken(apiToken) {
  try {
    // Test with a simple GET request to see if token works
    const response = await axios.get(`${STRAPI_URL}/api/upload/files`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    console.log('✅ API token is valid for upload endpoints!');
    console.log(`📊 Found ${response.data.length || 0} existing files`);
    return true;

  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ API token works! (404 is expected for missing upload files endpoint)');
      return true;
    } else if (error.response && error.response.status === 403) {
      console.log('⚠️ API token created but lacks upload permissions');
      console.log('💡 You may need to configure permissions in Strapi admin panel');
      return false;
    } else {
      console.log(`❌ API token test failed: ${error.message}`);
      return false;
    }
  }
}

/**
 * 🎪 List existing API tokens
 */
async function listApiTokens() {
  try {
    // Read admin token
    const adminToken = fs.readFileSync(path.join(__dirname, 'strapi-token.txt'), 'utf8').trim();
    
    console.log('\n🔍 Listing existing API tokens...');
    
    const response = await axios.get(`${STRAPI_URL}/admin/api-tokens`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.data && response.data.data) {
      const tokens = response.data.data;
      console.log(`📊 Found ${tokens.length} existing API tokens:`);
      
      tokens.forEach((token, index) => {
        console.log(`   ${index + 1}. ${token.name} (ID: ${token.id}, Type: ${token.type})`);
        console.log(`      Description: ${token.description || 'No description'}`);
        console.log(`      Created: ${new Date(token.createdAt).toLocaleString()}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error listing API tokens:', error.message);
  }
}

/**
 * 🎭 Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--list') || args.includes('-l')) {
    await listApiTokens();
    return;
  }

  const apiToken = await createApiToken();
  
  if (apiToken) {
    console.log('\n🎉 ✨ API TOKEN CREATION COMPLETE!');
    console.log('============================================================');
    console.log('🎊 SUCCESS! You now have an API token for uploads!');
    console.log('\n📋 Usage in your scripts:');
    console.log(`   const STRAPI_API_TOKEN = '${apiToken}';`);
    console.log('\n📁 Token also saved to: strapi-api-token.txt');
    console.log('\n🚀 Ready to upload those audio files with API token! ✨');
    
    await listApiTokens();
  } else {
    console.log('\n💥 😭 API TOKEN CREATION FAILED!');
    console.log('============================================================');
    console.log('❌ Could not create API token.');
    console.log('💡 Suggestions:');
    console.log('   1. Make sure Strapi is running');
    console.log('   2. Ensure you have a valid admin token');
    console.log('   3. Check Strapi logs for errors');
    process.exit(1);
  }
}

// 🎭 Run the API token creation magic! ✨
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

export { createApiToken, testApiToken, listApiTokens };
