'use client'

import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { clientAdminAuthService, clientAuthStateManager } from '@/lib/admin/auth-client'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, CheckCircle, Eye, EyeOff, Key, Shield, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [attempts, setAttempts] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const state = clientAuthStateManager.getState()
      if (state.isAuthenticated) {
        router.push('/admin')
        return
      }

      // Initialize auth state
      await clientAuthStateManager.initialize()
      const newState = clientAuthStateManager.getState()
      if (newState.isAuthenticated) {
        router.push('/admin')
      }
    }

    checkAuth()
  }, [router])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setAttempts(prev => prev + 1)
        if (attempts >= 2) {
          setError('Too many failed attempts. Please contact administrator.')
        } else {
          setError(error.message)
        }
        return
      }

      // Validate admin permissions
      if (data.user) {
        const hasPermission = await clientAdminAuthService.validateCurrentUserPermissions('admin')
        if (!hasPermission) {
          setError('Access denied. Admin privileges required.')
          await supabase.auth.signOut()
          return
        }

        setSuccess('🎭 Welcome to the Artful Archives Admin Panel!')
        setTimeout(() => {
          router.push('/admin')
          router.refresh()
        }, 1500)
      }

    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getSecurityMessage = () => {
    if (attempts === 0) return null

    if (attempts >= 3) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Multiple failed login attempts detected. Please contact your administrator for assistance.
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Shield className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining before temporary lockout.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Admin Portal</h2>
          <p className="mt-2 text-sm text-gray-600">
            🎭 Welcome to the Artful Archives Administrative Realm
          </p>
        </div>

        {/* Security Alert */}
        {getSecurityMessage()}

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl">Secure Login</CardTitle>
            <CardDescription className="text-center">
              Enter your admin credentials to access the control panel
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Admin Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@artfularchives.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  disabled={loading || attempts >= 3}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="inline h-4 w-4 mr-1" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10"
                    disabled={loading || attempts >= 3}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || attempts >= 3}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || attempts >= 3}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  'Enter Admin Realm'
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                🔐 Secure admin access required. Contact administrator if you need access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}