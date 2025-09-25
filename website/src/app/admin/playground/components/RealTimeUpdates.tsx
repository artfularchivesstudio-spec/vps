'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BellIcon,
  WifiIcon,
  SignalSlashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { WebSocketMessage, HealthUpdateMessage, TestResultMessage, AlertMessage, MetricsUpdateMessage } from '@/types/playground';
import { usePollingUpdates } from '../hooks/usePollingUpdates';

interface RealTimeUpdatesProps {
  onHealthUpdate?: (data: HealthUpdateMessage['data']) => void;
  onTestResult?: (data: TestResultMessage['data']) => void;
  onAlert?: (data: AlertMessage['data']) => void;
  onMetricsUpdate?: (data: MetricsUpdateMessage['data']) => void;
}

interface NotificationItem {
  id: string;
  type: WebSocketMessage['type'];
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  data: any;
}

const RealTimeUpdates: React.FC<RealTimeUpdatesProps> = ({
  onHealthUpdate,
  onTestResult,
  onAlert,
  onMetricsUpdate
}) => {
  const { isConnected, lastMessage, connectionError, subscribe, unsubscribe, refresh } = usePollingUpdates(5000);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Subscribe to all message types on mount
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

  // Process incoming messages
  useEffect(() => {
    if (!lastMessage) return;

    const notification: NotificationItem = {
      id: `${lastMessage.type}_${Date.now()}`,
      type: lastMessage.type,
      message: '',
      timestamp: lastMessage.timestamp,
      severity: 'info',
      data: lastMessage.data
    };

    switch (lastMessage.type) {
      case 'health_update':
        const healthUpdate = lastMessage.data as HealthUpdateMessage['data'];
        notification.message = `${healthUpdate.component_name} status: ${healthUpdate.status}`;
        notification.severity = healthUpdate.status === 'healthy' ? 'success' :
          healthUpdate.status === 'warning' ? 'warning' : 'error';
        onHealthUpdate?.(healthUpdate);
        break;

      case 'test_result':
        const testData = lastMessage.data as TestResultMessage['data'];
        notification.message = `Test ${testData.component_name}: ${testData.status}`;
        notification.severity = testData.status === 'success' ? 'success' : 'error';
        onTestResult?.(testData);
        break;

      case 'alert':
        const alertData = lastMessage.data as AlertMessage['data'];
        notification.message = alertData.message;
        notification.severity = alertData.severity === 'critical' ? 'error' : 
                               alertData.severity === 'high' ? 'error' :
                               alertData.severity === 'medium' ? 'warning' : 'info';
        onAlert?.(alertData);
        break;

      case 'metrics_update':
        const metricsData = lastMessage.data as MetricsUpdateMessage['data'];
        notification.message = `Metrics updated for ${metricsData.component_name}`;
        notification.severity = 'info';
        onMetricsUpdate?.(metricsData);
        break;
    }

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
  }, [lastMessage, onHealthUpdate, onTestResult, onAlert, onMetricsUpdate]);

  const getNotificationIcon = (type: WebSocketMessage['type'], severity: string) => {
    switch (type) {
      case 'health_update':
        return severity === 'success' ? (
          <CheckCircleIcon className="h-4 w-4 text-green-400" />
        ) : severity === 'warning' ? (
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
        ) : (
          <XCircleIcon className="h-4 w-4 text-red-400" />
        );
      case 'test_result':
        return severity === 'success' ? (
          <CheckCircleIcon className="h-4 w-4 text-green-400" />
        ) : (
          <XCircleIcon className="h-4 w-4 text-red-400" />
        );
      case 'alert':
        return <BellIcon className="h-4 w-4 text-orange-400" />;
      case 'metrics_update':
        return <CheckCircleIcon className="h-4 w-4 text-blue-400" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Connection Status Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-2 flex justify-end"
      >
        <div className={`
          flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium
          backdrop-blur-sm border
          ${
            isConnected
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }
        `}>
          {isConnected ? (
            <WifiIcon className="h-3 w-3" />
          ) : (
            <SignalSlashIcon className="h-3 w-3" />
          )}
          <span>{isConnected ? 'Polling Active' : 'Polling Error'}</span>
        </div>
      </motion.div>

      {/* Notifications Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5 text-white" />
            <h3 className="text-sm font-medium text-white">Live Updates</h3>
            {notifications.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refresh}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
              title="Refresh now"
            >
              <ArrowPathIcon className="h-3 w-3" />
              <span>Refresh</span>
            </button>
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        </div>

        {/* Connection Error */}
        {connectionError && (
          <div className="p-3 bg-red-500/10 border-b border-red-500/20">
            <p className="text-xs text-red-400">{connectionError}</p>
          </div>
        )}

        {/* Notifications List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No recent updates
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type, notification.severity)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-400 capitalize">
                                {notification.type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed State - Show Latest Notification */}
        {!isExpanded && notifications.length > 0 && (
          <div className="p-3">
            <div className="flex items-center space-x-3">
              {getNotificationIcon(notifications[0].type, notifications[0].severity)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  {notifications[0].message}
                </p>
                <span className="text-xs text-gray-400">
                  {formatTimestamp(notifications[0].timestamp)}
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RealTimeUpdates;