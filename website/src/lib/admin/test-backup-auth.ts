/**
 * 🧪 Test Backup Authentication System
 *
 * Utility to test the emergency backup authentication when normal auth fails.
 * Use this to verify that the backup system works in the "weird state" scenarios.
 */

import { backupAuthService } from './backup-auth'

/**
 * 🧪 Test all backup authentication methods
 */
export async function testBackupAuthentication(): Promise<{
  success: boolean
  results: any[]
  summary: string
}> {
  console.log('🧪 Testing Backup Authentication System...')
  console.log('═'.repeat(50))

  const results = []

  // Test 1: Check backup status
  console.log('1️⃣ Checking backup auth status...')
  try {
    const status = await backupAuthService.getBackupStatus()
    results.push({
      test: 'backup_status',
      success: status.configured,
      data: status
    })
    console.log(`✅ Backup auth ${status.configured ? 'configured' : 'not configured'}`)
    console.log(`   Methods: ${status.methods.join(', ')}`)
    console.log(`   Test users: ${status.testUsers.join(', ')}`)
  } catch (error) {
    results.push({
      test: 'backup_status',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
    console.log('❌ Backup status check failed:', error instanceof Error ? error.message : String(error))
  }

  // Test 2: Test API key authentication
  console.log('\n2️⃣ Testing API key authentication...')
  try {
    const testRequest = new Request('http://localhost:3000/admin/test', {
      headers: {
        'x-test-api-key': process.env.TEST_USER_API_KEY || ''
      }
    })

    const apiKeyResult = await backupAuthService.authenticateEmergency(testRequest)
    results.push({
      test: 'api_key_auth',
      success: apiKeyResult.success,
      method: apiKeyResult.method,
      data: apiKeyResult
    })

    if (apiKeyResult.success) {
      console.log(`✅ API key auth successful via ${apiKeyResult.method}`)
    } else {
      console.log(`❌ API key auth failed: ${apiKeyResult.error}`)
    }
  } catch (error) {
    results.push({
      test: 'api_key_auth',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
    console.log('❌ API key auth test failed:', error instanceof Error ? error.message : String(error))
  }

  // Test 3: Test admin login
  console.log('\n3️⃣ Testing test admin login...')
  try {
    const testRequest = new Request('http://localhost:3000/admin/test')

    // Mock the test admin login by setting environment
    const originalEmail = process.env.TEST_ADMIN_EMAIL
    const originalPassword = process.env.TEST_ADMIN_PASSWORD

    if (originalEmail && originalPassword) {
      const adminResult = await backupAuthService.authenticateEmergency(testRequest)
      results.push({
        test: 'admin_login',
        success: adminResult.success,
        method: adminResult.method,
        data: adminResult
      })

      if (adminResult.success) {
        console.log(`✅ Admin login successful via ${adminResult.method}`)
      } else {
        console.log(`❌ Admin login failed: ${adminResult.error}`)
      }
    } else {
      results.push({
        test: 'admin_login',
        success: false,
        error: 'Test admin credentials not configured'
      })
      console.log('❌ Test admin credentials not configured')
    }
  } catch (error) {
    results.push({
      test: 'admin_login',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
    console.log('❌ Admin login test failed:', error instanceof Error ? error.message : String(error))
  }

  // Summary
  const successfulTests = results.filter(r => r.success).length
  const totalTests = results.length
  const summary = `${successfulTests}/${totalTests} tests passed`

  console.log('\n📊 Test Results Summary:')
  console.log('═'.repeat(30))
  console.log(`✅ ${successfulTests} passed`)
  console.log(`❌ ${totalTests - successfulTests} failed`)
  console.log(`📈 Success rate: ${Math.round((successfulTests / totalTests) * 100)}%`)

  if (successfulTests === totalTests) {
    console.log('🎉 All backup authentication tests passed!')
  } else {
    console.log('⚠️ Some tests failed. Check the results above.')
  }

  return {
    success: successfulTests > 0,
    results,
    summary
  }
}

/**
 * 🚨 Simulate "weird state" scenario
 * Test what happens when normal auth fails but user should have admin access
 */
export async function simulateWeirdState(): Promise<{
  success: boolean
  backupActivated: boolean
  method: string
  user?: any
}> {
  console.log('🚨 Simulating "weird state" scenario...')
  console.log('User in admin page but missing auth headers')
  console.log('═'.repeat(50))

  // Create a request that simulates being in admin but without auth
  const weirdRequest = new Request('http://localhost:3000/admin/dashboard', {
    headers: {
      // No authorization headers - simulates the weird state
      'user-agent': 'Mozilla/5.0',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  })

  try {
    const result = await backupAuthService.authenticateEmergency(weirdRequest)

    if (result.success) {
      console.log('✅ Backup authentication activated!')
      console.log(`   Method: ${result.method}`)
      console.log(`   User ID: ${result.user?.id}`)
      console.log(`   Email: ${result.user?.email}`)

      return {
        success: true,
        backupActivated: true,
        method: result.method,
        user: result.user
      }
    } else {
      console.log('❌ Backup authentication failed')
      console.log(`   Error: ${result.error}`)

      return {
        success: false,
        backupActivated: false,
        method: 'none'
      }
    }
  } catch (error) {
    console.error('💥 Weird state simulation failed:', error)
    return {
      success: false,
      backupActivated: false,
      method: 'error'
    }
  }
}

/**
 * 🛠️ Emergency auth debugging utility
 */
export async function debugEmergencyAuth(): Promise<void> {
  console.log('🔍 Emergency Authentication Debug Info')
  console.log('═'.repeat(40))

  console.log('Environment Variables:')
  console.log(`TEST_ADMIN_EMAIL: ${process.env.TEST_ADMIN_EMAIL ? '✅ Set' : '❌ Missing'}`)
  console.log(`TEST_ADMIN_PASSWORD: ${process.env.TEST_ADMIN_PASSWORD ? '✅ Set' : '❌ Missing'}`)
  console.log(`TEST_SUPER_ADMIN_EMAIL: ${process.env.TEST_SUPER_ADMIN_EMAIL ? '✅ Set' : '❌ Missing'}`)
  console.log(`TEST_SUPER_ADMIN_PASSWORD: ${process.env.TEST_SUPER_ADMIN_PASSWORD ? '✅ Set' : '❌ Missing'}`)
  console.log(`TEST_USER_EMAIL: ${process.env.TEST_USER_EMAIL ? '✅ Set' : '❌ Missing'}`)
  console.log(`TEST_USER_PASSWORD: ${process.env.TEST_USER_PASSWORD ? '✅ Set' : '❌ Missing'}`)
  console.log(`TEST_USER_API_KEY: ${process.env.TEST_USER_API_KEY ? '✅ Set' : '❌ Missing'}`)

  console.log('\nBackup Status:')
  const status = await backupAuthService.getBackupStatus()
  console.log(`Configured: ${status.configured}`)
  console.log(`Available methods: ${status.methods.join(', ')}`)
  console.log(`Test users: ${status.testUsers.join(', ')}`)
}

/**
 * 🎯 Quick test function for development
 */
export async function quickBackupTest(): Promise<boolean> {
  console.log('⚡ Quick Backup Auth Test')

  try {
    const status = await backupAuthService.getBackupStatus()
    console.log(`Backup auth ${status.configured ? '✅ configured' : '❌ not configured'}`)

    if (status.configured) {
      const testRequest = new Request('http://localhost:3000/admin/test', {
        headers: {
          'x-test-api-key': process.env.TEST_USER_API_KEY || ''
        }
      })

      const result = await backupAuthService.authenticateEmergency(testRequest)
      console.log(`API key test: ${result.success ? '✅ passed' : '❌ failed'}`)

      return result.success
    }

    return false
  } catch (error) {
    console.error('❌ Quick test failed:', error instanceof Error ? error.message : String(error))
    return false
  }
}
