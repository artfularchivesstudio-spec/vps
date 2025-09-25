# Cipher Memory Setup Guide

This guide explains how to set up and use Cipher for persistent AI memory across development sessions in the Artful Archives Studio project.

## What is Cipher?

Cipher is an open-source memory layer designed for AI coding agents that provides:
- 🧠 Persistent memory across sessions
- 🔌 MCP (Model Context Protocol) integration
- 🔄 Context switching between IDEs  
- 🤝 Real-time memory sharing for development teams
- 📚 Knowledge graph and vector storage capabilities

## Installation & Setup

### 1. Install Cipher Globally

```bash
npm install -g @byterover/cipher
```

### 2. Configure API Keys

Add your API keys to the `.env` file in the project root:

```bash
# API Keys for Cipher
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Project Configuration

The project includes a configured `memAgent/cipher.yml` file with:

```yaml
llm:
  provider: openai
  model: gpt-4o-mini
  apiKey: $OPENAI_API_KEY
  maxIterations: 50

systemPrompt: |
  You are Claude Code, working on the Artful Archives Studio website. 
  This is a sophisticated Next.js 14 application with Supabase backend, 
  AI-powered content generation, and comprehensive admin dashboard.

mcpServers:
  filesystem:
    type: stdio
    command: npx
    args:
      - -y
      - '@modelcontextprotocol/server-filesystem'
      - '.'

chatHistory:
  maxMessages: 100
  persistSessions: true

workspace:
  trackFiles: true
  maxFileSize: 1048576 # 1MB
  excludePatterns:
    - node_modules/**
    - .next/**
    - temp_cipher/**
```

### 4. MCP Integration with Claude Code

Cipher has been configured as an MCP server for Claude Code:

```bash
claude mcp add cipher --env OPENAI_API_KEY=your_openai_api_key_here -- cipher --mode mcp --agent memAgent/cipher.yml
```

Verify the connection:
```bash
claude mcp list
# Should show: cipher: cipher --mode mcp --agent memAgent/cipher.yml - ✓ Connected
```

## Usage

### Command Line Interface

Store project context in memory:
```bash
cipher -a memAgent/cipher.yml "Remember key project details..." --new-session session-name
```

Query memory:
```bash
cipher -a memAgent/cipher.yml "What do you remember about this project?" session-name
```

### MCP Server Mode

Run Cipher as an MCP server:
```bash
cipher --mode mcp --agent memAgent/cipher.yml
```

### Web UI Mode

Launch the web interface:
```bash
cipher --mode ui --agent memAgent/cipher.yml
```
- Web UI: http://localhost:3000
- API Server: http://localhost:3001

## Key Features

### Memory Persistence
- **SQLite Backend**: Local database for session storage
- **Vector Storage**: Dual collection system for knowledge and reflections
- **Session Management**: Persistent sessions across restarts
- **Context Retention**: Maintains conversation history and project context

### MCP Integration
- **Filesystem Access**: Direct file system operations
- **Real-time Updates**: Live tool execution notifications
- **Error Handling**: Comprehensive error management
- **Session Management**: Multiple session support

### AI Memory Capabilities
- **Programming Concepts**: Remembers code patterns and architecture decisions
- **Past Interactions**: Maintains history of development sessions
- **Reasoning Steps**: Tracks decision-making processes
- **Project Context**: Understands ongoing tasks and goals

## Project Context

Cipher has been configured with specific knowledge about the Artful Archives Studio project:

- **Architecture**: Next.js 14 + Supabase backend
- **Features**: AI blog creation wizard, TTS audio generation, admin dashboard
- **Testing**: Playwright E2E and Vitest unit testing
- **Recent Work**: Auto-save duplicate fixes, completion celebrations, Vercel deployment
- **Development Patterns**: Component structure, API routes, database schema

## Benefits for Development

1. **Context Continuity**: Maintains understanding across multiple sessions
2. **Decision Memory**: Remembers why certain architectural choices were made
3. **Task Tracking**: Keeps track of ongoing TODO items and project goals
4. **Knowledge Sharing**: Can share context between team members
5. **Enhanced Productivity**: Reduces time spent re-explaining project context

## File Structure

```
artful-archives-website/
├── memAgent/
│   └── cipher.yml           # Cipher configuration
├── docs/
│   └── cipher-memory-setup.md  # This documentation
├── .env                     # API keys for Cipher
└── .claude/
    └── settings.local.json  # Claude Code MCP settings
```

## Troubleshooting

### Connection Issues
- Verify API keys are set in `.env`
- Check that MCP server is listed: `claude mcp list`
- Restart Claude Code if connection fails

### Memory Issues
- Check SQLite database permissions
- Verify vector storage initialization
- Review session creation logs

### Configuration Issues
- Validate YAML syntax in `cipher.yml`
- Ensure MCP servers are properly configured
- Check file paths and permissions

## Next Steps

With Cipher configured, you can:

1. **Store Development Sessions**: Save key decisions and context
2. **Query Project History**: Ask about past development work
3. **Share Context**: Collaborate with persistent memory
4. **Track Progress**: Maintain ongoing task awareness
5. **Enhance Productivity**: Reduce context-switching overhead

The system is now ready to provide persistent memory across all Claude Code development sessions!