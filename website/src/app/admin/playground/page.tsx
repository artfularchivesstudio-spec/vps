'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

// Component imports
import ComponentGrid from './components/ComponentGrid';
import TestRunner from './components/TestRunner';
import BulkTestRunner from './components/BulkTestRunner';
import HealthOverview from './components/HealthOverview';
import MetricsDashboard from './components/MetricsDashboard';
import RealTimeUpdates from './components/RealTimeUpdates';
import TestHistory from './components/TestHistory';

// Hook imports
import { useHealthMonitoring } from './hooks/useHealthMonitoring';
import { useTestRunner } from './hooks/useTestRunner';
import { usePollingUpdates } from './hooks/usePollingUpdates';

// Type imports
import type { 
  DashboardState, 
  TestConfiguration,
  BulkTestConfiguration,
  ComponentType 
} from '@/types/playground';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<any>;
  badge?: number;
}

const AIIntegrationPlayground: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds

  // Custom hooks
  const {
    healthData,
    healthSummary,
    isLoading: healthLoading,
    error: healthError,
    refreshHealth,
    lastUpdated
  } = useHealthMonitoring();

  const {
    runIndividualTest,
    runBulkTest,
    cancelTest,
    currentTest,
    testResult,
    bulkResult,
    isRunning,
    progress,
    error: testError
  } = useTestRunner();

  const {
    isConnected,
    lastMessage,
    connectionError,
    subscribe,
    unsubscribe
  } = usePollingUpdates(5000);

  // Calculate alert counts
  const alertCounts = {
    error: healthData.filter(h => h.status === 'error').length,
    warning: healthData.filter(h => h.status === 'warning').length,
    unknown: healthData.filter(h => h.status === 'unknown').length
  };

  const totalAlerts = alertCounts.error + alertCounts.warning + alertCounts.unknown;

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'System Overview',
      icon: ChartBarIcon,
      component: HealthOverview
    },
    {
      id: 'components',
      label: 'Components',
      icon: CpuChipIcon,
      component: ComponentGrid,
      badge: totalAlerts > 0 ? totalAlerts : undefined
    },
    {
      id: 'testing',
      label: 'Individual Testing',
      icon: PlayIcon,
      component: TestRunner
    },
    {
      id: 'bulk-testing',
      label: 'Bulk Testing',
      icon: RocketLaunchIcon,
      component: BulkTestRunner
    },
    {
      id: 'metrics',
      label: 'Analytics',
      icon: ChartBarIcon,
      component: MetricsDashboard
    },
    {
      id: 'history',
      label: 'Test History',
      icon: ClockIcon,
      component: TestHistory
    }
  ];

  // Auto-refresh effect
  useEffect(() => {
    if (isAutoRefresh) {
      const interval = setInterval(() => {
        refreshHealth();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [isAutoRefresh, refreshInterval, refreshHealth]);

  // WebSocket subscription effect
  useEffect(() => {
    subscribe('health_update');
    subscribe('test_result');
    subscribe('alert');
    subscribe('metrics_update');

    return () => {
      unsubscribe('health_update');
      unsubscribe('test_result');
      unsubscribe('alert');
      unsubscribe('metrics_update');
    };
  }, [subscribe, unsubscribe]);

  // Get active tab component
  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || HealthOverview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Title */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CpuChipIcon className="h-8 w-8 text-purple-400" />
                  <h1 className="text-2xl font-bold text-white">
                    AI Integration Playground
                  </h1>
                </div>
                
                {/* Connection status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm text-gray-300">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-4">
                {/* Auto-refresh toggle */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                    className={`p-2 rounded-lg transition-colors ${
                      isAutoRefresh 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    title={isAutoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                  >
                    {isAutoRefresh ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </button>
                  <span className="text-sm text-gray-300">
                    {isAutoRefresh ? `Auto (${refreshInterval / 1000}s)` : 'Manual'}
                  </span>
                </div>

                {/* Manual refresh */}
                <button
                  onClick={() => refreshHealth()}
                  disabled={healthLoading}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh now"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${
                    healthLoading ? 'animate-spin' : ''
                  }`} />
                </button>

                {/* Settings */}
                <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  <Cog6ToothIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Status bar */}
        {(healthError || testError || connectionError) && (
          <div className="bg-red-600/20 border-b border-red-500/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-2 py-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <span className="text-sm text-red-200">
                  {healthError || testError || connectionError}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation tabs */}
        <nav className="bg-black/10 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-purple-400 text-purple-400'
                        : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    {tab.badge && tab.badge > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] h-5 flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main content area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <ActiveTabComponent />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Real-time updates component */}
        <RealTimeUpdates />
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AIIntegrationPlayground;