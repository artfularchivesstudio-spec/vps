#!/usr/bin/env node

/**
 * Claude MCP Server CLI
 * 
 * This script starts the Artful Archives MCP server for Claude integration.
 * It can be used standalone or integrated with Claude Desktop.
 */

const { startMCPServer } = require('../src/lib/mcp/server.ts')
const process = require('process')

// Configuration
const config = {
  name: 'artful-archives-mcp',
  version: '1.0.0',
  apiKey: process.env.ARTFUL_ARCHIVES_MCP_API_KEY,
  rateLimitOverride: process.env.MCP_RATE_LIMIT ? parseInt(process.env.MCP_RATE_LIMIT) : undefined
}

// Validate configuration
if (!config.apiKey) {
  console.error('Error: ARTFUL_ARCHIVES_MCP_API_KEY environment variable is required')
  console.error('Please set it to a valid API key with admin:full scope')
  process.exit(1)
}

// Start server
async function main() {
  try {
    console.log('Starting Artful Archives MCP Server...')
    console.log(`Config: ${JSON.stringify({
      name: config.name,
      version: config.version,
      hasApiKey: !!config.apiKey,
      rateLimit: config.rateLimitOverride
    }, null, 2)}`)

    const server = await startMCPServer(config)
    
    // Server runs indefinitely
    console.log('MCP Server is running. Press Ctrl+C to stop.')
    
    // Keep process alive
    await new Promise((resolve) => {
      process.on('SIGINT', resolve)
      process.on('SIGTERM', resolve)
    })
    
  } catch (error) {
    console.error('Failed to start MCP server:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}