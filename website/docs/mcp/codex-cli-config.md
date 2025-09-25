# Codex MCP Setup

This guide shows how to run the Artful Archives MCP server with Codex (or any MCP client that supports stdio).

## Prerequisites
- Node.js 18+
- An admin-scoped API key for MCP: set `ARTFUL_ARCHIVES_MCP_API_KEY`

## Start the MCP Server

Option A: via npm script

```
npm run mcp:codex
```

Option B: directly

```
ARTFUL_ARCHIVES_MCP_API_KEY=your-key-here \
node scripts/mcp-server.js
```

Notes:
- The server uses stdio transport and exposes tools: `create_blog_post`, `analyze_artwork`, `generate_audio_narration`, `manage_media_assets`, `publish_content`, `search_content`, `get_analytics`.
- If your environment errors on requiring TypeScript from `scripts/mcp-server.js`, run it with a TS runner (e.g., `tsx scripts/mcp-server.js`) or use a compiled build step. The provided npm script assumes Node can load the wrapper.

## Point Codex at the Server
- Configure Codex to launch the MCP server command (above) with `ARTFUL_ARCHIVES_MCP_API_KEY` in its environment.
- Transport: stdio

## Testing Locally
- Run targeted MCP tests:

```
npm run test:mcp
```

These tests mock external services and exercise core MCP tool behaviors.

