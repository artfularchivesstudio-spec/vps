import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PerformanceMetrics, PerformanceTrends, SystemHealthSummary } from '@/types/playground';

// Extended interfaces for API responses
interface MetricsSummary {
  total_tests: number;
  successful_tests: number;
  failed_tests: number;
  success_rate: number;
  average_response_time: number;
  total_uptime_hours: number;
  last_updated: string;
  period_start: string;
  period_end: string;
}

interface TrendDataPoint {
  timestamp: string;
  success_rate: number;
  average_response_time: number;
  total_tests: number;
  error_rate: number;
}

interface TrendsResponse {
  period: string;
  data_points: TrendDataPoint[];
  summary: {
    avg_success_rate: number;
    avg_response_time: number;
    total_tests: number;
    peak_response_time: number;
    lowest_success_rate: number;
  };
}

interface HealthSummaryResponse {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  total_components: number;
  healthy_components: number;
  degraded_components: number;
  failed_components: number;
  last_health_check: string;
  component_breakdown: {
    mcp_tools: {
      total: number;
      healthy: number;
      degraded: number;
      failed: number;
    };
    chatgpt_actions: {
      total: number;
      healthy: number;
      degraded: number;
      failed: number;
    };
  };
  recent_issues: {
    component_name: string;
    component_type: 'mcp_tool' | 'chatgpt_action';
    issue: string;
    severity: 'warning' | 'critical';
    first_detected: string;
    status: 'investigating' | 'monitoring';
  }[];
}

// Mock performance data for development
const generateMockMetrics = (): MetricsSummary => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return {
    total_tests: 1247,
    successful_tests: 1089,
    failed_tests: 158,
    success_rate: 87.3,
    average_response_time: 1850,
    total_uptime_hours: 720.5,
    last_updated: now.toISOString(),
    period_start: last24Hours.toISOString(),
    period_end: now.toISOString()
  };
};

const generateMockTrends = (): TrendsResponse => {
  const now = new Date();
  const trends: TrendDataPoint[] = [];
  
  // Generate hourly data for the last 24 hours
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    trends.push({
      timestamp: timestamp.toISOString(),
      success_rate: Math.random() * 20 + 80, // 80-100%
      average_response_time: Math.random() * 1000 + 1000, // 1000-2000ms
      total_tests: Math.floor(Math.random() * 50 + 10), // 10-60 tests
      error_rate: Math.random() * 15 + 5 // 5-20%
    });
  }
  
  return {
    period: '24h',
    data_points: trends,
    summary: {
      avg_success_rate: trends.reduce((sum, t) => sum + t.success_rate, 0) / trends.length,
      avg_response_time: trends.reduce((sum, t) => sum + t.average_response_time, 0) / trends.length,
      total_tests: trends.reduce((sum, t) => sum + t.total_tests, 0),
      peak_response_time: Math.max(...trends.map(t => t.average_response_time)),
      lowest_success_rate: Math.min(...trends.map(t => t.success_rate))
    }
  };
};

const generateMockHealthSummary = (): HealthSummaryResponse => {
  const mcpTools = [
    'create_blog_post', 'update_blog_post', 'delete_blog_post',
    'create_user', 'update_user', 'list_users', 'search_content'
  ];
  
  const chatgptActions = [
    'generateContent', 'summarizeText', 'translateText',
    'analyzeContent', 'listPosts'
  ];
  
  return {
    overall_status: 'healthy',
    total_components: 12,
    healthy_components: 10,
    degraded_components: 2,
    failed_components: 0,
    last_health_check: new Date().toISOString(),
    component_breakdown: {
      mcp_tools: {
        total: mcpTools.length,
        healthy: 6,
        degraded: 1,
        failed: 0
      },
      chatgpt_actions: {
        total: chatgptActions.length,
        healthy: 4,
        degraded: 1,
        failed: 0
      }
    },
    recent_issues: [
      {
        component_name: 'search_content',
        component_type: 'mcp_tool',
        issue: 'High response times detected',
        severity: 'warning',
        first_detected: new Date(Date.now() - 3600000).toISOString(),
        status: 'investigating'
      },
      {
        component_name: 'translateText',
        component_type: 'chatgpt_action',
        issue: 'Intermittent timeouts',
        severity: 'warning',
        first_detected: new Date(Date.now() - 7200000).toISOString(),
        status: 'monitoring'
      }
    ]
  };
};

