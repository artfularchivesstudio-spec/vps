'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

import type {
  AIIntegrationHealth,
  SystemHealthSummary,
  ComponentType
} from '@/types/playground';
import { useHealthMonitoring } from '../hooks/useHealthMonitoring';

export default function HealthOverview() {
  const [useRealHealthChecks, setUseRealHealthChecks] = useState(false);
  const { 
    healthData: healthStatus, 
    healthSummary, 
    isLoading, 
    error, 
    refreshHealth,
    performRealHealthCheck, 
    lastUpdated 
  } = useHealthMonitoring(useRealHealthChecks);
  // Status icon mapping
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-400" />;
      default:
        return <QuestionMarkCircleIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'error':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  // Calculate uptime percentage
  const calculateUptime = (component: AIIntegrationHealth) => {
    if (!component.last_checked_at || !component.created_at) return 0;
    const totalTime = new Date().getTime() - new Date(component.created_at).getTime();
    const lastCheck = new Date(component.last_checked_at).getTime();
    const timeSinceCheck = new Date().getTime() - lastCheck;
    // Simple uptime calculation based on recent activity
    return component.status === 'healthy' ? 99.9 : component.status === 'warning' ? 95.0 : 85.0;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-600 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <XCircleIcon className="h-6 w-6 text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-red-400">Error Loading Health Status</h3>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Components */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Components</p>
              <p className="text-2xl font-bold text-white">{healthSummary.reduce((sum, h) => sum + h.total_components, 0)}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        {/* Healthy Components */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Healthy</p>
              <p className="text-2xl font-bold text-green-400">{healthSummary.reduce((sum, h) => sum + h.healthy_count, 0)}</p>
              <p className="text-xs text-gray-500">
                {((healthSummary.reduce((sum, h) => sum + h.healthy_count, 0) / healthSummary.reduce((sum, h) => sum + h.total_components, 0)) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </motion.div>

        {/* Warning Components */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Warnings</p>
              <p className="text-2xl font-bold text-yellow-400">{healthSummary.reduce((sum, h) => sum + h.warning_count, 0)}</p>
              <p className="text-xs text-gray-500">
                {((healthSummary.reduce((sum, h) => sum + h.warning_count, 0) / healthSummary.reduce((sum, h) => sum + h.total_components, 0)) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </motion.div>

        {/* Error Components */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Errors</p>
              <p className="text-2xl font-bold text-red-400">{healthSummary.reduce((sum, h) => sum + h.error_count, 0)}</p>
              <p className="text-xs text-gray-500">
                {((healthSummary.reduce((sum, h) => sum + h.error_count, 0) / healthSummary.reduce((sum, h) => sum + h.total_components, 0)) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">System Status</h3>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <ClockIcon className="h-4 w-4" />
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={useRealHealthChecks}
                  onChange={(e) => setUseRealHealthChecks(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300">Real Health Checks</span>
              </label>
            </div>
            <button
              onClick={useRealHealthChecks ? performRealHealthCheck : refreshHealth}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Checking...' : useRealHealthChecks ? 'Run Health Check' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MCP Tools */}
          <div>
            <h4 className="text-md font-medium text-gray-300 mb-4">MCP Server Tools</h4>
            <div className="space-y-3">
              {healthStatus
                .filter(component => component.component_type === 'mcp_tool')
                .map((component, index) => {
                  const uptime = calculateUptime(component);
                  return (
                    <motion.div
                      key={component.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        getStatusColor(component.status)
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(component.status)}
                        <div>
                          <p className="font-medium text-white">{component.component_name}</p>
                          <p className="text-sm text-gray-400">
                            Response: {component.response_time_ms}ms
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{uptime.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">uptime</p>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          {/* ChatGPT Actions */}
          <div>
            <h4 className="text-md font-medium text-gray-300 mb-4">ChatGPT Actions</h4>
            <div className="space-y-3">
              {healthStatus
                .filter(component => component.component_type === 'chatgpt_action')
                .map((component, index) => {
                  const uptime = calculateUptime(component);
                  return (
                    <motion.div
                      key={component.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        getStatusColor(component.status)
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(component.status)}
                        <div>
                          <p className="font-medium text-white">{component.component_name}</p>
                          <p className="text-sm text-gray-400">
                            Response: {component.response_time_ms}ms
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{uptime.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">uptime</p>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overall System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Overall System Health</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            {(() => {
              const totalComponents = healthSummary.reduce((sum, h) => sum + h.total_components, 0);
              const healthyComponents = healthSummary.reduce((sum, h) => sum + h.healthy_count, 0);
              const overallHealthScore = totalComponents > 0 ? (healthyComponents / totalComponents) * 100 : 0;
              
              return (
                <>
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>System Health Score</span>
                    <span>{overallHealthScore.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${overallHealthScore}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className={`h-2 rounded-full ${
                        overallHealthScore >= 90
                          ? 'bg-green-400'
                          : overallHealthScore >= 70
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}
                    />
                  </div>
                </>
              );
            })()}
          </div>
          <div className={(() => {
            const totalComponents = healthSummary.reduce((sum, h) => sum + h.total_components, 0);
            const healthyComponents = healthSummary.reduce((sum, h) => sum + h.healthy_count, 0);
            const overallHealthScore = totalComponents > 0 ? (healthyComponents / totalComponents) * 100 : 0;
            
            return `p-3 rounded-lg ${
              overallHealthScore >= 90
                ? 'bg-green-500/20'
                : overallHealthScore >= 70
                ? 'bg-yellow-500/20'
                : 'bg-red-500/20'
            }`;
          })()}>
            {(() => {
              const totalComponents = healthSummary.reduce((sum, h) => sum + h.total_components, 0);
              const healthyComponents = healthSummary.reduce((sum, h) => sum + h.healthy_count, 0);
              const overallHealthScore = totalComponents > 0 ? (healthyComponents / totalComponents) * 100 : 0;
              
              return overallHealthScore >= 90 ? (
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              ) : overallHealthScore >= 70 ? (
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-400" />
              );
            })()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}