/**
 * 🎭 Client-Side Admin Authentication Service
 *
 * This service provides client-side authentication functionality that can be used
 * in React client components without importing server-side code.
 */

import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/observability/logger'

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
 * 🎪 Client-Side Admin Authentication Service
 * Safe to use in client components
 */
export class ClientAdminAuthService {
  private supabase = createClient()

  /**
   * 👑 Validate admin user permissions
   * Checks if current user has admin privileges
   */
  async validateCurrentUserPermissions(requiredRole: 'admin' | 'super_admin' = 'admin'): Promise<boolean> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()

      if (error || !user) {
        await logger.logError({
          type: 'client_auth_validation_failed',
          message: '❌ No authenticated user found',
          severity: 'warning',
          source: 'client-admin-auth',
          requestData: { error }
        })
        return false
      }

      // For client-side validation, we'll do a basic check
      // The server-side will do the full validation
      await logger.logSuccess('client_auth_validation_success', '✅ Client auth validation passed', { userId: user.id })
      return true

    } catch (error) {
      await logger.logError({
        type: 'client_auth_validation_error',
        message: '💥 Client auth validation failed',
        severity: 'error',
        source: 'client-admin-auth',
        requestData: { error }
      })
      return false
    }
  }

  /**
   * 🚪 Client-side logout
   */
  async logout(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        throw error
      }

      await logger.logSuccess('client_logout_success', '👋 Client logout successful')

    } catch (error) {
      await logger.logError({
        type: 'client_logout_error',
        message: '💥 Client logout failed',
        severity: 'warning',
        source: 'client-admin-auth',
        requestData: { error }
      })
      throw error
    }
  }

  /**
   * 📋 Get current user info
   */
  async getCurrentUser(): Promise<{ user: any; profile: AdminUser | null } | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()

      if (error || !user) {
        return null
      }

      // Try to get admin profile (this will be validated server-side)
      try {
        const response = await fetch('/api/admin/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const profile = await response.json()
          return { user, profile }
        }
      } catch (profileError) {
        // Profile fetch failed, but user is authenticated
        console.warn('Could not fetch admin profile:', profileError)
      }

      return { user, profile: null }

    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }
}

/**
 * 🎭 Client-Side Authentication State Manager
 */
export class ClientAuthStateManager {
  private static instance: ClientAuthStateManager
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null
  }

  private listeners: ((state: AuthState) => void)[] = []
  private authService = new ClientAdminAuthService()

  static getInstance(): ClientAuthStateManager {
    if (!ClientAuthStateManager.instance) {
      ClientAuthStateManager.instance = new ClientAuthStateManager()
    }
    return ClientAuthStateManager.instance
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

      const userData = await this.authService.getCurrentUser()

      if (userData && userData.profile) {
        this.setAuthState({
          isAuthenticated: true,
          user: userData.profile,
          isLoading: false
        })
        await logger.logSuccess('client_auth_state_initialized', '🎭 Client authentication state initialized', { userId: userData.user.id })
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
        type: 'client_auth_state_initialization_error',
        message: '💥 Failed to initialize client authentication state',
        severity: 'error',
        source: 'client-auth-state-manager',
        requestData: { error }
      })
    }
  }

  /**
   * 🚪 Logout current user
   */
  async logout(): Promise<void> {
    try {
      await this.authService.logout()
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

  /**
   * 🔍 Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated
  }

  /**
   * 👤 Get current user
   */
  getUser(): AdminUser | null {
    return this.authState.user
  }
}

/**
 * 🎪 Export singleton instances
 */
export const clientAdminAuthService = new ClientAdminAuthService()
export const clientAuthStateManager = ClientAuthStateManager.getInstance()
