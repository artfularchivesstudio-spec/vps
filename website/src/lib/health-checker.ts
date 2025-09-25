import { AIIntegrationHealth } from '@/types/playground';

// MCP Server health check configurations
interface MCPHealthConfig {
  server_name: string;
  tool_name: string;
  test_args?: any;
  test_query?: string;
}

const MCP_HEALTH_CONFIGS: Record<string, MCPHealthConfig> = {
  'PostgreSQL': {
    server_name: 'mcp.config.usrlocalmcp.PostgreSQL',
    tool_name: 'query',
    test_args: { sql: 'SELECT 1 as health_check' }
  },
  'YouTube': {
    server_name: 'mcp.config.usrlocalmcp.youtube',
    tool_name: 'install_repo_mcp_server',
    test_args: { name: '@modelcontextprotocol/server-everything' }
  },
  'Memory': {
    server_name: 'mcp.config.usrlocalmcp.memory',
    tool_name: 'read_graph',
    test_args: {}
  },
  'Time': {
    server_name: 'mcp.config.usrlocalmcp.time',
    tool_name: 'get_current_time',
    test_args: { timezone: 'America/New_York' }
  },
  'Filesystem': {
    server_name: 'mcp.config.usrlocalmcp.filesystem',
    tool_name: 'list_allowed_directories',
    test_args: {}
  },
  'iOS Simulator': {
    server_name: 'mcp.config.usrlocalmcp.ios-simulator',
    tool_name: 'get_booted_sim_id',
    test_args: {}
  },
  'Sequential Thinking': {
    server_name: 'mcp.config.usrlocalmcp.sequentialthinking',
    tool_name: 'sequentialthinking',
    test_args: {
      thought: 'Health check test',
      nextThoughtNeeded: false,
      thoughtNumber: 1,
      totalThoughts: 1
    }
  }
};

// ChatGPT Actions health check configurations
interface ChatGPTHealthConfig {
  endpoint: string;
  test_data: {
    component_name: string;
    component_type: string;
    test_parameters: any;
  };
}

const CHATGPT_HEALTH_CONFIGS: Record<string, ChatGPTHealthConfig> = {
  'Document Analysis': {
    endpoint: '/api/playground/test/individual',
    test_data: {
      component_name: 'Document Analysis',
      component_type: 'chatgpt_action',
      test_parameters: { document: 'Health check test document' }
    }
  },
  'Code Review': {
    endpoint: '/api/playground/test/individual',
    test_data: {
      component_name: 'Code Review',
      component_type: 'chatgpt_action',
      test_parameters: { code: 'console.log("health check");' }
    }
  },
  'Content Generation': {
    endpoint: '/api/playground/test/individual',
    test_data: {
      component_name: 'Content Generation',
      component_type: 'chatgpt_action',
      test_parameters: { prompt: 'Generate a health check message' }
    }
  },
  'Data Processing': {
    endpoint: '/api/playground/test/individual',
    test_data: {
      component_name: 'Data Processing',
      component_type: 'chatgpt_action',
      test_parameters: { data: [1, 2, 3, 4, 5] }
    }
  },
  'API Integration': {
    endpoint: '/api/playground/test/individual',
    test_data: {
      component_name: 'API Integration',
      component_type: 'chatgpt_action',
      test_parameters: { api_endpoint: 'https://api.example.com/health' }
    }
  }
};

// Health check timeout in milliseconds
const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds

/**
 * Perform health check for an MCP tool
 */
export async function checkMCPToolHealth(toolName: string): Promise<AIIntegrationHealth> {
  const startTime = Date.now();
  const now = new Date().toISOString();
  
  const config = MCP_HEALTH_CONFIGS[toolName];
  if (!config) {
    return {
      id: `mcp_tool_${toolName.toLowerCase().replace(/\s+/g, '_')}`,
      component_name: toolName,
      component_type: 'mcp_tool',
      status: 'error',
      last_checked_at: now,
      response_time_ms: 0,
      error_message: `No health check configuration found for ${toolName}`,
      error_code: 'CONFIG_NOT_FOUND',
      created_at: now,
      updated_at: now,
      metadata: {}
    };
  }

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT);
    });

    // Create the MCP call promise
    const mcpCallPromise = fetch('/api/mcp-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        server_name: config.server_name,
        tool_name: config.tool_name,
        args: config.test_args || {}
      })
    });

    // Race between the MCP call and timeout
    const response = await Promise.race([mcpCallPromise, timeoutPromise]) as Response;
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Determine status based on response time and result
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    let errorMessage: string | null = null;
    let errorCode: string | null = null;

    if (result.error) {
      status = 'error';
      errorMessage = result.error;
      errorCode = 'MCP_ERROR';
    } else if (responseTime > 5000) {
      status = 'warning';
      errorMessage = 'Slow response time detected';
      errorCode = 'SLOW_RESPONSE';
    }

    return {
      id: `mcp_tool_${toolName.toLowerCase().replace(/\s+/g, '_')}`,
      component_name: toolName,
      component_type: 'mcp_tool',
      status,
      last_checked_at: now,
      response_time_ms: responseTime,
      error_message: errorMessage,
      error_code: errorCode,
      created_at: now,
      updated_at: now,
      metadata: {
        server_name: config.server_name,
        tool_name: config.tool_name,
        last_successful_test: status !== 'error' ? now : undefined
      }
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      id: `mcp_tool_${toolName.toLowerCase().replace(/\s+/g, '_')}`,
      component_name: toolName,
      component_type: 'mcp_tool',
      status: 'error',
      last_checked_at: now,
      response_time_ms: responseTime,
      error_message: errorMessage,
      error_code: errorMessage.includes('timeout') ? 'TIMEOUT' : 'CONNECTION_ERROR',
      created_at: now,
      updated_at: now,
      metadata: {
        server_name: config.server_name,
        tool_name: config.tool_name
      }
    };
  }
}

