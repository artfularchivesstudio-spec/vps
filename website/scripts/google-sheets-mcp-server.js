#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Google Sheets API setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(__dirname, '..', 'credentials', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'credentials.json');

class GoogleSheetsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'google-sheets-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.auth = null;
    this.sheets = null;
  }

  async initializeAuth() {
    try {
      // Load client secrets from local file
      const content = fs.readFileSync(CREDENTIALS_PATH);
      const credentials = JSON.parse(content);

      const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token
      if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(token));
      }

      this.auth = oAuth2Client;
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });

      return true;
    } catch (error) {
      console.error('Error initializing auth:', error);
      return false;
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'sheets_create':
            return await this.createSpreadsheet(args);
          case 'sheets_read':
            return await this.readSpreadsheet(args);
          case 'sheets_write':
            return await this.writeToSpreadsheet(args);
          case 'sheets_append':
            return await this.appendToSpreadsheet(args);
          case 'sheets_get_metadata':
            return await this.getSpreadsheetMetadata(args);
          case 'sheets_create_sheet':
            return await this.createSheet(args);
          case 'sheets_delete_sheet':
            return await this.deleteSheet(args);
          case 'sheets_clear_range':
            return await this.clearRange(args);
          case 'sheets_batch_update':
            return await this.batchUpdate(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async createSpreadsheet(args) {
    if (!args.title) {
      throw new Error('Title is required for creating a spreadsheet');
    }

    const request = {
      resource: {
        properties: {
          title: args.title,
        },
      },
    };

    const response = await this.sheets.spreadsheets.create(request);

    return {
      content: [
        {
          type: 'text',
          text: `Created spreadsheet "${args.title}" with ID: ${response.data.spreadsheetId}`,
        },
      ],
    };
  }

  async readSpreadsheet(args) {
    if (!args.spreadsheetId || !args.range) {
      throw new Error('Spreadsheet ID and range are required');
    }

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
    });

    const values = response.data.values || [];
    const formattedData = values.map(row => row.join('\t')).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Data from range ${args.range}:\n${formattedData}`,
        },
      ],
    };
  }

  async writeToSpreadsheet(args) {
    if (!args.spreadsheetId || !args.range || !args.values) {
      throw new Error('Spreadsheet ID, range, and values are required');
    }

    const request = {
      spreadsheetId: args.spreadsheetId,
      range: args.range,
      valueInputOption: 'RAW',
      resource: {
        values: args.values,
      },
    };

    await this.sheets.spreadsheets.values.update(request);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully wrote data to range ${args.range}`,
        },
      ],
    };
  }

  async appendToSpreadsheet(args) {
    if (!args.spreadsheetId || !args.range || !args.values) {
      throw new Error('Spreadsheet ID, range, and values are required');
    }

    const request = {
      spreadsheetId: args.spreadsheetId,
      range: args.range,
      valueInputOption: 'RAW',
      resource: {
        values: args.values,
      },
    };

    const response = await this.sheets.spreadsheets.values.append(request);

    return {
      content: [
        {
          type: 'text',
          text: `Appended data to range ${args.range}. Updated range: ${response.data.updates.updatedRange}`,
        },
      ],
    };
  }

  async getSpreadsheetMetadata(args) {
    if (!args.spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }

    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: args.spreadsheetId,
    });

    const metadata = {
      title: response.data.properties.title,
      sheets: response.data.sheets.map(sheet => ({
        name: sheet.properties.title,
        id: sheet.properties.sheetId,
        index: sheet.properties.index,
      })),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Spreadsheet metadata:\n${JSON.stringify(metadata, null, 2)}`,
        },
      ],
    };
  }

  async createSheet(args) {
    if (!args.spreadsheetId || !args.title) {
      throw new Error('Spreadsheet ID and sheet title are required');
    }

    const request = {
      spreadsheetId: args.spreadsheetId,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: args.title,
              },
            },
          },
        ],
      },
    };

    await this.sheets.spreadsheets.batchUpdate(request);

    return {
      content: [
        {
          type: 'text',
          text: `Created new sheet "${args.title}" in spreadsheet`,
        },
      ],
    };
  }

  async deleteSheet(args) {
    if (!args.spreadsheetId || !args.sheetId) {
      throw new Error('Spreadsheet ID and sheet ID are required');
    }

    const request = {
      spreadsheetId: args.spreadsheetId,
      resource: {
        requests: [
          {
            deleteSheet: {
              sheetId: parseInt(args.sheetId),
            },
          },
        ],
      },
    };

    await this.sheets.spreadsheets.batchUpdate(request);

    return {
      content: [
        {
          type: 'text',
          text: `Deleted sheet with ID ${args.sheetId}`,
        },
      ],
    };
  }

  async clearRange(args) {
    if (!args.spreadsheetId || !args.range) {
      throw new Error('Spreadsheet ID and range are required');
    }

    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Cleared data in range ${args.range}`,
        },
      ],
    };
  }

  async batchUpdate(args) {
    if (!args.spreadsheetId || !args.requests) {
      throw new Error('Spreadsheet ID and requests are required');
    }

    const request = {
      spreadsheetId: args.spreadsheetId,
      resource: {
        requests: args.requests,
      },
    };

    await this.sheets.spreadsheets.batchUpdate(request);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully executed batch update with ${args.requests.length} requests`,
        },
      ],
    };
  }

  async run() {
    // Initialize authentication
    const authInitialized = await this.initializeAuth();
    if (!authInitialized) {
      console.error('Failed to initialize Google Sheets authentication. Please check your credentials.');
      process.exit(1);
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Google Sheets MCP Server running...');
  }
}

// Start the server
const server = new GoogleSheetsMCPServer();
server.run().catch(console.error);