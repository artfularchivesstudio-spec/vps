import { NextRequest, NextResponse } from 'next/server'
import { adminAuthService } from '@/lib/admin/auth-service'
import { authenticateRequest } from '@/lib/auth/dual-auth'

export async function GET(request: NextRequest) {
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

    // Get all admin users
    const users = await adminAuthService.getAllAdminUsers()

    return NextResponse.json({
      success: true,
      users
    })

  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    )
  }
}