/**
 * Perform health check for a ChatGPT action
 */
export async function checkChatGPTActionHealth(actionName: string): Promise<AIIntegrationHealth> {
  const startTime = Date.now();
  const now = new Date().toISOString();
  
  const config = CHATGPT_HEALTH_CONFIGS[actionName];
  if (!config) {
    return {
      id: `chatgpt_action_${actionName.toLowerCase().replace(/\s+/g, '_')}`,
      component_name: actionName,
      component_type: 'chatgpt_action',
      status: 'error',
      last_checked_at: now,
      response_time_ms: 0,
      error_message: `No health check configuration found for ${actionName}`,
      error_code: 'CONFIG_NOT_FOUND',
      created_at: now,
      updated_at: now,
      metadata: {}
    };
  }

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT);
    });

    // Create the API call promise
    const apiCallPromise = fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config.test_data)
    });

    // Race between the API call and timeout
    const response = await Promise.race([apiCallPromise, timeoutPromise]) as Response;
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Determine status based on response time and result
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    let errorMessage: string | null = null;
    let errorCode: string | null = null;

    if (!result.success) {
      status = 'error';
      errorMessage = result.error || 'Test execution failed';
      errorCode = 'TEST_FAILED';
    } else if (responseTime > 8000) {
      status = 'warning';
      errorMessage = 'Slow response time detected';
      errorCode = 'SLOW_RESPONSE';
    }

    return {
      id: `chatgpt_action_${actionName.toLowerCase().replace(/\s+/g, '_')}`,
      component_name: actionName,
      component_type: 'chatgpt_action',
      status,
      last_checked_at: now,
      response_time_ms: responseTime,
      error_message: errorMessage,
      error_code: errorCode,
      created_at: now,
      updated_at: now,
      metadata: {
        endpoint: config.endpoint,
        last_successful_test: status !== 'error' ? now : undefined
      }
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      id: `chatgpt_action_${actionName.toLowerCase().replace(/\s+/g, '_')}`,
      component_name: actionName,
      component_type: 'chatgpt_action',
      status: 'error',
      last_checked_at: now,
      response_time_ms: responseTime,
      error_message: errorMessage,
      error_code: errorMessage.includes('timeout') ? 'TIMEOUT' : 'CONNECTION_ERROR',
      created_at: now,
      updated_at: now,
      metadata: {
        endpoint: config.endpoint
      }
    };
  }
}

/**
 * Perform health checks for all components
 */
export async function performAllHealthChecks(): Promise<AIIntegrationHealth[]> {
  const mcpTools = Object.keys(MCP_HEALTH_CONFIGS);
  const chatgptActions = Object.keys(CHATGPT_HEALTH_CONFIGS);

  // Run all health checks in parallel
  const mcpHealthPromises = mcpTools.map(tool => checkMCPToolHealth(tool));
  const chatgptHealthPromises = chatgptActions.map(action => checkChatGPTActionHealth(action));

  const [mcpResults, chatgptResults] = await Promise.all([
    Promise.allSettled(mcpHealthPromises),
    Promise.allSettled(chatgptHealthPromises)
  ]);

  // Extract successful results and handle failures
  const allResults: AIIntegrationHealth[] = [];

  mcpResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allResults.push(result.value);
    } else {
      // Create error result for failed health check
      const toolName = mcpTools[index];
      allResults.push({
        id: `mcp_tool_${toolName.toLowerCase().replace(/\s+/g, '_')}`,
        component_name: toolName,
        component_type: 'mcp_tool',
        status: 'error',
        last_checked_at: new Date().toISOString(),
        response_time_ms: 0,
        error_message: `Health check failed: ${result.reason}`,
        error_code: 'HEALTH_CHECK_FAILED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      });
    }
  });

  chatgptResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allResults.push(result.value);
    } else {
      // Create error result for failed health check
      const actionName = chatgptActions[index];
      allResults.push({
        id: `chatgpt_action_${actionName.toLowerCase().replace(/\s+/g, '_')}`,
        component_name: actionName,
        component_type: 'chatgpt_action',
        status: 'error',
        last_checked_at: new Date().toISOString(),
        response_time_ms: 0,
        error_message: `Health check failed: ${result.reason}`,
        error_code: 'HEALTH_CHECK_FAILED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      });
    }
  });

  return allResults;
}