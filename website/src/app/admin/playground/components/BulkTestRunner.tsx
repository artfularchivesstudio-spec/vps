'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  StopIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CogIcon,
  ChartBarIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { useTestRunner } from '../hooks/useTestRunner';
import { BulkTestConfiguration, TestConfiguration, BulkTestResult } from '@/types/playground';

// Component configurations
const MCP_TOOLS = [
  { name: 'PostgreSQL', description: 'Database query execution', endpoint: '/api/mcp/postgresql' },
  { name: 'YouTube', description: 'Video content analysis', endpoint: '/api/mcp/youtube' },
  { name: 'Memory', description: 'Knowledge graph operations', endpoint: '/api/mcp/memory' },
  { name: 'Time', description: 'Time zone conversions', endpoint: '/api/mcp/time' },
  { name: 'Filesystem', description: 'File system operations', endpoint: '/api/mcp/filesystem' },
  { name: 'iOS Simulator', description: 'iOS app testing', endpoint: '/api/mcp/ios-simulator' },
  { name: 'Sequential Thinking', description: 'Problem-solving workflows', endpoint: '/api/mcp/sequential-thinking' }
];

const CHATGPT_ACTIONS = [
  { name: 'Content Generation', description: 'AI-powered content creation', endpoint: '/api/chatgpt/content' },
  { name: 'Image Analysis', description: 'Visual content processing', endpoint: '/api/chatgpt/image-analysis' },
  { name: 'Code Review', description: 'Automated code analysis', endpoint: '/api/chatgpt/code-review' },
  { name: 'Translation', description: 'Multi-language translation', endpoint: '/api/chatgpt/translation' },
  { name: 'Summarization', description: 'Text summarization', endpoint: '/api/chatgpt/summarization' }
];

interface BulkTestRunnerProps {
  className?: string;
}

