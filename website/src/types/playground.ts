// AI Integration Playground TypeScript Definitions
// Created: January 30, 2025
// Purpose: Type definitions for health monitoring and testing infrastructure

// Database Entity Types
export interface AIIntegrationHealth {
  id: string;
  component_type: 'mcp_tool' | 'chatgpt_action';
  component_name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  response_time_ms: number | null;
  error_message: string | null;
  error_code: string | null;
  metadata: Record<string, any>;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface TestHistory {
  id: string;
  test_type: 'individual' | 'bulk' | 'scheduled';
  component_type: 'mcp_tool' | 'chatgpt_action';
  component_name: string | null;
  test_parameters: Record<string, any>;
  test_result: Record<string, any>;
  status: 'success' | 'failure' | 'timeout' | 'cancelled';
  duration_ms: number | null;
  error_message: string | null;
  error_code: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PerformanceMetrics {
  id: string;
  component_type: 'mcp_tool' | 'chatgpt_action';
  component_name: string;
  metric_type: 'response_time' | 'success_rate' | 'error_rate' | 'throughput';
  metric_value: number;
  time_window: '1m' | '5m' | '15m' | '1h' | '24h' | '7d';
  recorded_at: string;
  created_at: string;
}

export interface SystemAlert {
  id: string;
  alert_type: 'health_check_failed' | 'performance_degraded' | 'service_down' | 'rate_limit_exceeded';
  component_type: 'mcp_tool' | 'chatgpt_action' | 'system';
  component_name: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: Record<string, any>;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

// View Types
export interface CurrentHealthStatus {
  component_type: 'mcp_tool' | 'chatgpt_action';
  component_name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  response_time_ms: number | null;
  error_message: string | null;
  last_checked_at: string;
  seconds_since_check: number;
}

export interface SystemHealthSummary {
  component_type: 'mcp_tool' | 'chatgpt_action';
  total_components: number;
  healthy_count: number;
  warning_count: number;
  error_count: number;
  unknown_count: number;
  avg_response_time_ms: number | null;
  last_updated: string;
}

export interface RecentTestResults extends TestHistory {
  created_by_email: string | null;
}

export interface PerformanceTrends {
  component_type: 'mcp_tool' | 'chatgpt_action';
  component_name: string;
  metric_type: 'response_time' | 'success_rate' | 'error_rate' | 'throughput';
  time_window: '1m' | '5m' | '15m' | '1h' | '24h' | '7d';
  avg_value: number;
  min_value: number;
  max_value: number;
  data_points: number;
  last_recorded: string;
}

// Component Configuration Types
export interface MCPToolConfig {
  name: string;
  description: string;
  endpoint: string;
  parameters: Record<string, any>;
  timeout_ms: number;
  retry_count: number;
}

export interface ChatGPTActionConfig {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  parameters: Record<string, any>;
  timeout_ms: number;
  retry_count: number;
}

// Test Configuration Types
export interface TestConfiguration {
  component_type: 'mcp_tool' | 'chatgpt_action';
  component_name: string;
  test_parameters: Record<string, any>;
  timeout_ms?: number;
  retry_count?: number;
  expected_status?: string;
  validation_rules?: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  message: string;
}

export interface BulkTestConfiguration {
  tests: TestConfiguration[];
  parallel_execution: boolean;
  max_concurrent: number;
  stop_on_first_failure: boolean;
  timeout_ms: number;
}

// Test Result Types
export interface TestResult {
  test_id: string;
  component_type: 'mcp_tool' | 'chatgpt_action';
  component_name: string;
  status: 'success' | 'failure' | 'timeout' | 'cancelled';
  duration_ms: number;
  response_data: any;
  error_message?: string;
  error_code?: string;
  validation_results?: ValidationResult[];
  timestamp: string;
}

export interface ValidationResult {
  rule: ValidationRule;
  passed: boolean;
  actual_value: any;
  message: string;
}

export interface BulkTestResult {
  bulk_test_id: string;
  total_tests: number;
  completed_tests: number;
  successful_tests: number;
  failed_tests: number;
  cancelled_tests: number;
  overall_status: 'running' | 'completed' | 'failed' | 'cancelled';
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  individual_results: TestResult[];
}

// Dashboard State Types
export interface DashboardState {
  health_status: CurrentHealthStatus[];
  health_summary: SystemHealthSummary[];
  recent_tests: RecentTestResults[];
  performance_trends: PerformanceTrends[];
  active_alerts: SystemAlert[];
  last_updated: string;
  is_loading: boolean;
  error: string | null;
}

export interface TestRunnerState {
  current_test: TestConfiguration | null;
  test_result: TestResult | null;
  bulk_test: BulkTestConfiguration | null;
  bulk_result: BulkTestResult | null;
  is_running: boolean;
  progress: number;
  error: string | null;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'health_update' | 'test_result' | 'alert' | 'metrics_update';
  timestamp: string;
  data: any;
}

export interface HealthUpdateMessage extends WebSocketMessage {
  type: 'health_update';
  data: {
    component_type: 'mcp_tool' | 'chatgpt_action';
    component_name: string;
    status: 'healthy' | 'warning' | 'error' | 'unknown';
    response_time_ms: number | null;
    error_message: string | null;
  };
}

export interface TestResultMessage extends WebSocketMessage {
  type: 'test_result';
  data: TestResult;
}

export interface AlertMessage extends WebSocketMessage {
  type: 'alert';
  data: SystemAlert;
}

export interface MetricsUpdateMessage extends WebSocketMessage {
  type: 'metrics_update';
  data: {
    component_type: 'mcp_tool' | 'chatgpt_action';
    component_name: string;
    metrics: PerformanceMetrics[];
  };
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Filter and Search Types
export interface HealthFilter {
  component_type?: 'mcp_tool' | 'chatgpt_action';
  status?: 'healthy' | 'warning' | 'error' | 'unknown';
  component_name?: string;
  last_checked_after?: string;
  last_checked_before?: string;
}

export interface TestHistoryFilter {
  component_type?: 'mcp_tool' | 'chatgpt_action';
  component_name?: string;
  test_type?: 'individual' | 'bulk' | 'scheduled';
  status?: 'success' | 'failure' | 'timeout' | 'cancelled';
  created_by?: string;
  created_after?: string;
  created_before?: string;
}

export interface MetricsFilter {
  component_type?: 'mcp_tool' | 'chatgpt_action';
  component_name?: string;
  metric_type?: 'response_time' | 'success_rate' | 'error_rate' | 'throughput';
  time_window?: '1m' | '5m' | '15m' | '1h' | '24h' | '7d';
  recorded_after?: string;
  recorded_before?: string;
}

// Chart Data Types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesData {
  component_name: string;
  metric_type: string;
  data_points: ChartDataPoint[];
  color: string;
}

export interface HealthDistributionData {
  component_type: 'mcp_tool' | 'chatgpt_action';
  healthy: number;
  warning: number;
  error: number;
  unknown: number;
}

// Export Configuration Types
export interface ExportConfiguration {
  format: 'csv' | 'json' | 'xlsx';
  date_range: {
    start: string;
    end: string;
  };
  filters: {
    component_types?: ('mcp_tool' | 'chatgpt_action')[];
    component_names?: string[];
    statuses?: string[];
  };
  include_metadata: boolean;
  include_test_parameters: boolean;
  include_test_results: boolean;
}

// Notification Types
export interface NotificationConfig {
  id: string;
  type: 'email' | 'webhook' | 'slack';
  enabled: boolean;
  conditions: {
    component_types?: ('mcp_tool' | 'chatgpt_action')[];
    statuses?: ('healthy' | 'warning' | 'error' | 'unknown')[];
    severity_levels?: ('low' | 'medium' | 'high' | 'critical')[];
  };
  settings: Record<string, any>;
}

// Component Constants
export const MCP_TOOLS = [
  'create_blog_post',
  'analyze_artwork',
  'generate_audio_narration',
  'manage_media_assets',
  'publish_content',
  'search_content',
  'get_analytics'
] as const;

export const CHATGPT_ACTIONS = [
  'listPosts',
  'createPost',
  'analyzeImageAndGenerateInsights',
  'generateAudio',
  'getAudioJobStatus'
] as const;

export const STATUS_COLORS = {
  healthy: '#10B981', // green-500
  warning: '#F59E0B', // amber-500
  error: '#EF4444',   // red-500
  unknown: '#6B7280'  // gray-500
} as const;

export const SEVERITY_COLORS = {
  low: '#10B981',     // green-500
  medium: '#F59E0B',  // amber-500
  high: '#F97316',    // orange-500
  critical: '#EF4444' // red-500
} as const;

// Utility Types
export type ComponentType = 'mcp_tool' | 'chatgpt_action';
export type HealthStatus = 'healthy' | 'warning' | 'error' | 'unknown';
export type TestStatus = 'success' | 'failure' | 'timeout' | 'cancelled';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type MetricType = 'response_time' | 'success_rate' | 'error_rate' | 'throughput';
export type TimeWindow = '1m' | '5m' | '15m' | '1h' | '24h' | '7d';

// Hook Return Types
export interface UseHealthMonitoringReturn {
  healthStatus: CurrentHealthStatus[];
  healthSummary: SystemHealthSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: string;
}

export interface UseTestRunnerReturn {
  runIndividualTest: (config: TestConfiguration) => Promise<TestResult>;
  runBulkTest: (config: BulkTestConfiguration) => Promise<BulkTestResult>;
  cancelTest: (testId: string) => Promise<void>;
  currentTest: TestConfiguration | null;
  testResult: TestResult | null;
  bulkResult: BulkTestResult | null;
  isRunning: boolean;
  progress: number;
  error: string | null;
}

export interface UsePollingUpdatesReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  connectionError: string | null;
  subscribe: (messageType: WebSocketMessage['type']) => void;
  unsubscribe: (messageType: WebSocketMessage['type']) => void;
  refresh: () => void;
}

// Form Types
export interface TestForm {
  component_type: ComponentType;
  component_name: string;
  test_parameters: Record<string, any>;
  timeout_ms: number;
  retry_count: number;
  validation_rules: ValidationRule[];
}

export interface BulkTestForm {
  selected_components: string[];
  test_parameters: Record<string, any>;
  parallel_execution: boolean;
  max_concurrent: number;
  stop_on_first_failure: boolean;
  timeout_ms: number;
}

// Error Types
export interface PlaygroundError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  component?: string;
  stack_trace?: string;
}

// Configuration Types
export interface PlaygroundConfig {
  refresh_interval_ms: number;
  max_test_history_days: number;
  max_concurrent_tests: number;
  default_timeout_ms: number;
  websocket_reconnect_attempts: number;
  websocket_reconnect_delay_ms: number;
  health_check_interval_ms: number;
  performance_metrics_retention_days: number;
}

// Default playground configuration
const PlaygroundTypes = {};
export default PlaygroundTypes;