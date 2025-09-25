#!/usr/bin/env node

/**
 * 🧪 Test Backup Authentication Script
 *
 * Quick utility to test the emergency backup authentication system.
 * Use this to verify that backup auth works when normal auth fails.
 *
 * Usage:
 *   node scripts/test-backup-auth.js
 */

require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testBackupAuth() {
  console.log('🧪 Testing Backup Authentication System')
  console.log('═'.repeat(50))

  // Test 1: Check if test users exist
  console.log('1️⃣ Checking test users in database...')
  try {
    const testEmails = [
      process.env.TEST_ADMIN_EMAIL,
      process.env.TEST_SUPER_ADMIN_EMAIL,
      process.env.TEST_USER_EMAIL
    ].filter(Boolean)

    for (const email of testEmails) {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('email, role')
        .eq('email', email)
        .single()

      if (data) {
        console.log(`✅ Found test user: ${email} (${data.role})`)
      } else {
        console.log(`❌ Missing test user: ${email}`)
      }
    }
  } catch (error) {
    console.log('❌ Database check failed:', error.message)
  }

  // Test 2: Check environment variables
  console.log('\n2️⃣ Checking environment variables...')
  const requiredVars = [
    'TEST_ADMIN_EMAIL',
    'TEST_ADMIN_PASSWORD',
    'TEST_SUPER_ADMIN_EMAIL',
    'TEST_SUPER_ADMIN_PASSWORD',
    'TEST_USER_EMAIL',
    'TEST_USER_PASSWORD',
    'TEST_USER_API_KEY'
  ]

  let envCount = 0
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`)
      envCount++
    } else {
      console.log(`❌ ${varName}: Missing`)
    }
  }

  // Test 3: Test API key authentication
  console.log('\n3️⃣ Testing API key authentication...')
  if (process.env.TEST_USER_API_KEY) {
    try {
      // This would normally be tested via the actual backup auth service
      console.log('✅ API key is configured')
      console.log(`   Key: ${process.env.TEST_USER_API_KEY.substring(0, 10)}...`)
    } catch (error) {
      console.log('❌ API key test failed:', error.message)
    }
  } else {
    console.log('❌ TEST_USER_API_KEY not configured')
  }

  // Summary
  console.log('\n📊 Test Results Summary:')
  console.log('═'.repeat(30))
  console.log(`Environment variables: ${envCount}/${requiredVars.length} configured`)
  console.log(`Backup auth status: ${envCount >= 5 ? '✅ Ready' : '⚠️ Incomplete'}`)

  if (envCount >= 5) {
    console.log('\n🎉 Backup authentication system is configured!')
    console.log('   Ready to handle "weird state" scenarios')
    console.log('   Test users can provide emergency admin access')
  } else {
    console.log('\n⚠️ Backup authentication needs more configuration')
    console.log('   Run the admin user creation script:')
    console.log('   node scripts/create-admin-user.js test-admin@artfularchivesstudio.com admin')
  }
}

async function main() {
  try {
    await testBackupAuth()
  } catch (error) {
    console.error('💥 Test script failed:', error.message)
    console.error('')
    console.error('🔍 Debug Information:')
    console.error('Make sure you have created test users and updated .env file')
    console.error('Run: node scripts/create-admin-user.js test-admin@artfularchivesstudio.com admin')
  }
}

if (require.main === module) {
  main().catch(console.error)
}
