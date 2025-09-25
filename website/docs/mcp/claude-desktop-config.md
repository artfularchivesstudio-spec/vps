# Claude Desktop MCP Configuration

This guide explains how to configure Claude Desktop to use the Artful Archives MCP server for advanced content management workflows.

## Overview

The Model Context Protocol (MCP) allows Claude to interact directly with your Artful Archives system, providing more sophisticated automation and workflow capabilities than ChatGPT Actions.

## Prerequisites

1. **Claude Desktop App** - Download from [Claude.ai](https://claude.ai/download)
2. **API Key** - Generate an MCP API key with `admin:full` scope
3. **Node.js** - Required to run the MCP server

## Step 1: Generate MCP API Key

Create a dedicated API key for MCP usage:

```typescript
// Using the External API Auth system
import { externalAPIAuth } from '@/lib/external-api/auth'

const { apiKey, id } = await externalAPIAuth.createApiKey(
  'Claude MCP Server',
  ['admin:full'], // Full access for MCP
  2000 // Higher rate limit for MCP
)

console.log('MCP API Key:', apiKey)
```

**Important**: Store this API key securely. It will be used in the MCP server configuration.

## Step 2: Configure Claude Desktop

### 2.1 Find Configuration File

Claude Desktop configuration is stored in:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 2.2 Add MCP Server Configuration

Add the Artful Archives MCP server to your configuration:

```json
{
  "mcpServers": {
    "artful-archives": {
      "command": "node",
      "args": [
        "/path/to/artful-archives-website/scripts/mcp-server.js"
      ],
      "env": {
        "ARTFUL_ARCHIVES_MCP_API_KEY": "your-mcp-api-key-here",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 2.3 Alternative: Global Installation

You can also install the MCP server globally:

```bash
# From the project root
npm install -g .

# Then use global command
{
  "mcpServers": {
    "artful-archives": {
      "command": "artful-archives-mcp",
      "env": {
        "ARTFUL_ARCHIVES_MCP_API_KEY": "your-mcp-api-key-here"
      }
    }
  }
}
```

## Step 3: Test the Integration

### 3.1 Restart Claude Desktop

1. Close Claude Desktop completely
2. Restart the application
3. Check the MCP connection status

### 3.2 Test Basic Functionality

Try these prompts with Claude Desktop:

```
User: "Can you help me analyze an artwork and create a blog post?"
Claude: "I can help you analyze artwork and create blog posts using the Artful Archives system. Would you like to upload an image for analysis?"

User: "Create a blog post about contemporary art trends"
Claude: [Uses create_blog_post tool] "I've created a blog post about contemporary art trends. Here are the details..." [Shows post information]

User: "Generate audio narration for that post"
Claude: [Uses generate_audio_narration tool] "I've generated an audio narration for your blog post..." [Shows audio details]

User: "Publish the post"
Claude: [Uses publish_content tool] "Your blog post has been published successfully! You can view it at [URL]"
```

## Step 4: Advanced MCP Features

### 4.1 Content Search and Analysis

```
User: "Show me all blog posts about abstract art from the last month"
Claude: [Uses search_content tool] "Here are the abstract art posts from the last month..." [Shows filtered results]

User: "What are the performance metrics for my most recent post?"
Claude: [Uses get_analytics tool] "Here are the performance metrics for your recent post..." [Shows analytics]
```

### 4.2 Media Management

```
User: "List all my uploaded images"
Claude: [Uses manage_media_assets tool with action='list'] "Here are your uploaded images..." [Shows media list]

User: "Find images tagged with 'sculpture'"
Claude: [Uses manage_media_assets tool with action='search'] "Here are images tagged with 'sculpture'..." [Shows search results]
```

### 4.3 Batch Operations

```
User: "Create blog posts for all my draft analyses"
Claude: [Uses search_content and create_blog_post tools] "I found 5 draft analyses. Creating blog posts for each..." [Shows batch results]
```

## Step 5: Troubleshooting

### Common Issues

**MCP Server Not Starting**
- Check API key validity
- Verify Node.js installation
- Check file permissions
- Review error logs

**Connection Errors**
- Ensure correct configuration path
- Restart Claude Desktop
- Check network connectivity
- Verify API key permissions

**Tool Execution Failures**
- Check API rate limits
- Verify required data exists
- Review tool parameters
- Check server logs

### Debug Mode

Enable debug logging by adding to your configuration:

```json
{
  "mcpServers": {
    "artful-archives": {
      "command": "node",
      "args": [
        "/path/to/scripts/mcp-server.js"
      ],
      "env": {
        "ARTFUL_ARCHIVES_MCP_API_KEY": "your-api-key",
        "MCP_DEBUG": "true",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Log Files

Check these locations for logs:
- MCP server logs: Console output
- Claude Desktop logs: Application logs
- API request logs: Database `api_request_logs` table

## Step 6: Advanced Configuration

### 6.1 Multiple Environments

Configure different environments:

```json
{
  "mcpServers": {
    "artful-archives-dev": {
      "command": "node",
      "args": ["/path/to/mcp-server.js"],
      "env": {
        "ARTFUL_ARCHIVES_MCP_API_KEY": "dev-api-key",
        "NODE_ENV": "development",
        "NEXT_PUBLIC_BASE_URL": "http://localhost:3000"
      }
    },
    "artful-archives-prod": {
      "command": "node", 
      "args": ["/path/to/mcp-server.js"],
      "env": {
        "ARTFUL_ARCHIVES_MCP_API_KEY": "prod-api-key",
        "NODE_ENV": "production",
        "NEXT_PUBLIC_BASE_URL": "https://artfularchivesstudio.com"
      }
    }
  }
}
```

### 6.2 Performance Optimization

```json
{
  "mcpServers": {
    "artful-archives": {
      "command": "node",
      "args": ["--max-old-space-size=2048", "/path/to/mcp-server.js"],
      "env": {
        "ARTFUL_ARCHIVES_MCP_API_KEY": "your-api-key",
        "MCP_RATE_LIMIT": "5000",
        "MCP_CACHE_SIZE": "100"
      }
    }
  }
}
```

### 6.3 Security Hardening

```json
{
  "mcpServers": {
    "artful-archives": {
      "command": "node",
      "args": ["/path/to/mcp-server.js"],
      "env": {
        "ARTFUL_ARCHIVES_MCP_API_KEY": "your-api-key",
        "MCP_ALLOWED_ORIGINS": "claude-desktop",
        "MCP_SECURITY_MODE": "strict"
      }
    }
  }
}
```

## Step 7: Workflow Examples

### 7.1 Complete Content Creation Workflow

```
User: "I have some artwork photos in my gallery folder. Can you create blog posts for all of them?"

Claude: "I'll help you create blog posts for all your artwork photos. Let me start by listing your media assets to find the photos..."

[Uses manage_media_assets with action='list']
[Uses analyze_artwork for each image]
[Uses create_blog_post for each analysis]
[Uses generate_audio_narration for each post]
[Uses publish_content for approved posts]

"I've processed 8 artwork photos and created blog posts for each. Here's a summary of what was created..."
```

### 7.2 Content Optimization Workflow

```
User: "Optimize my recent blog posts for better engagement"

Claude: "I'll analyze your recent posts and optimize them for better engagement..."

[Uses search_content to find recent posts]
[Uses get_analytics to check performance]
[Uses analyze_artwork to re-analyze images]
[Uses create_blog_post to create optimized versions]
[Uses publish_content to update posts]

"I've optimized 5 recent posts with improved titles, better content structure, and enhanced SEO..."
```

### 7.3 Performance Monitoring Workflow

```
User: "Give me a comprehensive report on my content performance"

Claude: "I'll generate a comprehensive performance report for your content..."

[Uses get_analytics with different metric types]
[Uses search_content to analyze content distribution]
[Uses manage_media_assets to check media usage]

"Here's your comprehensive content performance report with insights and recommendations..."
```

## Step 8: Best Practices

### 8.1 Workflow Design

- Start with simple operations
- Build complex workflows incrementally
- Test each step thoroughly
- Handle errors gracefully

### 8.2 Performance Optimization

- Use batch operations when possible
- Cache frequently accessed data
- Monitor API rate limits
- Optimize database queries

### 8.3 Security Considerations

- Use minimal required permissions
- Regularly rotate API keys
- Monitor access logs
- Implement rate limiting

### 8.4 Maintenance

- Keep MCP server updated
- Monitor system resources
- Regular backup procedures
- Performance monitoring

## Step 9: Integration with Other Tools

### 9.1 Automation Scripts

```javascript
// Example: Automated content pipeline
const pipeline = {
  schedule: 'daily',
  tasks: [
    'analyze_new_images',
    'create_draft_posts', 
    'generate_audio',
    'review_for_publishing'
  ]
}
```

### 9.2 External APIs

```javascript
// Example: Social media integration
const socialIntegration = {
  platforms: ['twitter', 'instagram', 'facebook'],
  autoPost: true,
  schedule: 'after_publish'
}
```

## Support and Resources

### Documentation
- [MCP Protocol Specification](https://modelcontextprotocol.io/docs)
- [Claude Desktop Documentation](https://claude.ai/docs)
- [Artful Archives API Reference](/docs/api/)

### Community
- [MCP GitHub Repository](https://github.com/modelcontextprotocol/servers)
- [Claude Discord Community](https://discord.gg/claude)
- [Artful Archives Support](mailto:support@artfularchivesstudio.com)

The MCP integration provides powerful automation capabilities that go beyond simple API calls, enabling sophisticated content management workflows that adapt to your specific needs and preferences.