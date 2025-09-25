# Google Sheets MCP Integration Setup Guide

This guide will help you set up Google Sheets integration with MCP (Model Context Protocol) for your project.

## Overview

The Google Sheets MCP server provides a comprehensive set of tools to interact with Google Sheets programmatically through MCP. This allows you to create, read, update, and manage Google Sheets directly from your MCP-enabled applications.

## Prerequisites

- Node.js 20+
- A Google Cloud Console account
- Google Sheets API enabled
- OAuth 2.0 credentials configured

## Quick Setup

### 1. Run the Setup Script

```bash
npm run sheets:setup
```

This will display step-by-step instructions for configuring Google Cloud Console.

### 2. Follow the Google Cloud Console Setup

The setup script will guide you through:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (e.g., "mcp-google-sheets")

2. **Enable Google Sheets API**
   - Navigate to "APIs & Services" > "Library"
   - Search for and enable "Google Sheets API"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in app details and add your email as a test user

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Create "OAuth 2.0 Client IDs" for "Desktop application"
   - Download the JSON file and save as `credentials/credentials.json`

### 3. Authenticate

```bash
npm run auth:google-sheets
```

This will:
- Open your browser for Google authentication
- Exchange the authorization code for access tokens
- Save tokens to `credentials/token.json`

### 4. Start the MCP Server

```bash
npm run mcp:google-sheets
```

## Available Tools

The Google Sheets MCP server provides the following tools:

### Core Operations

- **`sheets_create`** - Create a new spreadsheet
  ```json
  {
    "title": "My New Spreadsheet"
  }
  ```

- **`sheets_read`** - Read data from a spreadsheet
  ```json
  {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Sheet1!A1:B10"
  }
  ```

- **`sheets_write`** - Write data to a spreadsheet
  ```json
  {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Sheet1!A1:B2",
    "values": [["Name", "Age"], ["John", "25"]]
  }
  ```

- **`sheets_append`** - Append data to a spreadsheet
  ```json
  {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Sheet1!A:B",
    "values": [["Jane", "30"]]
  }
  ```

### Sheet Management

- **`sheets_get_metadata`** - Get spreadsheet metadata
  ```json
  {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  }
  ```

- **`sheets_create_sheet`** - Create a new sheet within a spreadsheet
  ```json
  {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "title": "New Sheet"
  }
  ```

- **`sheets_delete_sheet`** - Delete a sheet from a spreadsheet
  ```json
  {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "sheetId": "123456789"
  }
  ```

### Data Operations

- **`sheets_clear_range`** - Clear data from a range
  ```json
  {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Sheet1!A1:B10"
  }
  ```

- **`sheets_batch_update`** - Perform batch operations
  ```json
  {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "requests": [
      {
        "addSheet": {
          "properties": {
            "title": "New Sheet"
          }
        }
      }
    ]
  }
  ```

## Configuration Files

### `.cursor/mcp.json`

The MCP server is configured in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "node",
      "args": ["scripts/google-sheets-mcp-server.js"],
      "disabled": false,
      "alwaysAllow": [
        "sheets_create",
        "sheets_read",
        "sheets_write",
        "sheets_append",
        "sheets_get_metadata",
        "sheets_create_sheet",
        "sheets_delete_sheet",
        "sheets_clear_range",
        "sheets_batch_update"
      ],
      "disabledTools": []
    }
  }
}
```

### Credentials Structure

```
credentials/
├── credentials.json    # OAuth 2.0 credentials from Google Cloud Console
└── token.json         # Access tokens (generated during authentication)
```

## Troubleshooting

### Common Issues

1. **"credentials.json not found"**
   - Ensure you've downloaded the credentials from Google Cloud Console
   - Save the file as `credentials/credentials.json`

2. **"Authentication failed"**
   - Check that OAuth consent screen is configured
   - Verify your email is added as a test user
   - Try re-running `npm run auth:google-sheets`

3. **"Access denied"**
   - Ensure Google Sheets API is enabled in your project
   - Check that the service account has proper permissions
   - Verify the spreadsheet sharing settings

4. **"Invalid range"**
   - Use A1 notation for ranges (e.g., "Sheet1!A1:B10")
   - Ensure the sheet name exists in the spreadsheet

### Debug Mode

To run the server with debug logging:

```bash
DEBUG=* npm run mcp:google-sheets
```

## Security Considerations

- Never commit `credentials/` directory to version control
- Add `credentials/` to your `.gitignore`
- Regularly rotate OAuth credentials
- Use the principle of least privilege for API scopes

## Examples

### Creating and Populating a Spreadsheet

```javascript
// 1. Create a new spreadsheet
const createResult = await mcp.callTool('sheets_create', {
  title: 'Project Data'
});

// 2. Write headers
await mcp.callTool('sheets_write', {
  spreadsheetId: createResult.spreadsheetId,
  range: 'Sheet1!A1:D1',
  values: [['Name', 'Email', 'Role', 'Start Date']]
});

// 3. Append data
await mcp.callTool('sheets_append', {
  spreadsheetId: createResult.spreadsheetId,
  range: 'Sheet1!A:D',
  values: [
    ['John Doe', 'john@example.com', 'Developer', '2024-01-15'],
    ['Jane Smith', 'jane@example.com', 'Designer', '2024-02-01']
  ]
});
```

### Reading and Processing Data

```javascript
// Read data from a range
const readResult = await mcp.callTool('sheets_read', {
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  range: 'Sheet1!A1:D100'
});

// Process the data
const rows = readResult.values;
const headers = rows[0];
const data = rows.slice(1);

// Filter and analyze
const developers = data.filter(row => row[2] === 'Developer');
console.log(`Found ${developers.length} developers`);
```

## Integration with Your Application

The Google Sheets MCP server integrates seamlessly with MCP-compatible applications. Once configured, you can use the tools through the MCP protocol to automate spreadsheet operations as part of your workflows.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your Google Cloud Console configuration
3. Ensure all prerequisites are met
4. Review the server logs for error messages

## License

This integration follows the same license as your main project.