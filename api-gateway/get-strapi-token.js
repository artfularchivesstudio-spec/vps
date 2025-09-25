#!/usr/bin/env node

/**
 * 🎭 The Strapi Token Generator - The Authentication Alchemist ✨
 *
 * "Where credentials transform into golden tokens,
 * And API gates swing wide for digital devotions.
 * No more 401 mysteries, no more auth despair,
 * Just fresh JWT magic floating through the air!"
 *
 * - The Spellbinding Museum Director of Authentication
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🎭 ES6 module magic to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRAPI_URL = 'http://localhost:1337';

// 🎪 The grand collection of admin credentials to try!
const ADMIN_ACCOUNTS = [
  { email: 'admin@api-router.cloud', password: 'Admin123!', name: 'Default Admin' },
  { email: 'mom@api-router.cloud', password: 'Simple123', name: 'MOM Admin' },
  { email: 'test@api-router.cloud', password: 'NewPassword123', name: 'Test Admin' },
  { email: 'mpms@api-router.cloud', password: 'mpms123', name: 'MPMS Admin' }
];

/**
 * 🌟 Generate a fresh JWT token - The authentication ritual!
 */
async function generateFreshToken(email, password, accountName) {
  try {
    console.log(`🔑 Attempting login for ${accountName} (${email})...`);
    
    const response = await axios.post(`${STRAPI_URL}/admin/login`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.data && response.data.data.token) {
      const token = response.data.data.token;
      console.log(`🎉 SUCCESS! Generated token for ${accountName}`);
      console.log(`📋 Token: ${token}`);
      
      // Save token to a file for easy reuse
      const tokenFile = path.join(__dirname, 'strapi-token.txt');
      fs.writeFileSync(tokenFile, token);
      console.log(`💾 Token saved to: ${tokenFile}`);
      
      return token;
    } else {
      console.log(`❌ Unexpected response format for ${accountName}`);
      return null;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`❌ Login failed for ${accountName}: ${error.response.data.error?.message || 'Unknown error'}`);
    } else {
      console.log(`❌ Network error for ${accountName}: ${error.message}`);
    }
    return null;
  }
}

/**
 * 🎭 Test the generated token - The validation dance!
 */
async function testToken(token) {
  try {
    console.log('\n🧪 Testing the generated token...');
    
    const response = await axios.get(`${STRAPI_URL}/admin/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data && response.data.data) {
      console.log(`✅ Token is valid! User: ${response.data.data.firstname} ${response.data.data.lastname}`);
      console.log(`📧 Email: ${response.data.data.email}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Token validation failed: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

/**
 * 🎪 Main token generation orchestration!
 */
async function main() {
  console.log('🎭 ✨ STRAPI TOKEN GENERATOR AWAKENS!');
  console.log('============================================================');
  
  // Check if Strapi is running
  try {
    await axios.get(`${STRAPI_URL}/admin/init`);
    console.log('🌟 Strapi is running and accessible!\n');
  } catch (error) {
    console.error('💥 Strapi is not accessible! Make sure it\'s running on localhost:1337');
    process.exit(1);
  }

  let validToken = null;

  // Try each admin account
  for (const account of ADMIN_ACCOUNTS) {
    const token = await generateFreshToken(account.email, account.password, account.name);
    
    if (token) {
      const isValid = await testToken(token);
      if (isValid) {
        validToken = token;
        break;
      }
    }
    
    console.log(''); // Empty line for readability
  }

  if (validToken) {
    console.log('\n🎉 ✨ TOKEN GENERATION COMPLETE!');
    console.log('============================================================');
    console.log('🎊 SUCCESS! You now have a fresh, valid JWT token!');
    console.log('\n📋 Usage in your scripts:');
    console.log(`   const STRAPI_API_TOKEN = '${validToken}';`);
    console.log('\n📁 Token also saved to: strapi-token.txt');
    console.log('\n🚀 Ready to upload those audio files! ✨');
  } else {
    console.log('\n💥 😭 TOKEN GENERATION FAILED!');
    console.log('============================================================');
    console.log('❌ Could not generate a valid token with any admin account.');
    console.log('💡 Suggestions:');
    console.log('   1. Check if Strapi admin panel is accessible at http://localhost:1337/admin');
    console.log('   2. Create a new admin user manually');
    console.log('   3. Reset admin password via Strapi CLI');
    process.exit(1);
  }
}

// 🎭 Run the token generation magic! ✨
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

export { generateFreshToken, testToken };
