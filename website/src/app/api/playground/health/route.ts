import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIIntegrationHealth, SystemHealthSummary } from '@/types/playground';
import { performAllHealthChecks, checkMCPToolHealth, checkChatGPTActionHealth } from '@/lib/health-checker';

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

// Simulate health check for a component
async function checkComponentHealth(componentName: string, componentType: 'mcp_tool' | 'chatgpt_action'): Promise<AIIntegrationHealth> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
  
  // Simulate different health statuses
  const statuses: ('healthy' | 'warning' | 'error')[] = ['healthy', 'healthy', 'healthy', 'warning', 'error'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const now = new Date().toISOString();
  const baseHealth: AIIntegrationHealth = {
    id: `${componentType}_${componentName.toLowerCase().replace(/\s+/g, '_')}`,
    component_name: componentName,
    component_type: componentType,
    status,
    last_checked_at: now,
    response_time_ms: Math.floor(Math.random() * 2000 + 100),
    error_message: status === 'error' ? `Connection timeout for ${componentName}` : null,
    error_code: status === 'error' ? 'TIMEOUT' : null,
    created_at: now,
    updated_at: now,
    metadata: {
      version: '1.0.0',
      last_successful_test: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      total_requests: Math.floor(Math.random() * 1000 + 100)
    }
  };
  
  return baseHealth;
}

// GET /api/playground/health - Get current health status of all components
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if we should return real data or mock data
    const useMockData = request.nextUrl.searchParams.get('mock') === 'true';
    const useRealHealthChecks = request.nextUrl.searchParams.get('real') === 'true';
    
    if (useRealHealthChecks) {
      // Perform real health checks
      console.log('Performing real health checks...');
      const allHealth = await performAllHealthChecks();
      
      // Save results to database (optional, continue on error)
      try {
        const { error } = await supabase
          .from('ai_integration_health')
          .upsert(allHealth, {
            onConflict: 'component_name,component_type'
          });
        
        if (error) {
          console.warn('Failed to save health data to database:', error);
        }
      } catch (dbError) {
        console.warn('Database operation failed:', dbError);
      }
      
      // Generate system health summary from real data
      const mcpHealth = allHealth.filter(h => h.component_type === 'mcp_tool');
      const chatgptHealth = allHealth.filter(h => h.component_type === 'chatgpt_action');
      
      const mcpSummary: SystemHealthSummary = {
        component_type: 'mcp_tool',
        total_components: mcpHealth.length,
        healthy_count: mcpHealth.filter(h => h.status === 'healthy').length,
        warning_count: mcpHealth.filter(h => h.status === 'warning').length,
        error_count: mcpHealth.filter(h => h.status === 'error').length,
        unknown_count: 0,
        avg_response_time_ms: mcpHealth.length > 0 ? Math.floor(mcpHealth.reduce((sum, h) => sum + (h.response_time_ms || 0), 0) / mcpHealth.length) : 0,
        last_updated: new Date().toISOString()
      };
      
      const chatgptSummary: SystemHealthSummary = {
        component_type: 'chatgpt_action',
        total_components: chatgptHealth.length,
        healthy_count: chatgptHealth.filter(h => h.status === 'healthy').length,
        warning_count: chatgptHealth.filter(h => h.status === 'warning').length,
        error_count: chatgptHealth.filter(h => h.status === 'error').length,
        unknown_count: 0,
        avg_response_time_ms: chatgptHealth.length > 0 ? Math.floor(chatgptHealth.reduce((sum, h) => sum + (h.response_time_ms || 0), 0) / chatgptHealth.length) : 0,
        last_updated: new Date().toISOString()
      };
      
      return NextResponse.json({
        success: true,
        data: {
          health_data: allHealth,
          summary: [mcpSummary, chatgptSummary],
          last_updated: new Date().toISOString(),
          total_components: allHealth.length
        }
      });
    }
    
    if (useMockData) {
      // Generate mock health data
      const mcpHealthPromises = MCP_TOOLS.map(tool => checkComponentHealth(tool, 'mcp_tool'));
      const chatgptHealthPromises = CHATGPT_ACTIONS.map(action => checkComponentHealth(action, 'chatgpt_action'));
      
      const [mcpHealth, chatgptHealth] = await Promise.all([
        Promise.all(mcpHealthPromises),
        Promise.all(chatgptHealthPromises)
      ]);
      
      const allHealth = [...mcpHealth, ...chatgptHealth];
      
      // Generate system health summary
      const mcpSummary: SystemHealthSummary = {
        component_type: 'mcp_tool',
        total_components: mcpHealth.length,
        healthy_count: mcpHealth.filter(h => h.status === 'healthy').length,
        warning_count: mcpHealth.filter(h => h.status === 'warning').length,
        error_count: mcpHealth.filter(h => h.status === 'error').length,
        unknown_count: 0,
        avg_response_time_ms: Math.floor(mcpHealth.reduce((sum, h) => sum + (h.response_time_ms || 0), 0) / mcpHealth.length),
        last_updated: new Date().toISOString()
      };
      
      const chatgptSummary: SystemHealthSummary = {
        component_type: 'chatgpt_action',
        total_components: chatgptHealth.length,
        healthy_count: chatgptHealth.filter(h => h.status === 'healthy').length,
        warning_count: chatgptHealth.filter(h => h.status === 'warning').length,
        error_count: chatgptHealth.filter(h => h.status === 'error').length,
        unknown_count: 0,
        avg_response_time_ms: Math.floor(chatgptHealth.reduce((sum, h) => sum + (h.response_time_ms || 0), 0) / chatgptHealth.length),
        last_updated: new Date().toISOString()
      };
      
      return NextResponse.json({
        success: true,
        data: {
          health_data: allHealth,
          summary: [mcpSummary, chatgptSummary],
          last_updated: new Date().toISOString(),
          total_components: allHealth.length
        }
      });
    }
    
    // Real database implementation would go here
    const { data: healthData, error } = await supabase
      .from('ai_integration_health')
      .select('*')
      .order('last_checked_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch health data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        health_data: healthData || [],
        summary: [], // Would calculate from real data
        last_updated: new Date().toISOString(),
        total_components: healthData?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/playground/health - Trigger health check for specific component
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { component_name, component_type } = body;
    
    if (!component_name || !component_type) {
      return NextResponse.json(
        { success: false, error: 'component_name and component_type are required' },
        { status: 400 }
      );
    }
    
    // Perform real health check based on component type
    let healthResult: AIIntegrationHealth;
    
    if (component_type === 'mcp_tool') {
      healthResult = await checkMCPToolHealth(component_name);
    } else if (component_type === 'chatgpt_action') {
      healthResult = await checkChatGPTActionHealth(component_name);
    } else {
      // Fallback to mock health check
      healthResult = await checkComponentHealth(component_name, component_type);
    }
    
    // Save to database (optional, continue on error)
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('ai_integration_health')
        .upsert(healthResult, {
          onConflict: 'component_name,component_type'
        });
      
      if (error) {
        console.warn('Failed to save health check result to database:', error);
      }
    } catch (dbError) {
      console.warn('Database operation failed:', dbError);
    }
    
    return NextResponse.json({
      success: true,
      data: healthResult
    });
    
  } catch (error) {
    console.error('Health check trigger error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}