export default function BulkTestRunner({ className = '' }: BulkTestRunnerProps) {
  const { runBulkTest, cancelTest, bulkResult, isRunning, progress, error } = useTestRunner();
  
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [bulkConfig, setBulkConfig] = useState({
    parallel_execution: true,
    max_concurrent: 3,
    stop_on_first_failure: false,
    timeout_ms: 10000,
    test_parameters: {}
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'progress' | 'results'>('config');

  const allComponents = useMemo(() => [
    ...MCP_TOOLS.map(tool => ({ ...tool, type: 'mcp_tool' as const })),
    ...CHATGPT_ACTIONS.map(action => ({ ...action, type: 'chatgpt_action' as const }))
  ], []);

  const handleComponentToggle = useCallback((componentName: string) => {
    setSelectedComponents(prev => 
      prev.includes(componentName)
        ? prev.filter(name => name !== componentName)
        : [...prev, componentName]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedComponents.length === allComponents.length) {
      setSelectedComponents([]);
    } else {
      setSelectedComponents(allComponents.map(comp => comp.name));
    }
  }, [selectedComponents.length, allComponents]);

  const handleRunBulkTest = useCallback(async () => {
    if (selectedComponents.length === 0) return;

    const tests: TestConfiguration[] = selectedComponents.map(componentName => {
      const component = allComponents.find(comp => comp.name === componentName);
      return {
        component_type: component?.type || 'mcp_tool',
        component_name: componentName,
        test_parameters: bulkConfig.test_parameters,
        timeout_ms: bulkConfig.timeout_ms,
        retry_count: 1
      };
    });

    const bulkTestConfig: BulkTestConfiguration = {
      tests,
      parallel_execution: bulkConfig.parallel_execution,
      max_concurrent: bulkConfig.max_concurrent,
      stop_on_first_failure: bulkConfig.stop_on_first_failure,
      timeout_ms: bulkConfig.timeout_ms
    };

    setActiveTab('progress');
    await runBulkTest(bulkTestConfig);
    setActiveTab('results');
  }, [selectedComponents, bulkConfig, allComponents, runBulkTest]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'failure':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'cancelled':
        return <StopIcon className="h-5 w-5 text-yellow-400" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Bulk Test Runner</h2>
          <p className="text-gray-400 mt-1">Test multiple components simultaneously with progress tracking</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'config' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <CogIcon className="h-4 w-4 inline mr-2" />
            Config
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'progress' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <ChartBarIcon className="h-4 w-4 inline mr-2" />
            Progress
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'results' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <ListBulletIcon className="h-4 w-4 inline mr-2" />
            Results
          </button>
        </div>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Component Selection */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Select Components</h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">
                  {selectedComponents.length} of {allComponents.length} selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {selectedComponents.length === allComponents.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allComponents.map((component) => (
                <label
                  key={component.name}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedComponents.includes(component.name)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedComponents.includes(component.name)}
                    onChange={() => handleComponentToggle(component.name)}
                    className="text-blue-500 focus:ring-blue-500 focus:ring-2 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{component.name}</div>
                    <div className="text-xs text-gray-400 truncate">{component.description}</div>
                    <div className="text-xs text-blue-400 mt-1">
                      {component.type === 'mcp_tool' ? 'MCP Tool' : 'ChatGPT Action'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Bulk Configuration */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Bulk Test Configuration
              </h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Concurrent Tests
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={bulkConfig.max_concurrent}
                  onChange={(e) => setBulkConfig(prev => ({ ...prev, max_concurrent: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="60000"
                  step="1000"
                  value={bulkConfig.timeout_ms}
                  onChange={(e) => setBulkConfig(prev => ({ ...prev, timeout_ms: parseInt(e.target.value) || 10000 }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={bulkConfig.parallel_execution}
                  onChange={(e) => setBulkConfig(prev => ({ ...prev, parallel_execution: e.target.checked }))}
                  className="text-blue-500 focus:ring-blue-500 focus:ring-2 rounded"
                />
                <span className="text-sm text-gray-300">Enable parallel execution</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={bulkConfig.stop_on_first_failure}
                  onChange={(e) => setBulkConfig(prev => ({ ...prev, stop_on_first_failure: e.target.checked }))}
                  className="text-blue-500 focus:ring-blue-500 focus:ring-2 rounded"
                />
                <span className="text-sm text-gray-300">Stop on first failure</span>
              </label>
            </div>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Test Parameters (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(bulkConfig.test_parameters, null, 2)}
                      onChange={(e) => {
                        try {
                          const params = JSON.parse(e.target.value);
                          setBulkConfig(prev => ({ ...prev, test_parameters: params }));
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

          {/* Run Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedComponents.length > 0 && (
                <span>Ready to test {selectedComponents.length} component{selectedComponents.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {isRunning && (
                <button
                  onClick={() => cancelTest(bulkResult?.bulk_test_id || 'current')}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <StopIcon className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              )}
              <button
                onClick={handleRunBulkTest}
                disabled={selectedComponents.length === 0 || isRunning}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isRunning ? (
                  <ClockIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
                <span>{isRunning ? 'Running Tests...' : 'Run Bulk Test'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Test Progress</h3>
          
          {bulkResult ? (
            <div className="space-y-4">
              {/* Overall Progress */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-400">
                    {bulkResult.completed_tests} / {bulkResult.total_tests} completed
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(bulkResult.completed_tests / bulkResult.total_tests) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-green-400">✓ {bulkResult.successful_tests} passed</span>
                  <span className="text-red-400">✗ {bulkResult.failed_tests} failed</span>
                  <span className="text-yellow-400">⏸ {bulkResult.cancelled_tests} cancelled</span>
                </div>
              </div>

              {/* Individual Test Results */}
              {bulkResult.individual_results.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white font-medium">Individual Results</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {bulkResult.individual_results.map((result, index) => (
                      <div
                        key={result.test_id}
                        className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <div className="text-white text-sm font-medium">{result.component_name}</div>
                            <div className="text-xs text-gray-400 capitalize">{result.status}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">{formatDuration(result.duration_ms)}</div>
                          {result.error_message && (
                            <div className="text-xs text-red-400 truncate max-w-32" title={result.error_message}>
                              {result.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No bulk test in progress</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Test Results</h3>
          
          {bulkResult ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{bulkResult.total_tests}</div>
                  <div className="text-sm text-gray-400">Total Tests</div>
                </div>
                <div className="bg-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{bulkResult.successful_tests}</div>
                  <div className="text-sm text-gray-400">Passed</div>
                </div>
                <div className="bg-red-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{bulkResult.failed_tests}</div>
                  <div className="text-sm text-gray-400">Failed</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {bulkResult.duration_ms ? formatDuration(bulkResult.duration_ms) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">Duration</div>
                </div>
              </div>

              {/* Detailed Results */}
              {bulkResult.individual_results.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white font-medium">Detailed Results</h4>
                  <div className="space-y-2">
                    {bulkResult.individual_results.map((result) => (
                      <div
                        key={result.test_id}
                        className="p-4 bg-gray-700/30 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(result.status)}
                            <div>
                              <div className="text-white font-medium">{result.component_name}</div>
                              <div className="text-xs text-gray-400">{result.component_type}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-300">{formatDuration(result.duration_ms)}</div>
                            <div className="text-xs text-gray-400">{new Date(result.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </div>
                        
                        {result.error_message && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                            {result.error_message}
                          </div>
                        )}
                        
                        {result.response_data && (
                          <details className="mt-2">
                            <summary className="text-sm text-blue-400 cursor-pointer hover:text-blue-300">
                              View Response Data
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300 overflow-x-auto">
                              {JSON.stringify(result.response_data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No test results available</p>
              <p className="text-sm text-gray-500 mt-2">Run a bulk test to see results here</p>
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
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <span className="text-red-400 font-medium">Error</span>
          </div>
          <p className="text-red-300 mt-2">{error}</p>
        </motion.div>
      )}
    </div>
  );
}