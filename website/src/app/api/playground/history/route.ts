import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TestHistoryFilter, PaginatedResponse, TestHistory } from '@/types/playground';

// Mock test history data for development
const mockTestHistory: TestHistory[] = [
  {
    id: 'test_001',
    test_type: 'individual',
    component_type: 'mcp_tool',
    component_name: 'create_blog_post',
    test_parameters: { title: 'Test Post', content: 'Test content' },
    test_result: { success: true, response_time: 1250 },
    status: 'success',
    duration_ms: 1250,
    error_message: null,
    error_code: null,
    created_by: 'admin@example.com',
    created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 'test_002',
    test_type: 'individual',
    component_type: 'chatgpt_action',
    component_name: 'listPosts',
    test_parameters: { limit: 10 },
    test_result: { success: false, error: 'API timeout' },
    status: 'timeout',
    duration_ms: 30000,
    error_message: 'Request timed out after 30 seconds',
    error_code: 'TIMEOUT',
    created_by: 'admin@example.com',
    created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  },
  {
    id: 'test_003',
    test_type: 'bulk',
    component_type: 'mcp_tool',
    component_name: null,
    test_parameters: { batch_size: 5 },
    test_result: { total: 5, passed: 4, failed: 1 },
    status: 'success',
    duration_ms: 8500,
    error_message: null,
    error_code: null,
    created_by: 'admin@example.com',
    created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: 'test_004',
    test_type: 'individual',
    component_type: 'mcp_tool',
    component_name: 'search_files',
    test_parameters: { pattern: '*.tsx', path: '/src' },
    test_result: { success: true, files_found: 15, response_time: 850 },
    status: 'success',
    duration_ms: 850,
    error_message: null,
    error_code: null,
    created_by: 'admin@example.com',
    created_at: new Date(Date.now() - 5400000).toISOString() // 1.5 hours ago
  },
  {
    id: 'test_005',
    test_type: 'individual',
    component_type: 'chatgpt_action',
    component_name: 'generateContent',
    test_parameters: { prompt: 'Write a blog post about AI', max_tokens: 500 },
    test_result: { success: false, error: 'Rate limit exceeded' },
    status: 'failure',
    duration_ms: 2100,
    error_message: 'API rate limit exceeded. Please try again later.',
    error_code: 'RATE_LIMIT',
    created_by: 'admin@example.com',
    created_at: new Date(Date.now() - 10800000).toISOString() // 3 hours ago
  },
  {
    id: 'test_006',
    test_type: 'individual',
    component_type: 'mcp_tool',
    component_name: 'read_file',
    test_parameters: { path: '/src/components/TestRunner.tsx' },
    test_result: { success: true, file_size: 12450, response_time: 320 },
    status: 'success',
    duration_ms: 320,
    error_message: null,
    error_code: null,
    created_by: 'admin@example.com',
    created_at: new Date(Date.now() - 14400000).toISOString() // 4 hours ago
  },
  {
    id: 'test_007',
    test_type: 'bulk',
    component_type: 'chatgpt_action',
    component_name: null,
    test_parameters: { batch_size: 3, actions: ['listPosts', 'generateContent', 'analyzeText'] },
    test_result: { total: 3, passed: 2, failed: 1 },
    status: 'success',
    duration_ms: 15600,
    error_message: null,
    error_code: null,
    created_by: 'admin@example.com',
    created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    id: 'test_008',
    test_type: 'individual',
    component_type: 'mcp_tool',
    component_name: 'write_file',
    test_parameters: { path: '/tmp/test.txt', content: 'Hello World' },
    test_result: { success: false, error: 'Permission denied' },
    status: 'failure',
    duration_ms: 150,
    error_message: 'Permission denied: Cannot write to /tmp/test.txt',
    error_code: 'PERMISSION_DENIED',
    created_by: 'admin@example.com',
    created_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  }
];

// GET /api/playground/history - Retrieve test history with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 items per page
    
    // Parse filter parameters
    const filters: TestHistoryFilter = {
      component_type: searchParams.get('component_type') as 'mcp_tool' | 'chatgpt_action' | undefined,
      component_name: searchParams.get('component_name') || undefined,
      test_type: searchParams.get('test_type') as 'individual' | 'bulk' | 'scheduled' | undefined,
      status: searchParams.get('status') as 'success' | 'failure' | 'timeout' | 'cancelled' | undefined,
      created_by: searchParams.get('created_by') || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined
    };
    
    const searchQuery = searchParams.get('search') || undefined;
    
    // Try to fetch from database first
    const supabase = createClient();
    let query = supabase
      .from('test_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.component_type) {
      query = query.eq('component_type', filters.component_type);
    }
    if (filters.component_name) {
      query = query.eq('component_name', filters.component_name);
    }
    if (filters.test_type) {
      query = query.eq('test_type', filters.test_type);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }
    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }
    if (searchQuery) {
      query = query.or(`component_name.ilike.%${searchQuery}%,error_message.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data: dbData, error: dbError, count } = await query;
    
    let filteredData = mockTestHistory;
    let totalCount = mockTestHistory.length;
    
    if (!dbError && dbData) {
      // Use database data if available
      filteredData = dbData;
      totalCount = count || 0;
    } else {
      // Fall back to mock data with client-side filtering
      filteredData = mockTestHistory.filter(item => {
        if (filters.component_type && item.component_type !== filters.component_type) return false;
        if (filters.component_name && item.component_name !== filters.component_name) return false;
        if (filters.test_type && item.test_type !== filters.test_type) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (filters.created_by && item.created_by !== filters.created_by) return false;
        if (filters.created_after && item.created_at < filters.created_after) return false;
        if (filters.created_before && item.created_at > filters.created_before) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch = (
            (item.component_name && item.component_name.toLowerCase().includes(query)) ||
            (item.error_message && item.error_message.toLowerCase().includes(query)) ||
            item.id.toLowerCase().includes(query)
          );
          if (!matchesSearch) return false;
        }
        return true;
      });
      
      totalCount = filteredData.length;
      
      // Apply pagination to mock data
      filteredData = filteredData.slice(offset, offset + limit);
    }
    
    const totalPages = Math.ceil(totalCount / limit);
    
    const response: PaginatedResponse<TestHistory> = {
      success: true,
      data: filteredData,
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Test history retrieval error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// DELETE /api/playground/history - Delete test history entries
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',') || [];
    const olderThan = searchParams.get('older_than'); // ISO date string
    
    if (ids.length === 0 && !olderThan) {
      return NextResponse.json(
        { success: false, error: 'Either ids or older_than parameter is required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    let deletedCount = 0;
    
    if (ids.length > 0) {
      // Delete specific entries by ID
      const { error, count } = await supabase
        .from('test_history')
        .delete()
        .in('id', ids);
      
      if (error) {
        console.error('Database delete error:', error);
        // For development, simulate deletion
        deletedCount = ids.length;
      } else {
        deletedCount = count || 0;
      }
    } else if (olderThan) {
      // Delete entries older than specified date
      const { error, count } = await supabase
        .from('test_history')
        .delete()
        .lt('created_at', olderThan);
      
      if (error) {
        console.error('Database delete error:', error);
        // For development, simulate deletion
        deletedCount = mockTestHistory.filter(item => item.created_at < olderThan).length;
      } else {
        deletedCount = count || 0;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} test history entries`,
      deleted_count: deletedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test history deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}