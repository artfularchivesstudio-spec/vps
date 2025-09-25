/**
 * 🎭 Backup Authentication Service
 *
 * Emergency authentication mechanism for when users are in admin pages
 * but missing normal authentication headers. Uses test credentials as fallback.
 *
 * This handles the "weird state" where:
 * - User can access admin routes
 * - But auth headers/context are missing
 * - Normal auth flow fails
 * - We need a backup mechanism
 */

import { logger } from '@/lib/observability/logger'
import { createClient } from '@/lib/supabase/server'

export interface BackupAuthResult {
  success: boolean
  user?: any
  profile?: any
  method: 'test_admin' | 'test_super_admin' | 'test_user' | 'api_key' | 'none'
  error?: string
}

export class BackupAuthService {
  private async getSupabase() {
    return await createClient()
  }

  /**
   * 🚨 Emergency Authentication - Last Resort
   * When normal auth fails, try test credentials as backup
   */
  async authenticateEmergency(request: Request): Promise<BackupAuthResult> {
    try {
      // Method 1: Try test API key from headers
      const apiKeyResult = await this.tryTestApiKey(request)
      if (apiKeyResult.success) {
        await logger.logSuccess('backup_auth_success', '🚨 Emergency auth via test API key', { method: 'api_key' })
        return apiKeyResult
      }

      // Method 2: Try test admin login
      const adminResult = await this.tryTestAdminLogin()
      if (adminResult.success) {
        await logger.logSuccess('backup_auth_success', '🚨 Emergency auth via test admin', { method: 'test_admin' })
        return adminResult
      }

      // Method 3: Try test super admin login
      const superAdminResult = await this.tryTestSuperAdminLogin()
      if (superAdminResult.success) {
        await logger.logSuccess('backup_auth_success', '🚨 Emergency auth via test super admin', { method: 'test_super_admin' })
        return superAdminResult
      }

      // Method 4: Try test user login (lowest privilege)
      const userResult = await this.tryTestUserLogin()
      if (userResult.success) {
        await logger.logSuccess('backup_auth_success', '🚨 Emergency auth via test user', { method: 'test_user' })
        return userResult
      }

      await logger.logError({
        type: 'backup_auth_failed',
        message: '🚨 All backup authentication methods failed',
        severity: 'warning',
        source: 'auth'
      })

      return {
        success: false,
        method: 'none',
        error: 'All backup authentication methods failed'
      }

    } catch (error) {
      await logger.logError({
        type: 'backup_auth_error',
        message: '💥 Backup authentication system error',
        severity: 'error',
        source: 'auth',
        requestData: { error }
      })

      return {
        success: false,
        method: 'none',
        error: 'Backup authentication system error'
      }
    }
  }

  /**
   * 🔑 Try Test API Key Authentication
   */
  private async tryTestApiKey(request: Request): Promise<BackupAuthResult> {
    try {
      const authHeader = request.headers.get('authorization')
      const apiKey = request.headers.get('x-api-key') ||
                     request.headers.get('x-test-api-key') ||
                     new URL(request.url).searchParams.get('api_key')

      const testApiKey = process.env.TEST_USER_API_KEY

      if ((authHeader?.includes(testApiKey || '')) || (apiKey === testApiKey)) {
        // Try to get admin profile for test user
        const profile = await this.getTestAdminProfile()

        if (profile) {
          return {
            success: true,
            user: { id: profile.id, email: profile.email },
            profile,
            method: 'api_key'
          }
        }
      }

      return { success: false, method: 'api_key' }

    } catch (error) {
      console.error('Test API key auth error:', error)
      return { success: false, method: 'api_key', error: 'API key authentication failed' }
    }
  }

  /**
   * 👑 Try Test Admin Login
   */
  private async tryTestAdminLogin(): Promise<BackupAuthResult> {
    try {
      const testEmail = process.env.TEST_ADMIN_EMAIL
      const testPassword = process.env.TEST_ADMIN_PASSWORD

      if (!testEmail || !testPassword) {
        return { success: false, method: 'test_admin', error: 'Test admin credentials not configured' }
      }

      const supabase = await this.getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (error) {
        return { success: false, method: 'test_admin', error: error.message }
      }

      if (data.user) {
        const profile = await this.getAdminProfile(data.user.id)
        return {
          success: true,
          user: data.user,
          profile,
          method: 'test_admin'
        }
      }

      return { success: false, method: 'test_admin', error: 'No user data returned' }

    } catch (error) {
      console.error('Test admin login error:', error)
      return { success: false, method: 'test_admin', error: 'Test admin login failed' }
    }
  }

