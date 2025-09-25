# Smithery MCP Server Setup

> Howdy, tool tinkerers! This guide shows how to run our MCP servers on [smithery.ai](https://smithery.ai)
> using the existing scripts in this repo.

## Prerequisites
- Node.js and npm
- A Smithery project with MCP support enabled
- Required environment variables in your `.envrc`

## Run the generic MCP server
```bash
node scripts/mcp-server.js
```
This spins up the local server; point Smithery at `http://localhost:3030`.

## Google Sheets MCP server
```bash
node scripts/google-sheets-mcp-server.js
```
Configure your Smithery MCP to use the same port and ensure Google credentials are loaded.

## Tips
- Restart Smithery after adding new servers so it sniffs the fresh endpoints 🍞
- Keep an eye on the console logs; they shout loudly when something goes sideways 📣

Happy hammering! 🔨
