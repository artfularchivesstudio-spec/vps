'use client'

import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
// Using inline modal approach instead of Dialog component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { type AdminUser } from '@/lib/admin/auth-client'
import {
    AlertTriangle,
    CheckCircle,
    Crown,
    Edit,
    RefreshCw,
    Shield,
    Trash2,
    UserPlus,
    Users
} from 'lucide-react'
import { useEffect, useState } from 'react'

export function AdminUserManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Form states
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    role: 'admin' as 'admin' | 'super_admin',
    firstName: '',
    lastName: '',
    password: '',
    showPassword: false
  })

  const [editUserForm, setEditUserForm] = useState({
    role: 'admin' as 'admin' | 'super_admin'
  })

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Load admin users
  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch admin users')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError('Failed to load admin users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Create new admin user
  const handleCreateUser = async () => {
    try {
      setError('')
      setSuccess('')

      if (!newUserForm.email || !newUserForm.password) {
        setError('Email and password are required')
        return
      }

      // Note: In a real implementation, this would call an API endpoint
      // For now, we'll show a message about using the CLI script
      setSuccess('🎭 Use the admin user creation script for security!')
      setShowCreateDialog(false)

      // Reset form
      setNewUserForm({
        email: '',
        role: 'admin',
        firstName: '',
        lastName: '',
        password: '',
        showPassword: false
      })

    } catch (err) {
      setError('Failed to create admin user')
    }
  }

  // Update user role
  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newRole: editUserForm.role
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user role')
      }

      setSuccess('🎭 User role updated successfully!')
      setShowEditDialog(false)
      setSelectedUser(null)

      // Reload users
      await loadUsers()

    } catch (err) {
      setError('Failed to update user role')
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setError('')
      setSuccess('')

      // Note: In a real implementation, this would call an API endpoint
      setError('⚠️ User deletion should be done via CLI for security')
      setShowDeleteDialog(false)
      setSelectedUser(null)

    } catch (err) {
      setError('Failed to delete user')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🎭 Admin User Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage admin users, roles, and permissions
          </p>
        </div>

        <div className="flex space-x-3">
          <Button onClick={loadUsers} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Admin User
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Admin Users ({users.length})
          </CardTitle>
          <CardDescription>
            Current administrators with access to the admin panel
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No admin users found</p>
              <p className="text-sm text-gray-500 mt-1">
                Create your first admin user using the CLI script
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getRoleIcon(user.role)}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.email
                          }
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                        {user.last_login && ` • Last login: ${new Date(user.last_login).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setEditUserForm({ role: user.role as 'admin' | 'super_admin' })
                        setShowEditModal(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedUser(user)
                        setShowDeleteModal(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service User Info */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Service User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <p>
              🔧 <strong>Service User:</strong> Use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">service@artfularchives.com</code> for automated operations
            </p>
            <p>
              🔑 <strong>API Operations:</strong> Service user bypasses RLS for admin API endpoints
            </p>
            <p>
              🛡️ <strong>Security:</strong> Consider using API keys for production automated tasks
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inline Modals */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Admin User</h3>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                🔐 For security reasons, admin user creation should be done via the CLI script.
                Run: <code className="bg-gray-100 px-1 rounded">node scripts/create-admin-user.js</code>
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Edit User Role</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Change the role for {selectedUser.email}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Role
              </label>
              <Select
                value={editUserForm.role}
                onChange={(e) =>
                  setEditUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'super_admin' }))
                }
              >
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </Select>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Update Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Admin User</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete {selectedUser.email}? This action cannot be undone.
            </p>

            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                ⚠️ This will permanently remove the user and all their admin privileges.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