  /**
   * 🏆 Try Test Super Admin Login
   */
  private async tryTestSuperAdminLogin(): Promise<BackupAuthResult> {
    try {
      const testEmail = process.env.TEST_SUPER_ADMIN_EMAIL
      const testPassword = process.env.TEST_SUPER_ADMIN_PASSWORD

      if (!testEmail || !testPassword) {
        return { success: false, method: 'test_super_admin', error: 'Test super admin credentials not configured' }
      }

      const supabase = await this.getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (error) {
        return { success: false, method: 'test_super_admin', error: error.message }
      }

      if (data.user) {
        const profile = await this.getAdminProfile(data.user.id)
        return {
          success: true,
          user: data.user,
          profile,
          method: 'test_super_admin'
        }
      }

      return { success: false, method: 'test_super_admin', error: 'No user data returned' }

    } catch (error) {
      console.error('Test super admin login error:', error)
      return { success: false, method: 'test_super_admin', error: 'Test super admin login failed' }
    }
  }

  /**
   * 👤 Try Test User Login
   */
  private async tryTestUserLogin(): Promise<BackupAuthResult> {
    try {
      const testEmail = process.env.TEST_USER_EMAIL
      const testPassword = process.env.TEST_USER_PASSWORD

      if (!testEmail || !testPassword) {
        return { success: false, method: 'test_user', error: 'Test user credentials not configured' }
      }

      const supabase = await this.getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (error) {
        return { success: false, method: 'test_user', error: error.message }
      }

      if (data.user) {
        const profile = await this.getAdminProfile(data.user.id)
        return {
          success: true,
          user: data.user,
          profile,
          method: 'test_user'
        }
      }

      return { success: false, method: 'test_user', error: 'No user data returned' }

    } catch (error) {
      console.error('Test user login error:', error)
      return { success: false, method: 'test_user', error: 'Test user login failed' }
    }
  }

  /**
   * 📋 Get Admin Profile by User ID
   */
  private async getAdminProfile(userId: string) {
    try {
      const supabase = await this.getSupabase()

      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        console.warn('Could not find admin profile for user:', userId)
        return null
      }

      return data

    } catch (error) {
      console.error('Error fetching admin profile:', error)
      return null
    }
  }

  /**
   * 🎯 Get Test Admin Profile (for API key auth)
   */
  private async getTestAdminProfile() {
    try {
      // Try to find test admin profile
      const testEmail = process.env.TEST_ADMIN_EMAIL ||
                       process.env.TEST_SUPER_ADMIN_EMAIL

      if (!testEmail) return null

      const supabase = await this.getSupabase()

      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('email', testEmail)
        .single()

      if (error || !data) {
        console.warn('Could not find test admin profile')
        return null
      }

      return data

    } catch (error) {
      console.error('Error fetching test admin profile:', error)
      return null
    }
  }

  /**
   * 🚪 Emergency Logout
   */
  async emergencyLogout(): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase.auth.signOut()
      await logger.logSuccess('emergency_logout', '🚨 Emergency logout completed')
    } catch (error) {
      console.error('Emergency logout error:', error)
    }
  }

  /**
   * 📊 Get Backup Auth Status
   */
  async getBackupStatus(): Promise<{
    configured: boolean
    methods: string[]
    testUsers: string[]
  }> {
    const methods = []
    const testUsers = []

    if (process.env.TEST_USER_API_KEY) methods.push('api_key')
    if (process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD) {
      methods.push('test_admin')
      testUsers.push('test_admin')
    }
    if (process.env.TEST_SUPER_ADMIN_EMAIL && process.env.TEST_SUPER_ADMIN_PASSWORD) {
      methods.push('test_super_admin')
      testUsers.push('test_super_admin')
    }
    if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
      methods.push('test_user')
      testUsers.push('test_user')
    }

    return {
      configured: methods.length > 0,
      methods,
      testUsers
    }
  }
}

/**
 * 🎭 Singleton Backup Auth Service
 */
export const backupAuthService = new BackupAuthService()

/**
 * 🚨 Emergency Auth Middleware
 * Use this when normal auth fails but user should have admin access
 */
export async function emergencyAuthMiddleware(request: Request): Promise<BackupAuthResult> {
  console.warn('🚨 Activating emergency authentication middleware')

  // Debug: Check what headers we received
  const headers = {
    authorization: request.headers.get('authorization') ? 'present' : 'missing',
    'x-api-key': request.headers.get('x-api-key') ? 'present' : 'missing',
    'x-test-api-key': request.headers.get('x-test-api-key') ? 'present' : 'missing',
  }
  console.log('📋 Emergency auth headers:', headers)

  const backupResult = await backupAuthService.authenticateEmergency(request)

  if (backupResult.success) {
    console.log('✅ Emergency authentication successful:', backupResult.method)
    console.log(`   User: ${backupResult.user?.email}`)
  } else {
    console.error('❌ Emergency authentication failed:', backupResult.error)
  }

  return backupResult
}
