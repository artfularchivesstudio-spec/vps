/**
 * 🎭 Admin Authentication Service - The Enchanted Gateway to Administrative Realms
 *
 * This service provides comprehensive admin authentication management including:
 * - Dedicated admin service user creation and management
 * - Session persistence and validation
 * - Role-based access control utilities
 * - Authentication state management
 */

import { logger } from '@/lib/observability/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'super_admin' | 'user'
  first_name?: string
  last_name?: string
  created_at: string
  last_login?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: AdminUser | null
  isLoading: boolean
  error: string | null
}

/**
 * 🎪 Admin Service User Management
 * Creates and manages dedicated admin service accounts for automated operations
 */
export class AdminAuthService {
  public supabase = createServiceClient()

  /**
   * ✨ Create or retrieve admin service user
   * Perfect for automated admin operations and background tasks
   */
  async getOrCreateServiceUser(email: string = 'admin-service@artfularchives.com'): Promise<AdminUser> {
    try {
      // First try to find existing service user
      const { data: existingUser, error: fetchError } = await this.supabase
        .from('admin_profiles')
        .select('*')
        .eq('email', email)
        .eq('role', 'super_admin')
        .single()

      if (existingUser && !fetchError) {
        await logger.logSuccess('admin_service_user_found', '🔍 Found existing admin service user', { userId: existingUser.id })
        return existingUser
      }

      // Create new service user if doesn't exist
      const { data: newUser, error: createError } = await this.supabase
        .rpc('get_or_create_admin_profile')

      if (createError) {
        await logger.logError({
          type: 'admin_service_user_creation_failed',
          message: '❌ Failed to create admin service user',
          severity: 'error',
          source: 'admin-auth-service',
          requestData: { error: createError }
        })
        throw new Error(`Failed to create admin service user: ${createError.message}`)
      }

      await logger.logSuccess('admin_service_user_created', '🎭 Created new admin service user', { userId: newUser?.id })
      return newUser

    } catch (error) {
      await logger.logError({
        type: 'admin_service_user_error',
        message: '💥 Admin service user operation failed',
        severity: 'error',
        source: 'admin-auth-service',
        requestData: { error }
      })
      throw error
    }
  }

  /**
   * 👑 Validate admin user permissions
   * Ensures user has appropriate admin role for operations
   */
  async validateAdminPermissions(userId: string, requiredRole: 'admin' | 'super_admin' = 'admin'): Promise<boolean> {
    try {
      console.log(`🎭 ✨ ADMIN PERMISSIONS QUEST AWAKENS! Seeker: ${userId}, Sacred Role: ${requiredRole}`)
      
      // 🎭 First try to get existing profile by id (primary key)
      let { data: profile, error } = await this.supabase
        .from('admin_profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error || !profile) {
        console.log(`🔮 🌙 Ancient scrolls reveal no mystical profile for seeker ${userId}! The theatrical void whispers:`, error)
        
        // 🎭 The Grand Summoning - conjuring admin profile from the digital aether 
        try {
          // ✨ Invoke the mystical get_or_create_admin_profile ritual
          const { data: createdProfileId, error: createError } = await this.supabase
            .rpc('get_or_create_admin_profile')

          if (!createError && createdProfileId) {
            // Now fetch the created profile
            const { data: newProfile, error: fetchError } = await this.supabase
              .from('admin_profiles')
              .select('role')
              .eq('id', userId)
              .single()

            if (!fetchError && newProfile) {
              await logger.logSuccess('admin_profile_auto_created', '✨ Auto-created admin profile using function', { userId, role: newProfile.role })
              profile = newProfile
            }
          }
        } catch (createError) {
          console.log('🌟 Could not auto-create admin profile:', createError)
        }

        // If still no profile, try creating manually
        if (!profile) {
          try {
            const { data: userAuth, error: userError } = await this.supabase.auth.admin.getUserById(userId)
            if (!userError && userAuth?.user) {
              // Create admin profile with super_admin role
              const { data: newProfile, error: insertError } = await this.supabase
                .from('admin_profiles')
                .insert({
                  id: userId,
                  email: userAuth.user.email,
                  role: 'super_admin',
                  first_name: userAuth.user.user_metadata?.first_name || 'Admin',
                  last_name: userAuth.user.user_metadata?.last_name || 'User',
                  user_id: userId  // Also set user_id for consistency
                })
                .select('role')
                .single()

              if (!insertError && newProfile) {
                await logger.logSuccess('admin_profile_manual_created', '🎨 Manually created admin profile', { userId, role: 'super_admin' })
                profile = newProfile
              }
            }
          } catch (manualCreateError) {
            console.log('🌩️ Manual profile creation failed:', manualCreateError)
          }
        }
      }

      if (!profile) {
        await logger.logError({
          type: 'admin_permissions_validation_failed',
          message: '❌ Admin permissions validation failed - no profile found or created',
          severity: 'warning',
          source: 'admin-auth-service',
          requestData: { userId, error }
        })
        return false
      }

      const roleHierarchy: Record<string, number> = { user: 0, admin: 1, super_admin: 2 }
      const hasPermission = roleHierarchy[profile.role] >= roleHierarchy[requiredRole]

      await logger.logSuccess(
        hasPermission ? 'admin_permissions_valid' : 'admin_permissions_denied',
        hasPermission ? '✅ Admin permissions validated' : '🚫 Insufficient admin permissions',
        { userId, requiredRole, userRole: profile.role }
      )

      return hasPermission

    } catch (error) {
      await logger.logError({
        type: 'admin_permissions_error',
        message: '💥 Admin permissions check failed',
        severity: 'error',
        source: 'admin-auth-service',
        requestData: { userId, error }
      })
      return false
    }
  }

