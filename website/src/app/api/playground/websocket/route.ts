import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebSocketMessage, HealthUpdateMessage, TestResultMessage, AlertMessage, MetricsUpdateMessage } from '@/types/playground';

// WebSocket connection management
const connections = new Map<string, WebSocket>();
const subscriptions = new Map<string, Set<WebSocketMessage['type']>>();

// Mock WebSocket message generator for development
function generateMockMessage(type: WebSocketMessage['type']): WebSocketMessage {
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'health_update':
      return {
        type: 'health_update',
        timestamp,
        data: {
          component_type: Math.random() > 0.5 ? 'mcp_tool' : 'chatgpt_action',
          component_name: Math.random() > 0.5 ? 'create_blog_post' : 'listPosts',
          status: ['healthy', 'warning', 'error'][Math.floor(Math.random() * 3)] as any,
          response_time_ms: Math.floor(Math.random() * 3000 + 500),
          error_message: Math.random() > 0.7 ? 'Connection timeout' : null
        }
      } as HealthUpdateMessage;
    
    case 'test_result':
      return {
        type: 'test_result',
        timestamp,
        data: {
          test_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          component_type: Math.random() > 0.5 ? 'mcp_tool' : 'chatgpt_action',
          component_name: Math.random() > 0.5 ? 'create_blog_post' : 'listPosts',
          status: ['success', 'failure', 'timeout'][Math.floor(Math.random() * 3)] as any,
          duration_ms: Math.floor(Math.random() * 5000 + 100),
          response_data: { success: Math.random() > 0.3 },
          error_message: Math.random() > 0.7 ? 'Test execution failed' : undefined,
          error_code: Math.random() > 0.7 ? 'EXECUTION_ERROR' : undefined,
          timestamp
        }
      } as TestResultMessage;
    
    case 'alert':
      return {
        type: 'alert',
        timestamp,
        data: {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          alert_type: ['health_check_failed', 'performance_degraded', 'service_down'][Math.floor(Math.random() * 3)] as any,
          component_type: Math.random() > 0.5 ? 'mcp_tool' : 'chatgpt_action',
          component_name: Math.random() > 0.5 ? 'create_blog_post' : 'listPosts',
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          message: 'Component health check failed',
          metadata: { retry_count: Math.floor(Math.random() * 3) },
          acknowledged: false,
          acknowledged_by: null,
          acknowledged_at: null,
          resolved: false,
          resolved_at: null,
          created_at: timestamp
        }
      } as AlertMessage;
    
    case 'metrics_update':
      return {
        type: 'metrics_update',
        timestamp,
        data: {
          component_type: Math.random() > 0.5 ? 'mcp_tool' : 'chatgpt_action',
          component_name: Math.random() > 0.5 ? 'create_blog_post' : 'listPosts',
          metrics: [
            {
              id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              component_type: Math.random() > 0.5 ? 'mcp_tool' : 'chatgpt_action',
              component_name: Math.random() > 0.5 ? 'create_blog_post' : 'listPosts',
              metric_type: ['response_time', 'success_rate', 'error_rate'][Math.floor(Math.random() * 3)] as any,
              metric_value: Math.random() * 100,
              time_window: '1h' as any,
              recorded_at: timestamp,
              created_at: timestamp
            }
          ]
        }
      } as MetricsUpdateMessage;
    
    default:
      return {
        type: 'health_update',
        timestamp,
        data: {}
      };
  }
}

// GET /api/playground/websocket - WebSocket connection info
export async function GET(request: NextRequest) {
  try {
    const connectionCount = connections.size;
    const activeSubscriptions = Array.from(subscriptions.entries()).map(([connectionId, types]) => ({
      connection_id: connectionId,
      subscribed_types: Array.from(types)
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        active_connections: connectionCount,
        subscriptions: activeSubscriptions,
        supported_message_types: ['health_update', 'test_result', 'alert', 'metrics_update'],
        connection_info: {
          endpoint: '/api/playground/websocket',
          protocol: 'ws',
          heartbeat_interval: 30000,
          max_connections: 100
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('WebSocket info error:', error);
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

// POST /api/playground/websocket - Send test message or manage subscriptions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, connection_id, message_type, data } = body;
    
    switch (action) {
      case 'subscribe': {
        if (!connection_id || !message_type) {
          return NextResponse.json(
            { success: false, error: 'connection_id and message_type are required' },
            { status: 400 }
          );
        }
        
        if (!subscriptions.has(connection_id)) {
          subscriptions.set(connection_id, new Set());
        }
        
        subscriptions.get(connection_id)!.add(message_type);
        
        return NextResponse.json({
          success: true,
          message: `Subscribed to ${message_type}`,
          connection_id,
          subscribed_types: Array.from(subscriptions.get(connection_id)!),
          timestamp: new Date().toISOString()
        });
      }
      
      case 'unsubscribe': {
        if (!connection_id || !message_type) {
          return NextResponse.json(
            { success: false, error: 'connection_id and message_type are required' },
            { status: 400 }
          );
        }
        
        if (subscriptions.has(connection_id)) {
          subscriptions.get(connection_id)!.delete(message_type);
        }
        
        return NextResponse.json({
          success: true,
          message: `Unsubscribed from ${message_type}`,
          connection_id,
          subscribed_types: subscriptions.has(connection_id) ? Array.from(subscriptions.get(connection_id)!) : [],
          timestamp: new Date().toISOString()
        });
      }
      
      case 'send_test_message': {
        if (!message_type) {
          return NextResponse.json(
            { success: false, error: 'message_type is required' },
            { status: 400 }
          );
        }
        
        const testMessage = data || generateMockMessage(message_type as WebSocketMessage['type']);
        
        // In a real implementation, this would broadcast to WebSocket connections
        // For now, we'll just return the message that would be sent
        return NextResponse.json({
          success: true,
          message: 'Test message generated',
          test_message: testMessage,
          would_send_to_connections: connections.size,
          timestamp: new Date().toISOString()
        });
      }
      
      case 'broadcast': {
        if (!message_type || !data) {
          return NextResponse.json(
            { success: false, error: 'message_type and data are required' },
            { status: 400 }
          );
        }
        
        const message: WebSocketMessage = {
          type: message_type,
          timestamp: new Date().toISOString(),
          data
        };
        
        // In a real implementation, this would broadcast to all subscribed connections
        let sentCount = 0;
        for (const [connId, types] of Array.from(subscriptions.entries())) {
          if (types.has(message_type)) {
            sentCount++;
            // Would send message to WebSocket connection here
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Message broadcasted',
          sent_to_connections: sentCount,
          broadcast_message: message,
          timestamp: new Date().toISOString()
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('WebSocket management error:', error);
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

// DELETE /api/playground/websocket - Disconnect WebSocket connection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connection_id');
    
    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'connection_id is required' },
        { status: 400 }
      );
    }
    
    // Remove connection and subscriptions
    connections.delete(connectionId);
    subscriptions.delete(connectionId);
    
    return NextResponse.json({
      success: true,
      message: 'Connection disconnected',
      connection_id: connectionId,
      remaining_connections: connections.size,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('WebSocket disconnection error:', error);
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