'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Chart colors
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4'
};

// Types
import type { 
  PerformanceMetrics,
  PerformanceTrends,
  SystemHealthSummary
} from '@/types/playground';

// Mock interfaces for metrics API responses
interface MetricsSummary {
  avg_response_time: number;
  response_time_change: number;
  success_rate: number;
  success_rate_change: number;
  total_tests: number;
  test_volume_change: number;
  error_rate: number;
  error_rate_change: number;
}

interface TrendDataPoint {
  timestamp: string;
  avg_response_time: number;
  success_rate: number;
  error_rate: number;
  test_count: number;
}

interface TrendsResponse {
  data_points: TrendDataPoint[];
}

interface HealthSummaryResponse {
  healthy_components: number;
  warning_components: number;
  error_components: number;
}

interface MetricsDashboardProps {
  className?: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { label: 'Last 24 Hours', value: '24h', days: 1 },
  { label: 'Last 7 Days', value: '7d', days: 7 },
  { label: 'Last 30 Days', value: '30d', days: 30 },
  { label: 'Last 90 Days', value: '90d', days: 90 }
];



const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ className = '' }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('7d');
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics data
  const fetchMetrics = useCallback(async (timeRange: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch metrics summary
       const summaryResponse = await fetch(`/api/playground/metrics?type=summary&period=${timeRange}`);
       if (!summaryResponse.ok) {
         throw new Error(`Failed to fetch summary: ${summaryResponse.status}`);
       }
       const summaryResult = await summaryResponse.json();
       
       if (summaryResult.success) {
         const summaryData = summaryResult.data;
         setMetrics({
           avg_response_time: summaryData.average_response_time || 0,
           response_time_change: Math.random() * 10 - 5, // Mock change percentage
           success_rate: (summaryData.success_rate || 0) / 100,
           success_rate_change: Math.random() * 5 - 2.5,
           total_tests: summaryData.total_tests || 0,
           test_volume_change: Math.random() * 20 - 10,
           error_rate: ((summaryData.failed_tests || 0) / (summaryData.total_tests || 1)),
           error_rate_change: Math.random() * 3 - 1.5
         });
       }
       
       // Fetch trends data
       const trendsResponse = await fetch(`/api/playground/metrics?type=trends&period=${timeRange}`);
       if (!trendsResponse.ok) {
         throw new Error(`Failed to fetch trends: ${trendsResponse.status}`);
       }
       const trendsResult = await trendsResponse.json();
       
       if (trendsResult.success && trendsResult.data.data_points) {
         const trendData = trendsResult.data.data_points;
         setTrends({
           data_points: trendData.map((point: any) => ({
             timestamp: point.timestamp,
             avg_response_time: point.average_response_time || 0,
             success_rate: (point.success_rate || 0) / 100,
             error_rate: (point.error_rate || 0) / 100,
             test_count: point.total_tests || 0
           }))
         });
       }
       
       // Fetch health summary
       const healthResponse = await fetch(`/api/playground/metrics?type=health&period=${timeRange}`);
       if (!healthResponse.ok) {
         throw new Error(`Failed to fetch health: ${healthResponse.status}`);
       }
       const healthResult = await healthResponse.json();
      
      if (healthResult.success) {
        const healthData = healthResult.data;
        setHealthSummary({
          healthy_components: healthData.healthy_components || 0,
          warning_components: healthData.degraded_components || 0,
          error_components: healthData.failed_components || 0
        });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics(selectedTimeRange);
  }, [selectedTimeRange, fetchMetrics]);

  // Generate metric cards
  const getMetricCards = (): MetricCard[] => {
    if (!metrics || !healthSummary) return [];

    return [
      {
        title: 'Average Response Time',
        value: `${metrics.avg_response_time}ms`,
        change: metrics.response_time_change,
        trend: metrics.response_time_change > 0 ? 'down' : 'up',
        icon: ClockIcon,
        color: COLORS.primary
      },
      {
        title: 'Success Rate',
        value: `${(metrics.success_rate * 100).toFixed(1)}%`,
        change: metrics.success_rate_change,
        trend: metrics.success_rate_change > 0 ? 'up' : 'down',
        icon: CheckCircleIcon,
        color: COLORS.success
      },
      {
        title: 'Total Tests',
        value: metrics.total_tests.toLocaleString(),
        change: metrics.test_volume_change,
        trend: metrics.test_volume_change > 0 ? 'up' : 'down',
        icon: ChartBarIcon,
        color: COLORS.info
      },
      {
        title: 'Error Rate',
        value: `${(metrics.error_rate * 100).toFixed(1)}%`,
        change: -metrics.error_rate_change, // Negative because lower is better
        trend: metrics.error_rate_change < 0 ? 'up' : 'down',
        icon: ExclamationTriangleIcon,
        color: COLORS.error
      }
    ];
  };

  // Format trend data for charts
  const formatTrendData = () => {
    if (!trends?.data_points) return [];
    
    return trends.data_points.map(point => ({
      timestamp: new Date(point.timestamp).toLocaleDateString(),
      responseTime: point.avg_response_time,
      successRate: point.success_rate * 100,
      errorRate: point.error_rate * 100,
      testCount: point.test_count
    }));
  };

  // Component status distribution for pie chart
  const getStatusDistribution = () => {
    if (!healthSummary) return [];

    return [
      { name: 'Healthy', value: healthSummary.healthy_components, color: COLORS.success },
      { name: 'Warning', value: healthSummary.warning_components, color: COLORS.warning },
      { name: 'Error', value: healthSummary.error_components, color: COLORS.error }
    ].filter(item => item.value > 0);
  };

  const metricCards = getMetricCards();
  const chartData = formatTrendData();
  const statusData = getStatusDistribution();

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Metrics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchMetrics(selectedTimeRange)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
          <p className="text-gray-600 mt-1">Monitor system performance and trends over time</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => fetchMetrics(selectedTimeRange)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trend === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
          const trendColor = card.trend === 'up' ? 'text-green-600' : 'text-red-600';
          
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Icon 
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
                
                {card.change !== undefined && (
                  <div className={`flex items-center space-x-1 ${trendColor}`}>
                    <TrendIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {Math.abs(card.change).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trend</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Success Rate Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Rate & Error Rate</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="successRate" 
                    stackId="1"
                    stroke={COLORS.success}
                    fill={COLORS.success}
                    fillOpacity={0.6}
                    name="Success Rate"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="errorRate" 
                    stackId="2"
                    stroke={COLORS.error}
                    fill={COLORS.error}
                    fillOpacity={0.6}
                    name="Error Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Test Volume */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Volume</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    label={{ value: 'Test Count', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="testCount" 
                    fill={COLORS.info}
                    radius={[4, 4, 0, 0]}
                    name="Tests Executed"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Component Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Health Distribution</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : statusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No health data available</p>
                <p className="text-sm text-gray-400">Run health checks to see distribution</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MetricsDashboard;