'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { TestConfiguration, TestResult, MCPToolConfig, ChatGPTActionConfig } from '@/types/playground';
import { useTestRunner } from '../hooks/useTestRunner';

interface TestRunnerProps {
  onTestComplete?: (result: TestResult) => void;
  onTestStart?: (config: TestConfiguration) => void;
}

const TestRunner: React.FC<TestRunnerProps> = ({ onTestComplete, onTestStart }) => {
  const {
    currentTest,
    testResult,
    isRunning,
    error,
    runIndividualTest,
    cancelTest
  } = useTestRunner();

  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [testConfig, setTestConfig] = useState({
    timeout_ms: 30000,
    retry_count: 1,
    test_parameters: {} as Record<string, any>
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Mock component configurations
  const mcpTools: MCPToolConfig[] = [
    { name: 'PostgreSQL', endpoint: '/api/mcp/postgresql', description: 'Database query operations', parameters: {}, timeout_ms: 30000, retry_count: 1 },
    { name: 'YouTube', endpoint: '/api/mcp/youtube', description: 'YouTube data retrieval', parameters: {}, timeout_ms: 30000, retry_count: 1 },
    { name: 'Memory', endpoint: '/api/mcp/memory', description: 'Knowledge graph operations', parameters: {}, timeout_ms: 30000, retry_count: 1 },
    { name: 'Time', endpoint: '/api/mcp/time', description: 'Time zone conversions', parameters: {}, timeout_ms: 30000, retry_count: 1 },
    { name: 'Filesystem', endpoint: '/api/mcp/filesystem', description: 'File system operations', parameters: {}, timeout_ms: 30000, retry_count: 1 },
    { name: 'iOS Simulator', endpoint: '/api/mcp/ios-simulator', description: 'iOS app testing', parameters: {}, timeout_ms: 30000, retry_count: 1 },
    { name: 'Sequential Thinking', endpoint: '/api/mcp/sequential-thinking', description: 'Problem-solving workflows', parameters: {}, timeout_ms: 30000, retry_count: 1 }
  ];

  const chatgptActions: ChatGPTActionConfig[] = [
    { name: 'Content Generation', endpoint: '/api/chatgpt/content', description: 'Generate blog content', method: 'POST', headers: {}, parameters: {}, timeout_ms: 30000, retry_count: 1 },
    { name: 'SEO Optimization', endpoint: '/api/chatgpt/seo', description: 'Optimize content for SEO', method: 'POST', headers: {}, parameters: {}, timeout_ms: 30000, retry_count: 1 },
    { name: 'Image Analysis', endpoint: '/api/chatgpt/image', description: 'Analyze and describe images', method: 'POST', headers: {}, parameters: {}, timeout_ms: 30000, retry_count: 1 },
    { name: 'Code Review', endpoint: '/api/chatgpt/code', description: 'Review and improve code', method: 'POST', headers: {}, parameters: {}, timeout_ms: 30000, retry_count: 1 },
    { name: 'Translation', endpoint: '/api/chatgpt/translate', description: 'Translate content', method: 'POST', headers: {}, parameters: {}, timeout_ms: 30000, retry_count: 1 }
  ];

  const allComponents = [...mcpTools, ...chatgptActions];

  const handleRunTest = async () => {
    if (!selectedComponent) return;

    const component = allComponents.find(c => c.name === selectedComponent);
    if (!component) return;

    const componentType = mcpTools.find(t => t.name === component.name) ? 'mcp_tool' : 'chatgpt_action';
    
    const config: TestConfiguration = {
      component_name: component.name,
      component_type: componentType,
      test_parameters: testConfig.test_parameters || {},
      timeout_ms: testConfig.timeout_ms || 30000,
      retry_count: testConfig.retry_count || 1
    };

    onTestStart?.(config);
    const result = await runIndividualTest(config);
    if (result) {
      onTestComplete?.(result);
    }
  };

  const handleParameterChange = (key: string, value: any) => {
    setTestConfig(prev => ({
      ...prev,
      test_parameters: {
        ...prev.test_parameters,
        [key]: value
      }
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-400 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const selectedComponentConfig = allComponents.find(c => c.name === selectedComponent);

  return (
    <div className="space-y-6">
      {/* Component Selection */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <CogIcon className="h-5 w-5 mr-2" />
          Component Selection
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MCP Tools */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">MCP Server Tools</h4>
            <div className="space-y-2">
              {mcpTools.map((tool) => (
                <label key={tool.name} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="component"
                    value={tool.name}
                    checked={selectedComponent === tool.name}
                    onChange={(e) => setSelectedComponent(e.target.value)}
                    className="text-blue-500 focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{tool.name}</div>
                    <div className="text-xs text-gray-400">{tool.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ChatGPT Actions */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">ChatGPT Actions</h4>
            <div className="space-y-2">
              {chatgptActions.map((action) => (
                <label key={action.name} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="component"
                    value={action.name}
                    checked={selectedComponent === action.name}
                    onChange={(e) => setSelectedComponent(e.target.value)}
                    className="text-blue-500 focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{action.name}</div>
                    <div className="text-xs text-gray-400">{action.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Test Configuration */}
      {selectedComponent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Test Configuration
            </h3>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
          </div>

          <div className="space-y-4">
            {/* Basic Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={testConfig.timeout_ms || 30000}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, timeout_ms: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1000"
                  max="300000"
                  step="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Retries
                </label>
                <input
                  type="number"
                  value={testConfig.retry_count || 1}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, retry_count: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="5"
                />
              </div>
            </div>

            {/* Advanced Configuration */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Test Parameters (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(testConfig.test_parameters, null, 2)}
                      onChange={(e) => {
                        try {
                          const params = JSON.parse(e.target.value);
                          setTestConfig(prev => ({ ...prev, test_parameters: params }));
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      rows={4}
                      placeholder='{"key": "value"}'
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Run Test Button */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              {selectedComponentConfig && (
                <span>Testing: {selectedComponentConfig.endpoint}</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {isRunning && (
                <button
                  onClick={() => cancelTest('current')}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <StopIcon className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              )}
              <button
                onClick={handleRunTest}
                disabled={!selectedComponent || isRunning}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isRunning ? (
                  <ClockIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
                <span>{isRunning ? 'Running...' : 'Run Test'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Test Status */}
      {(currentTest || testResult) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Current Test</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(testResult?.status || (isRunning ? 'running' : 'pending'))}
              <div>
                <div className="text-white font-medium">{currentTest?.component_name || testResult?.component_name}</div>
                <div className="text-sm text-gray-400 capitalize">{testResult?.status || (isRunning ? 'running' : 'pending')}</div>
              </div>
            </div>
            {testResult?.duration_ms && (
              <div className="text-sm text-gray-400">
                {formatDuration(testResult.duration_ms)}
              </div>
            )}
          </div>
          {testResult?.error_message && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-red-400">Error</div>
                  <div className="text-sm text-red-300 mt-1">{testResult.error_message}</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
        >
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-400">Test Runner Error</div>
              <div className="text-sm text-red-300 mt-1">{error}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Test Result */}
      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Test Result</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(testResult.status)}
                <div>
                  <div className="text-white font-medium">{testResult.component_name}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(testResult.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {formatDuration(testResult.duration_ms)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TestRunner;