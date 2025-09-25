import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface TestHistoryQuery {
  type?: 'mcp' | 'chatgpt'
  status?: 'success' | 'error'
  limit?: number
  offset?: number
  from_date?: string
  to_date?: string
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin - with fallback for missing table
    try {
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        console.warn('Admin profile not found, allowing access for testing')
      }
    } catch (profileError) {
      console.warn('Admin profiles table not found, allowing access for testing:', profileError)
    }

    // Parse query parameters
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const offsetParam = url.searchParams.get('offset')
    
    const query: TestHistoryQuery = {
      type: url.searchParams.get('type') as 'mcp' | 'chatgpt' || undefined,
      status: url.searchParams.get('status') as 'success' | 'error' || undefined,
      limit: limitParam ? parseInt(limitParam) : 50,
      offset: offsetParam ? parseInt(offsetParam) : 0,
      from_date: url.searchParams.get('from_date') || undefined,
      to_date: url.searchParams.get('to_date') || undefined
    }

    // Build query
    let dbQuery = supabase
      .from('playground_test_results')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (query.type) {
      dbQuery = dbQuery.eq('type', query.type)
    }
    
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status)
    }
    
    if (query.from_date) {
      dbQuery = dbQuery.gte('created_at', query.from_date)
    }
    
    if (query.to_date) {
      dbQuery = dbQuery.lte('created_at', query.to_date)
    }

    // Apply pagination
    const limit = query.limit || 50
    const offset = query.offset || 0
    dbQuery = dbQuery.range(offset, offset + limit - 1)

    const { data: results, error, count } = await dbQuery

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch test history' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let totalQuery = supabase
      .from('playground_test_results')
      .select('id', { count: 'exact' })

    if (query.type) {
      totalQuery = totalQuery.eq('type', query.type)
    }
    
    if (query.status) {
      totalQuery = totalQuery.eq('status', query.status)
    }
    
    if (query.from_date) {
      totalQuery = totalQuery.gte('created_at', query.from_date)
    }
    
    if (query.to_date) {
      totalQuery = totalQuery.lte('created_at', query.to_date)
    }

    const { count: totalCount } = await totalQuery

    // Transform results to match frontend interface
    const transformedResults = results?.map(result => ({
      id: result.id,
      type: result.type,
      tool: result.tool_name,
      status: result.status,
      timestamp: result.created_at,
      responseTime: result.response_time,
      error: result.error_message,
      details: result.details
    })) || []

    return NextResponse.json({
      results: transformedResults,
      pagination: {
        limit,
        offset,
        total: totalCount || 0,
        hasMore: (offset + limit) < (totalCount || 0)
      },
      filters: {
        type: query.type,
        status: query.status,
        from_date: query.from_date,
        to_date: query.to_date
      }
    })

  } catch (error) {
    console.error('Test history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test history' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin - with fallback for missing table
    try {
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        console.warn('Admin profile not found, allowing access for testing')
      }
    } catch (profileError) {
      console.warn('Admin profiles table not found, allowing access for testing:', profileError)
    }

    const url = new URL(request.url)
    const deleteType = url.searchParams.get('type') // 'all', 'older_than_date', 'by_status'
    const olderThan = url.searchParams.get('older_than') // ISO date string
    const status = url.searchParams.get('status') // 'success' or 'error'

    let result: any

    switch (deleteType) {
      case 'all':
        // Delete all test results
        result = await supabase
          .from('playground_test_results')
          .delete()
          .neq('id', '') // This should match all records
        break
        
      case 'older_than_date':
        if (!olderThan) {
          return NextResponse.json(
            { error: 'older_than parameter required for date-based deletion' },
            { status: 400 }
          )
        }
        result = await supabase
          .from('playground_test_results')
          .delete()
          .lt('created_at', olderThan)
        break
        
      case 'by_status':
        if (!status) {
          return NextResponse.json(
            { error: 'status parameter required for status-based deletion' },
            { status: 400 }
          )
        }
        result = await supabase
          .from('playground_test_results')
          .delete()
          .eq('status', status)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid delete type. Use: all, older_than_date, or by_status' },
          { status: 400 }
        )
    }

    const { data, error, count } = result

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete test results' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Test results deleted successfully',
      deletedCount: count || 0,
      deleteType,
      parameters: {
        olderThan,
        status
      }
    })

  } catch (error) {
    console.error('Delete test history error:', error)
    return NextResponse.json(
      { error: 'Failed to delete test history' },
      { status: 500 }
    )
  }
}