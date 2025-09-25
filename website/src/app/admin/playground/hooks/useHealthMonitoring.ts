import { useState, useEffect, useCallback } from 'react';
import { AIIntegrationHealth, SystemHealthSummary } from '@/types/playground';

export interface UseHealthMonitoringReturn {
  healthData: AIIntegrationHealth[];
  healthSummary: SystemHealthSummary[];
  isLoading: boolean;
  error: string | null;
  refreshHealth: () => Promise<void>;
  performRealHealthCheck: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useHealthMonitoring(useRealHealthChecks: boolean = false): UseHealthMonitoringReturn {
  const [healthData, setHealthData] = useState<AIIntegrationHealth[]>([]);
  const [healthSummary, setHealthSummary] = useState<SystemHealthSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthData = useCallback(async (performRealCheck: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine which endpoint to use based on parameters
      const healthEndpoint = performRealCheck || useRealHealthChecks 
        ? '/api/playground/health?real=true'
        : '/api/playground/health?mock=true';

      // Fetch health data from API
      const healthResponse = await fetch(healthEndpoint);
      if (!healthResponse.ok) {
        throw new Error(`Health API error: ${healthResponse.status}`);
      }
      const health = await healthResponse.json();

      if (health.success && health.data) {
        setHealthData(health.data.health_data || []);
        setHealthSummary(health.data.summary || []);
        setLastUpdated(new Date());
        return;
      }

      // Fallback to summary endpoint if main endpoint doesn't have summary
      if (!health.data?.summary) {
        const summaryResponse = await fetch('/api/playground/health/summary');
        if (summaryResponse.ok) {
          const summary = await summaryResponse.json();
          setHealthSummary(summary.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch health data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      
      // Set mock data for development
      setHealthData([
        {
          id: '1',
          component_type: 'mcp_tool',
          component_name: 'create_blog_post',
          status: 'healthy',
          last_checked_at: new Date().toISOString(),
          response_time_ms: 150,
          error_message: null,
          error_code: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          component_type: 'chatgpt_action',
          component_name: 'analyze_content',
          status: 'warning',
          last_checked_at: new Date().toISOString(),
          response_time_ms: 2500,
          error_message: 'Slow response time detected',
          error_code: 'SLOW_RESPONSE',
          metadata: { threshold_ms: 2000 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      
      setHealthSummary([
        {
          component_type: 'mcp_tool',
          total_components: 7,
          healthy_count: 6,
          warning_count: 1,
          error_count: 0,
          unknown_count: 0,
          avg_response_time_ms: 180,
          last_updated: new Date().toISOString()
        },
        {
          component_type: 'chatgpt_action',
          total_components: 5,
          healthy_count: 3,
          warning_count: 2,
          error_count: 0,
          unknown_count: 0,
          avg_response_time_ms: 1200,
          last_updated: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [useRealHealthChecks]);

  const refreshHealth = useCallback(async () => {
    await fetchHealthData(false);
  }, [fetchHealthData]);

  const performRealHealthCheck = useCallback(async () => {
    await fetchHealthData(true);
  }, [fetchHealthData]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  return {
    healthData,
    healthSummary,
    isLoading,
    error,
    refreshHealth,
    performRealHealthCheck,
    lastUpdated
  };
}