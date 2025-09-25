import { NextRequest, NextResponse } from 'next/server';

/**
 * MCP Proxy API - Provides a way to test MCP server tools for health monitoring
 * This is a simplified proxy that simulates MCP server calls for health checks
 */

// Simulate MCP server responses for health checking
const simulateMCPCall = async (serverName: string, toolName: string, args: any) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
  
  // Simulate different response scenarios based on server and tool
  const responses: Record<string, any> = {
    'mcp.config.usrlocalmcp.PostgreSQL': {
      query: {
        success: true,
        data: [{ health_check: 1 }],
        rows_affected: 1
      }
    },
    'mcp.config.usrlocalmcp.youtube': {
      install_repo_mcp_server: {
        success: true,
        message: 'MCP server package found',
        package_info: {
          name: '@modelcontextprotocol/server-everything',
          version: 'latest'
        }
      }
    },
    'mcp.config.usrlocalmcp.memory': {
      read_graph: {
        success: true,
        data: {
          entities: [],
          relations: [],
          total_entities: 0,
          total_relations: 0
        }
      }
    },
    'mcp.config.usrlocalmcp.time': {
      get_current_time: {
        success: true,
        data: {
          timezone: args.timezone || 'America/New_York',
          current_time: new Date().toISOString(),
          formatted_time: new Date().toLocaleString('en-US', {
            timeZone: args.timezone || 'America/New_York'
          })
        }
      }
    },
    'mcp.config.usrlocalmcp.filesystem': {
      list_allowed_directories: {
        success: true,
        data: {
          allowed_directories: [
            '/Users/admin/Developer/artful-archives-website',
            '/tmp',
            '/var/tmp'
          ]
        }
      }
    },
    'mcp.config.usrlocalmcp.ios-simulator': {
      get_booted_sim_id: {
        success: true,
        data: {
          simulator_id: 'ABCD1234-5678-90EF-GHIJ-KLMNOPQRSTUV',
          device_name: 'iPhone 15 Pro',
          ios_version: '17.0'
        }
      }
    },
    'mcp.config.usrlocalmcp.sequentialthinking': {
      sequentialthinking: {
        success: true,
        data: {
          thought: args.thought || 'Health check test',
          thought_number: args.thoughtNumber || 1,
          next_thought_needed: args.nextThoughtNeeded || false,
          analysis: 'Health check completed successfully'
        }
      }
    }
  };

  // Get the response for this server and tool
  const serverResponse = responses[serverName];
  if (!serverResponse) {
    throw new Error(`Unknown MCP server: ${serverName}`);
  }

  const toolResponse = serverResponse[toolName];
  if (!toolResponse) {
    throw new Error(`Unknown tool '${toolName}' for server '${serverName}'`);
  }

  // Simulate occasional failures for realistic testing
  const failureRate = 0.1; // 10% failure rate
  if (Math.random() < failureRate) {
    throw new Error(`Simulated failure for ${serverName}:${toolName}`);
  }

  return toolResponse;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { server_name, tool_name, args = {} } = body;

    if (!server_name || !tool_name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'server_name and tool_name are required' 
        },
        { status: 400 }
      );
    }

    // Simulate the MCP call
    const result = await simulateMCPCall(server_name, tool_name, args);

    return NextResponse.json({
      success: true,
      data: result,
      server_name,
      tool_name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP Proxy error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET method for basic health check of the proxy itself
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'MCP Proxy is operational',
    available_servers: [
      'mcp.config.usrlocalmcp.PostgreSQL',
      'mcp.config.usrlocalmcp.youtube',
      'mcp.config.usrlocalmcp.memory',
      'mcp.config.usrlocalmcp.time',
      'mcp.config.usrlocalmcp.filesystem',
      'mcp.config.usrlocalmcp.ios-simulator',
      'mcp.config.usrlocalmcp.sequentialthinking'
    ],
    timestamp: new Date().toISOString()
  });
}