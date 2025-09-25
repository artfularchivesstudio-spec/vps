#!/usr/bin/env node

// 🧪 Simple Upload Test - Testing Audio File Upload to Strapi
// 🎭 The Upload Testing Alchemist

const fs = require('fs');
const FormData = require('form-data');

const STRAPI_URL = 'http://localhost:1337';
const ADMIN_EMAIL = 'mom@api-router.cloud';
const ADMIN_PASSWORD = 'MomAdmin123!';

async function testUpload() {
  try {
    console.log('🧪 ✨ STARTING UPLOAD TEST!');
    
    // Get admin token
    console.log('🔐 Getting admin token...');
    const loginResponse = await fetch(`${STRAPI_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const adminJWT = loginData.data.token;
    console.log('✅ Admin token obtained');

    // Test with the smallest audio file
    const testFile = '/root/website/audio_samples/06b82937-a59c-4d9b-aa71-0c9d661a296f_en_full.mp3';
    const stats = fs.statSync(testFile);
    console.log(`🎵 Testing upload of: ${testFile}`);
    console.log(`📏 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Create form data
    const formData = new FormData();
    const fileStream = fs.createReadStream(testFile);
    
    formData.append('files', fileStream, {
      filename: 'test-audio.mp3',
      contentType: 'audio/mpeg',
    });

    console.log('📤 Uploading file...');
    
    // Upload
    const uploadResponse = await fetch(`${STRAPI_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminJWT}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log(`📊 Response status: ${uploadResponse.status}`);
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ 🎉 Upload successful!');
      console.log('📋 Result:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await uploadResponse.text();
      console.log('❌ Upload failed');
      console.log('💥 Error:', errorText);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testUpload();
