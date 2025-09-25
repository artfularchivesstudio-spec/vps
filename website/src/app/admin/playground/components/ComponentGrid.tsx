'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  CpuChipIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { AIIntegrationHealth, MCP_TOOLS, CHATGPT_ACTIONS } from '@/types/playground';

interface ComponentGridProps {
  healthData: AIIntegrationHealth[];
  onComponentClick?: (component: AIIntegrationHealth) => void;
}

const ComponentGrid: React.FC<ComponentGridProps> = ({ healthData, onComponentClick }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-400/30 bg-green-400/5';
      case 'warning':
        return 'border-yellow-400/30 bg-yellow-400/5';
      case 'error':
        return 'border-red-400/30 bg-red-400/5';
      default:
        return 'border-gray-400/30 bg-gray-400/5';
    }
  };

  const getComponentTypeIcon = (type: string) => {
    return type === 'mcp_tool' ? (
      <CpuChipIcon className="h-4 w-4 text-blue-400" />
    ) : (
      <CommandLineIcon className="h-4 w-4 text-purple-400" />
    );
  };

  const formatResponseTime = (timeMs: number | null) => {
    if (timeMs === null) return 'N/A';
    if (timeMs < 1000) return `${timeMs}ms`;
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  const getLastCheckedText = (lastChecked: string) => {
    const now = new Date();
    const checked = new Date(lastChecked);
    const diffMs = now.getTime() - checked.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Create a complete list of all components with their health status
  const allComponents = [
    ...MCP_TOOLS.map(tool => ({
      name: tool,
      type: 'mcp_tool' as const,
      health: healthData.find(h => h.component_name === tool && h.component_type === 'mcp_tool')
    })),
    ...CHATGPT_ACTIONS.map(action => ({
      name: action,
      type: 'chatgpt_action' as const,
      health: healthData.find(h => h.component_name === action && h.component_type === 'chatgpt_action')
    }))
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {allComponents.map((component, index) => {
        const health = component.health;
        const status = health?.status || 'unknown';
        const responseTime = health?.response_time_ms || null;
        const lastChecked = health?.last_checked_at || new Date().toISOString();
        const errorMessage = health?.error_message;

        return (
          <motion.div
            key={`${component.type}-${component.name}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              relative p-4 rounded-xl border backdrop-blur-sm cursor-pointer
              transition-all duration-200 hover:scale-105 hover:shadow-lg
              ${getStatusColor(status)}
            `}
            onClick={() => health && onComponentClick?.(health)}
          >
            {/* Component Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getComponentTypeIcon(component.type)}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {component.name}
                  </h3>
                  <p className="text-xs text-gray-400 capitalize">
                    {component.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              {getStatusIcon(status)}
            </div>

            {/* Status Details */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Response Time</span>
                <span className="text-xs text-white font-mono">
                  {formatResponseTime(responseTime)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Last Check</span>
                <span className="text-xs text-white">
                  {getLastCheckedText(lastChecked)}
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Status</span>
                <span className={`
                  text-xs px-2 py-1 rounded-full font-medium capitalize
                  ${
                    status === 'healthy'
                      ? 'bg-green-400/20 text-green-400'
                      : status === 'warning'
                      ? 'bg-yellow-400/20 text-yellow-400'
                      : status === 'error'
                      ? 'bg-red-400/20 text-red-400'
                      : 'bg-gray-400/20 text-gray-400'
                  }
                `}>
                  {status}
                </span>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                  <p className="text-xs text-red-400 truncate" title={errorMessage}>
                    {errorMessage}
                  </p>
                </div>
              )}
            </div>

            {/* Pulse Animation for Active Components */}
            {status === 'healthy' && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ComponentGrid;