import { NextRequest, NextResponse } from 'next/server'
import { adminAuthService } from '@/lib/admin/auth-service'
import { authenticateRequest } from '@/lib/auth/dual-auth'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has super admin permissions
    const hasPermission = await adminAuthService.validateAdminPermissions(
      authResult.user?.id || '',
      'super_admin'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const { userId, newRole } = body

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and newRole' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'super_admin', 'user'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: admin, super_admin, or user' },
        { status: 400 }
      )
    }

    // Update user role
    await adminAuthService.updateUserRole(userId, newRole)

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully'
    })

  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}
