import { NextRequest, NextResponse } from 'next/server'
import { adminAuthService } from '@/lib/admin/auth-service'
import { authenticateRequest } from '@/lib/auth/dual-auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile for current user
    const { data: profile, error } = await adminAuthService.supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', authResult.user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Admin profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Error fetching admin profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin profile' },
      { status: 500 }
    )
  }
}
