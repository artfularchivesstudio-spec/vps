import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketMessage } from '@/types/playground';

export interface UseRealTimeUpdatesReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  connectionError: string | null;
  subscribe: (messageType: WebSocketMessage['type']) => void;
  unsubscribe: (messageType: WebSocketMessage['type']) => void;
}

export function useRealTimeUpdates(): UseRealTimeUpdatesReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [subscribedTypes, setSubscribedTypes] = useState<Set<WebSocketMessage['type']>>(new Set());
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = useCallback(() => {
    try {
      // Use secure WebSocket in production, regular WebSocket in development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/playground/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        // Subscribe to previously subscribed message types
        subscribedTypes.forEach(type => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'subscribe', type }));
          }
        });
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setConnectionError(`Connection lost. Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect after multiple attempts');
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setConnectionError('Failed to establish WebSocket connection');
      
      // Simulate real-time updates with mock data for development
      const mockInterval = setInterval(() => {
        const mockMessages: WebSocketMessage[] = [
          {
            type: 'health_update',
            timestamp: new Date().toISOString(),
            data: {
              component_type: 'mcp_tool',
              component_name: 'create_blog_post',
              status: 'healthy',
              response_time_ms: Math.floor(Math.random() * 500) + 100,
              error_message: null
            }
          },
          {
            type: 'metrics_update',
            timestamp: new Date().toISOString(),
            data: {
              component_type: 'chatgpt_action',
              component_name: 'analyzeImageAndGenerateInsights',
              metrics: [{
                id: `metric_${Date.now()}`,
                component_type: 'chatgpt_action',
                component_name: 'analyzeImageAndGenerateInsights',
                metric_type: 'response_time',
                metric_value: Math.floor(Math.random() * 2000) + 500,
                time_window: '1m',
                recorded_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              }]
            }
          }
        ];
        
        const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
        if (subscribedTypes.has(randomMessage.type)) {
          setLastMessage(randomMessage);
        }
      }, 5000);
      
      // Clean up mock interval after 30 seconds
      setTimeout(() => {
        clearInterval(mockInterval);
      }, 30000);
    }
  }, [subscribedTypes]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  const subscribe = useCallback((messageType: WebSocketMessage['type']) => {
    setSubscribedTypes(prev => new Set([...Array.from(prev), messageType]));
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', type: messageType }));
    }
  }, []);

  const unsubscribe = useCallback((messageType: WebSocketMessage['type']) => {
    setSubscribedTypes(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageType);
      return newSet;
    });
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'unsubscribe', type: messageType }));
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connectionError,
    subscribe,
    unsubscribe
  };
}