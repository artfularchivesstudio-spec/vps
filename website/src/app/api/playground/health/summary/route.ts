import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SystemHealthSummary } from '@/types/playground';

// Mock data for MCP tools and ChatGPT actions
const MCP_TOOLS = [
  'PostgreSQL',
  'YouTube', 
  'Memory',
  'Time',
  'Filesystem',
  'iOS Simulator',
  'Sequential Thinking'
];

const CHATGPT_ACTIONS = [
  'Document Analysis',
  'Code Review', 
  'Content Generation',
  'Data Processing',
  'API Integration'
];

// Simulate health check for summary data
async function generateMockSummary(): Promise<SystemHealthSummary[]> {
  // Simulate some processing delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate mock summary for MCP tools
  const mcpHealthy = Math.floor(Math.random() * MCP_TOOLS.length);
  const mcpWarning = Math.floor(Math.random() * (MCP_TOOLS.length - mcpHealthy));
  const mcpError = MCP_TOOLS.length - mcpHealthy - mcpWarning;
  
  const mcpSummary: SystemHealthSummary = {
    component_type: 'mcp_tool',
    total_components: MCP_TOOLS.length,
    healthy_count: mcpHealthy,
    warning_count: mcpWarning,
    error_count: mcpError,
    unknown_count: 0,
    avg_response_time_ms: Math.floor(Math.random() * 1000 + 200),
    last_updated: new Date().toISOString()
  };
  
  // Generate mock summary for ChatGPT actions
  const chatgptHealthy = Math.floor(Math.random() * CHATGPT_ACTIONS.length);
  const chatgptWarning = Math.floor(Math.random() * (CHATGPT_ACTIONS.length - chatgptHealthy));
  const chatgptError = CHATGPT_ACTIONS.length - chatgptHealthy - chatgptWarning;
  
  const chatgptSummary: SystemHealthSummary = {
    component_type: 'chatgpt_action',
    total_components: CHATGPT_ACTIONS.length,
    healthy_count: chatgptHealthy,
    warning_count: chatgptWarning,
    error_count: chatgptError,
    unknown_count: 0,
    avg_response_time_ms: Math.floor(Math.random() * 800 + 150),
    last_updated: new Date().toISOString()
  };
  
  return [mcpSummary, chatgptSummary];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if we should return real data from database or mock data
    const useMockData = request.nextUrl.searchParams.get('mock') !== 'false';
    
    if (useMockData) {
      // Generate mock summary data
      const summary = await generateMockSummary();
      
      return NextResponse.json({
        success: true,
        data: {
          summary,
          last_updated: new Date().toISOString(),
          total_components: MCP_TOOLS.length + CHATGPT_ACTIONS.length
        }
      });
    }
    
    // Real database implementation would go here
    const { data: healthData, error } = await supabase
      .from('ai_integration_health')
      .select('component_type, status')
      .order('last_checked_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch health summary' },
        { status: 500 }
      );
    }
    
    // Calculate real summary from database data
    const mcpData = healthData?.filter(h => h.component_type === 'mcp_tool') || [];
    const chatgptData = healthData?.filter(h => h.component_type === 'chatgpt_action') || [];
    
    const mcpSummary: SystemHealthSummary = {
      component_type: 'mcp_tool',
      total_components: mcpData.length,
      healthy_count: mcpData.filter(h => h.status === 'healthy').length,
      warning_count: mcpData.filter(h => h.status === 'warning').length,
      error_count: mcpData.filter(h => h.status === 'error').length,
      unknown_count: mcpData.filter(h => h.status === 'unknown').length,
      avg_response_time_ms: 0, // Would calculate from real data
      last_updated: new Date().toISOString()
    };
    
    const chatgptSummary: SystemHealthSummary = {
      component_type: 'chatgpt_action',
      total_components: chatgptData.length,
      healthy_count: chatgptData.filter(h => h.status === 'healthy').length,
      warning_count: chatgptData.filter(h => h.status === 'warning').length,
      error_count: chatgptData.filter(h => h.status === 'error').length,
      unknown_count: chatgptData.filter(h => h.status === 'unknown').length,
      avg_response_time_ms: 0, // Would calculate from real data
      last_updated: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: {
        summary: [mcpSummary, chatgptSummary],
        last_updated: new Date().toISOString(),
        total_components: healthData?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Health summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}