// GET /api/playground/metrics - Retrieve performance metrics and trends
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary'; // summary, trends, health
    const period = searchParams.get('period') || '24h'; // 1h, 24h, 7d, 30d
    
    const supabase = createClient();
    
    switch (type) {
      case 'summary': {
        // Try to get real metrics from database
        const { data: testData, error: testError } = await supabase
          .from('test_history')
          .select('status, duration_ms, created_at')
          .gte('created_at', new Date(Date.now() - getPeriodMs(period)).toISOString());
        
        let metrics: MetricsSummary;
        
        if (!testError && testData && testData.length > 0) {
          // Calculate real metrics from database
          const totalTests = testData.length;
          const successfulTests = testData.filter(t => t.status === 'success').length;
          const failedTests = totalTests - successfulTests;
          const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;
          const avgResponseTime = testData.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / totalTests;
          
          metrics = {
            total_tests: totalTests,
            successful_tests: successfulTests,
            failed_tests: failedTests,
            success_rate: Math.round(successRate * 10) / 10,
            average_response_time: Math.round(avgResponseTime),
            total_uptime_hours: 720.5, // This would come from system monitoring
            last_updated: new Date().toISOString(),
            period_start: new Date(Date.now() - getPeriodMs(period)).toISOString(),
            period_end: new Date().toISOString()
          };
        } else {
          // Use mock data
          metrics = generateMockMetrics();
        }
        
        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });
      }
      
      case 'trends': {
        // Try to get trend data from database
        const { data: trendData, error: trendError } = await supabase
          .from('test_history')
          .select('status, duration_ms, created_at')
          .gte('created_at', new Date(Date.now() - getPeriodMs(period)).toISOString())
          .order('created_at', { ascending: true });
        
        let trends: TrendsResponse;
        
        if (!trendError && trendData && trendData.length > 0) {
          // Process real trend data
          trends = processTrendData(trendData, period);
        } else {
          // Use mock data
          trends = generateMockTrends();
        }
        
        return NextResponse.json({
          success: true,
          data: trends,
          timestamp: new Date().toISOString()
        });
      }
      
      case 'health': {
        // Try to get health data from database
        const { data: healthData, error: healthError } = await supabase
          .from('ai_integration_health')
          .select('*')
          .order('updated_at', { ascending: false });
        
        let healthSummary: HealthSummaryResponse;
        
        if (!healthError && healthData && healthData.length > 0) {
          // Process real health data
          healthSummary = processHealthData(healthData);
        } else {
          // Use mock data
          healthSummary = generateMockHealthSummary();
        }
        
        return NextResponse.json({
          success: true,
          data: healthSummary,
          timestamp: new Date().toISOString()
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid metrics type' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Metrics retrieval error:', error);
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

// Helper function to convert period string to milliseconds
function getPeriodMs(period: string): number {
  switch (period) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

// Helper function to process trend data from database
function processTrendData(data: any[], period: string): TrendsResponse {
  const intervalMs = period === '1h' ? 5 * 60 * 1000 : // 5 min intervals for 1h
                    period === '24h' ? 60 * 60 * 1000 : // 1 hour intervals for 24h
                    period === '7d' ? 6 * 60 * 60 * 1000 : // 6 hour intervals for 7d
                    24 * 60 * 60 * 1000; // 1 day intervals for 30d
  
  const now = Date.now();
  const startTime = now - getPeriodMs(period);
  const intervals = Math.ceil(getPeriodMs(period) / intervalMs);
  
  const dataPoints: TrendDataPoint[] = [];
  
  for (let i = 0; i < intervals; i++) {
    const intervalStart = startTime + i * intervalMs;
    const intervalEnd = intervalStart + intervalMs;
    
    const intervalData = data.filter(d => {
      const timestamp = new Date(d.created_at).getTime();
      return timestamp >= intervalStart && timestamp < intervalEnd;
    });
    
    if (intervalData.length > 0) {
      const successCount = intervalData.filter(d => d.status === 'success').length;
      const successRate = (successCount / intervalData.length) * 100;
      const avgResponseTime = intervalData.reduce((sum, d) => sum + (d.duration_ms || 0), 0) / intervalData.length;
      const errorRate = ((intervalData.length - successCount) / intervalData.length) * 100;
      
      dataPoints.push({
        timestamp: new Date(intervalStart).toISOString(),
        success_rate: Math.round(successRate * 10) / 10,
        average_response_time: Math.round(avgResponseTime),
        total_tests: intervalData.length,
        error_rate: Math.round(errorRate * 10) / 10
      });
    }
  }
  
  return {
    period,
    data_points: dataPoints,
    summary: {
      avg_success_rate: dataPoints.reduce((sum, d) => sum + d.success_rate, 0) / dataPoints.length,
      avg_response_time: dataPoints.reduce((sum, d) => sum + d.average_response_time, 0) / dataPoints.length,
      total_tests: dataPoints.reduce((sum, d) => sum + d.total_tests, 0),
      peak_response_time: Math.max(...dataPoints.map(d => d.average_response_time)),
      lowest_success_rate: Math.min(...dataPoints.map(d => d.success_rate))
    }
  };
}

// Helper function to process health data from database
function processHealthData(data: any[]): HealthSummaryResponse {
  const totalComponents = data.length;
  const healthyComponents = data.filter(d => d.status === 'healthy').length;
  const degradedComponents = data.filter(d => d.status === 'degraded').length;
  const failedComponents = data.filter(d => d.status === 'unhealthy').length;
  
  const mcpTools = data.filter(d => d.component_type === 'mcp_tool');
  const chatgptActions = data.filter(d => d.component_type === 'chatgpt_action');
  
  const overallStatus = failedComponents > 0 ? 'unhealthy' :
                       degradedComponents > 0 ? 'degraded' : 'healthy';
  
  return {
    overall_status: overallStatus,
    total_components: totalComponents,
    healthy_components: healthyComponents,
    degraded_components: degradedComponents,
    failed_components: failedComponents,
    last_health_check: new Date().toISOString(),
    component_breakdown: {
      mcp_tools: {
        total: mcpTools.length,
        healthy: mcpTools.filter(d => d.status === 'healthy').length,
        degraded: mcpTools.filter(d => d.status === 'degraded').length,
        failed: mcpTools.filter(d => d.status === 'unhealthy').length
      },
      chatgpt_actions: {
        total: chatgptActions.length,
        healthy: chatgptActions.filter(d => d.status === 'healthy').length,
        degraded: chatgptActions.filter(d => d.status === 'degraded').length,
        failed: chatgptActions.filter(d => d.status === 'unhealthy').length
      }
    },
    recent_issues: data
      .filter(d => d.status !== 'healthy')
      .slice(0, 5)
      .map(d => ({
        component_name: d.component_name,
        component_type: d.component_type,
        issue: d.error_message || 'Component degraded',
        severity: d.status === 'unhealthy' ? 'critical' as const : 'warning' as const,
        first_detected: d.updated_at,
        status: 'investigating' as const
      }))
  };
}