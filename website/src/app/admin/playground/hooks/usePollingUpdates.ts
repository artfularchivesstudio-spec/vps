import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketMessage } from '@/types/playground';

export interface UsePollingUpdatesReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  connectionError: string | null;
  subscribe: (messageType: WebSocketMessage['type']) => void;
  unsubscribe: (messageType: WebSocketMessage['type']) => void;
  refresh: () => void;
}

export function usePollingUpdates(intervalMs: number = 5000): UsePollingUpdatesReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [subscribedTypes, setSubscribedTypes] = useState<Set<WebSocketMessage['type']>>(new Set());
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Record<string, any>>({});

  const fetchUpdates = useCallback(async () => {
    if (subscribedTypes.size === 0) return;

    try {
      const promises = Array.from(subscribedTypes).map(async (type) => {
        let endpoint = '';
        
        switch (type) {
          case 'health_update':
            endpoint = '/api/playground/health/summary';
            break;
          case 'test_result':
            // This would be implemented when we have test results endpoint
            return null;
          case 'alert':
            // This would be implemented when we have alerts endpoint
            return null;
          case 'metrics_update':
            endpoint = '/api/playground/metrics';
            break;
          default:
            return null;
        }

        if (!endpoint) return null;

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check if data has changed since last update
        const dataKey = `${type}_${endpoint}`;
        const lastData = lastUpdateRef.current[dataKey];
        const currentDataString = JSON.stringify(data);
        
        if (lastData !== currentDataString) {
          lastUpdateRef.current[dataKey] = currentDataString;
          
          return {
            type,
            data,
            timestamp: new Date().toISOString()
          } as WebSocketMessage;
        }
        
        return null;
      });

      const results = await Promise.all(promises);
      const validResults = results.filter(result => result !== null);
      
      if (validResults.length > 0) {
        // Use the most recent update
        setLastMessage(validResults[validResults.length - 1]);
      }
      
      setIsConnected(true);
      setConnectionError(null);
    } catch (error) {
      console.error('Polling error:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown polling error');
      setIsConnected(false);
    }
  }, [subscribedTypes]);

  const subscribe = useCallback((messageType: WebSocketMessage['type']) => {
    setSubscribedTypes(prev => {
      const newSet = new Set(prev);
      newSet.add(messageType);
      return newSet;
    });
  }, []);

  const unsubscribe = useCallback((messageType: WebSocketMessage['type']) => {
    setSubscribedTypes(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageType);
      return newSet;
    });
  }, []);

  const refresh = useCallback(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  // Set up polling interval
  useEffect(() => {
    if (subscribedTypes.size > 0) {
      // Initial fetch
      fetchUpdates();
      
      // Set up interval
      intervalRef.current = setInterval(fetchUpdates, intervalMs);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Clear interval if no subscriptions
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
    }
  }, [subscribedTypes, fetchUpdates, intervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    connectionError,
    subscribe,
    unsubscribe,
    refresh
  };
}