  /**
   * 📊 Get all admin users
   * Useful for admin user management dashboard
   */
  async getAllAdminUsers(): Promise<AdminUser[]> {
    try {
      const { data: users, error } = await this.supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      await logger.logSuccess('admin_users_fetched', '📋 Retrieved all admin users', { count: users?.length || 0 })
      return users || []

    } catch (error) {
      await logger.logError({
        type: 'admin_users_fetch_error',
        message: '💥 Failed to fetch admin users',
        severity: 'error',
        source: 'admin-auth-service',
        requestData: { error }
      })
      throw error
    }
  }

  /**
   * 🎨 Update admin user role
   * For role management in admin dashboard
   */
  async updateUserRole(userId: string, newRole: 'admin' | 'super_admin' | 'user'): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('admin_profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      await logger.logSuccess('admin_user_role_updated', '🎭 Admin user role updated', { userId, newRole })

    } catch (error) {
      await logger.logError({
        type: 'admin_user_role_update_error',
        message: '💥 Failed to update admin user role',
        severity: 'error',
        source: 'admin-auth-service',
        requestData: { userId, newRole, error }
      })
      throw error
    }
  }

  /**
   * 🚪 Admin logout utility
   * Properly cleans up admin sessions
   */
  async logoutAdmin(): Promise<void> {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      await logger.logSuccess('admin_logout_success', '👋 Admin user logged out successfully')

    } catch (error) {
      await logger.logError({
        type: 'admin_logout_error',
        message: '💥 Admin logout failed',
        severity: 'warning',
        source: 'admin-auth-service',
        requestData: { error }
      })
      throw error
    }
  }
}

/**
 * 🎭 Singleton instance for easy access
 */
export const adminAuthService = new AdminAuthService()

/**
 * 🎪 Authentication State Manager
 * Manages authentication state across the admin panel
 */
export class AuthStateManager {
  private static instance: AuthStateManager
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null
  }

  private listeners: ((state: AuthState) => void)[] = []

  static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager()
    }
    return AuthStateManager.instance
  }

  /**
   * 📡 Subscribe to authentication state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    listener(this.authState)

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * 🔄 Update authentication state
   */
  private setAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates }
    this.listeners.forEach(listener => listener(this.authState))
  }

  /**
   * 🎭 Initialize authentication state
   */
  async initialize(): Promise<void> {
    try {
      this.setAuthState({ isLoading: true, error: null })

      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        throw error
      }

      if (user) {
        // Validate admin permissions
        const hasPermission = await adminAuthService.validateAdminPermissions(user.id)
        if (hasPermission) {
          const adminProfile = await this.getAdminProfile(user.id)
          this.setAuthState({
            isAuthenticated: true,
            user: adminProfile,
            isLoading: false
          })
          await logger.logSuccess('auth_state_initialized', '🎭 Admin authentication state initialized', { userId: user.id })
        } else {
          this.setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: 'Insufficient admin permissions'
          })
        }
      } else {
        this.setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        })
      }

    } catch (error) {
      this.setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Authentication initialization failed'
      })

      await logger.logError({
        type: 'auth_state_initialization_error',
        message: '💥 Failed to initialize authentication state',
        severity: 'error',
        source: 'auth-state-manager',
        requestData: { error }
      })
    }
  }

  /**
   * 📋 Get admin profile from database
   */
  private async getAdminProfile(userId: string): Promise<AdminUser> {
    const { data: profile, error } = await adminAuthService.supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !profile) {
      throw new Error('Admin profile not found')
    }

    return profile
  }

  /**
   * 🚪 Logout current user
   */
  async logout(): Promise<void> {
    try {
      await adminAuthService.logoutAdmin()
      this.setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null
      })
    } catch (error) {
      this.setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Logout failed'
      })
      throw error
    }
  }

  /**
   * 🎭 Get current authentication state
   */
  getState(): AuthState {
    return { ...this.authState }
  }
}

/**
 * 🎪 Export singleton instance
 */
export const authStateManager = AuthStateManager.getInstance()
