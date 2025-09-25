# Testing Guide: MCP Server vs ChatGPT Actions

## Overview

This guide provides comprehensive testing procedures for both MCP Server and ChatGPT Actions integrations. It includes automated testing scripts, manual testing procedures, and evaluation criteria to help you assess which solution best fits your needs.

## Prerequisites

### Environment Setup
```bash
# Clone the repository
git clone [repository-url]
cd artful-archives-website

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys
```

### Required Environment Variables
```bash
# For MCP Server Testing
ARTFUL_ARCHIVES_MCP_API_KEY=your_mcp_api_key_here
MCP_RATE_LIMIT=100

# For ChatGPT Actions Testing
CHATGPT_ACTIONS_API_KEY=your_api_key_here
CHATGPT_ACTIONS_BASE_URL=https://your-domain.com/api/external
VERCEL_PROTECTION_BYPASS=your_bypass_key_here

# Database and AI Services
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

## Automated Testing

### MCP Server Testing

#### Running the Test Suite
```bash
# Run MCP Server tests
node scripts/test-mcp-server.js

# With custom configuration
ARTFUL_ARCHIVES_MCP_API_KEY=your_key node scripts/test-mcp-server.js
```

#### Test Coverage
The MCP test suite covers:
- ✅ Server connection and handshake
- ✅ Tool discovery and validation
- ✅ Create blog post functionality
- ✅ Artwork analysis capabilities
- ✅ Audio narration generation
- ✅ Post listing and filtering
- ✅ Post updates and modifications
- ✅ Post deletion with safety checks
- ✅ Error handling and recovery
- ✅ Performance metrics

#### Expected Output
```
🚀 Starting MCP Server Tests

Configuration:
  Server Script: /path/to/mcp-server.js
  API Key: ✓ Set
  Timeout: 30000ms

🔍 Validating Prerequisites...
✅ Prerequisites validated

🖥️  Starting MCP Server...
✅ MCP Server started successfully

🧪 Running Test Suite...

🔗 Testing MCP Connection...
✅ Connection successful (45ms)

🛠️  Testing Tool Discovery...
✅ Discovered 7 tools

✍️  Testing Create Blog Post...
✅ Blog post created: test-post-1693234567890

[... additional test output ...]

📊 TEST RESULTS SUMMARY
========================
Status: ✅ PASSED
Tests: 10/10 passed (100.0%)
Errors: 0
Duration: 2847ms
Avg Response Time: 250ms

📄 Detailed report saved: /path/to/test-data/mcp-server-test-report.json
```

### ChatGPT Actions Testing

#### Running the Test Suite
```bash
# Run ChatGPT Actions tests
node scripts/test-chatgpt-actions.js

# With custom configuration
CHATGPT_ACTIONS_API_KEY=your_key \
CHATGPT_ACTIONS_BASE_URL=https://your-domain.com/api/external \
node scripts/test-chatgpt-actions.js
```

#### Test Coverage
The ChatGPT Actions test suite covers:
- ✅ Authentication and authorization
- ✅ List posts with pagination
- ✅ Create new blog posts
- ✅ Retrieve specific posts
- ✅ Update existing posts
- ✅ Publish/unpublish posts
- ✅ Delete posts
- ✅ Image analysis endpoints
- ✅ Audio generation endpoints
- ✅ Voice listing
- ✅ Media upload and management
- ✅ Error handling validation
- ✅ Rate limiting behavior
- ✅ Performance benchmarks

#### Expected Output
```
🚀 Starting ChatGPT Actions Tests

Configuration:
  Base URL: https://your-domain.com/api/external
  API Key: ✓ Set
  Vercel Protection: ✓ Set
  Timeout: 30000ms

🔍 Validating Prerequisites...
✅ Prerequisites validated

🧪 Running Test Suite...

🔐 Testing Authentication...
✅ Authentication working correctly

📋 Testing List Posts...
✅ Listed 15 posts

✍️  Testing Create Post...
✅ Post created: 550e8400-e29b-41d4-a716-446655440000

[... additional test output ...]

📊 TEST RESULTS SUMMARY
========================
Status: ✅ PASSED
Tests: 15/15 passed (100.0%)
Errors: 0
Duration: 5234ms
Avg Response Time: 187ms

📄 Detailed report saved: /path/to/test-data/chatgpt-actions-test-report.json
```

## Manual Testing

### MCP Server Manual Testing

#### Setup Claude Desktop
1. **Install Claude Desktop** (if not already installed)
2. **Configure MCP Server**:
   ```json
   {
     "mcpServers": {
       "artful-archives": {
         "command": "node",
         "args": ["/path/to/artful-archives-website/scripts/mcp-server.js"],
         "env": {
           "ARTFUL_ARCHIVES_MCP_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```
3. **Restart Claude Desktop**
4. **Verify Connection**: Look for MCP tools in Claude's interface

#### Manual Test Scenarios

**Scenario 1: Basic Post Creation**
```
User: "Create a blog post about abstract art with the title 'The Evolution of Abstract Art'"

Expected: MCP server creates a draft post with AI-generated content
Verify: Check database for new post entry
```

**Scenario 2: Image Analysis Workflow**
```
User: "Analyze this artwork image and create a blog post about it"
[Upload image]

Expected: 
1. Image analyzed using multiple AI providers
2. Analysis content generated
3. Blog post created with analysis
4. Suggested title and slug provided

Verify: Check AI analysis data and post content
```

**Scenario 3: Audio Generation**
```
User: "Generate audio narration for the post we just created"

Expected:
1. Post content extracted
2. Audio generated using TTS
3. Audio file saved to storage
4. Post updated with audio reference

Verify: Check audio file exists and is playable
```

### ChatGPT Actions Manual Testing

#### Setup Custom GPT
1. **Access ChatGPT**: Go to ChatGPT and create a new Custom GPT
2. **Import OpenAPI Spec**:
   - Copy content from `docs/api/openapi-spec.yaml`
   - Paste into Actions configuration
   - Set server URL to your deployment
3. **Configure Authentication**:
   - Auth Type: Bearer
   - API Key: Your generated API key
   - (Handle Vercel protection bypass as described in the auth section)
4. **Test Connection**: Use the "Test" button in GPT editor

#### Manual Test Scenarios

**Scenario 1: Conversational Post Creation**
```
User: "I want to create a blog post about modern sculpture techniques. 
       Make it about 500 words and focus on clay modeling."

Expected: GPT uses Actions to create a post with the specified content
Verify: Check that post appears in admin dashboard
```

**Scenario 2: Natural Language Content Management**
```
User: "Show me all published posts from this month"

Expected: GPT lists recent published posts with titles and dates
Verify: Compare with actual database content
```

**Scenario 3: Image Analysis Integration**
```
User: "Analyze this artwork image and tell me what style it represents"
[Upload image]

Expected:
1. Image uploaded and analyzed
2. AI provides detailed analysis
3. Style and characteristics identified
4. Option to create blog post offered

Verify: Analysis quality and accuracy
```

## Authentication Testing

### Testing External API Keys

#### Generate API Key
1. **Navigate to**: `/admin/external-keys`
2. **Create New Key**:
   - Name: "Test Key"
   - Scopes: Select required permissions
   - Rate Limit: 100 requests/minute
3. **Copy Key**: Copy the generated key immediately (it won't be shown again)

#### Test Key Functionality
```bash
# Test basic authentication
curl -H "Authorization: Bearer your_api_key" \
     https://your-domain.com/api/external/posts?limit=1

# Expected: JSON response with posts array
# Status: 200 OK

# Test invalid key
curl -H "Authorization: Bearer invalid_key" \
     https://your-domain.com/api/external/posts?limit=1

# Expected: Authentication error
# Status: 401 Unauthorized
```

### Handling Vercel Deployment Protection

#### Issue Description
ChatGPT Actions can only send one header value, but Vercel deployment protection requires two headers:
- `Authorization: Bearer <api_key>`
- `x-vercel-protection-bypass: <bypass_secret>`

#### Solution Options

**Option 1: Disable Protection (Recommended for Testing)**
```bash
# In Vercel dashboard, temporarily disable deployment protection
# Or add ChatGPT's IP ranges to allowlist
```

**Option 2: Query Parameter Bypass**
```yaml
# In GPT Actions editor, modify server URL:
servers:
  - url: https://your-domain.com/api/external?x-vercel-protection-bypass=YOUR_SECRET
```

**Option 3: Custom Header Workaround**
```yaml
# Set Auth Type to "Custom"
# Custom Header Name: x-vercel-protection-bypass
# API Key: your_bypass_secret
# Note: This bypasses API key auth, only use for testing
```

## Evaluation Criteria

### Functionality Assessment

#### Core Features (Weight: 40%)
- [ ] **Post Management**: Create, read, update, delete operations
- [ ] **AI Integration**: Image analysis and content generation
- [ ] **Audio Generation**: TTS with multiple voice options
- [ ] **Media Management**: File upload and asset management
- [ ] **Search & Filtering**: Content discovery capabilities

#### Advanced Features (Weight: 30%)
- [ ] **Multi-provider AI**: OpenAI + Claude integration
- [ ] **Workflow Automation**: Multi-step process handling
- [ ] **Real-time Updates**: Live status and progress updates
- [ ] **Error Recovery**: Graceful error handling and retry logic
- [ ] **Batch Operations**: Multiple item processing

### Performance Evaluation (Weight: 20%)

#### Response Time Metrics
- [ ] **Average Response Time**: < 500ms for simple operations
- [ ] **P95 Response Time**: < 2000ms for complex operations
- [ ] **Streaming Performance**: Real-time data delivery (MCP only)
- [ ] **Cold Start Latency**: Initial request performance (Actions)

#### Throughput Testing
- [ ] **Concurrent Users**: Handle multiple simultaneous users
- [ ] **Rate Limiting**: Proper limit enforcement and handling
- [ ] **Resource Usage**: Memory and CPU efficiency
- [ ] **Scalability**: Performance under increased load

### User Experience (Weight: 10%)

#### Ease of Setup
- [ ] **Initial Configuration**: Time to first working integration
- [ ] **Documentation Quality**: Clear setup and usage instructions
- [ ] **Debugging Tools**: Available troubleshooting options
- [ ] **Error Messages**: Clear and actionable error feedback

#### Daily Usage
- [ ] **Natural Language**: How well it understands user intent
- [ ] **Workflow Efficiency**: Steps required for common tasks
- [ ] **Context Awareness**: Maintains conversation state
- [ ] **Error Recovery**: User-friendly error handling

## Scoring Framework

### Scoring Scale
- **5 - Excellent**: Exceeds expectations, best-in-class
- **4 - Very Good**: Meets all requirements with some standout features
- **3 - Good**: Meets basic requirements adequately
- **2 - Fair**: Meets some requirements, has notable limitations
- **1 - Poor**: Fails to meet basic requirements

### Sample Scorecard

| Category | Criteria | MCP Score | Actions Score | Notes |
|----------|----------|-----------|---------------|-------|
| **Functionality** | Post Management | 5 | 4 | MCP has more advanced features |
| | AI Integration | 5 | 3 | MCP supports multiple providers |
| | Audio Generation | 4 | 4 | Both have good TTS integration |
| **Performance** | Response Time | 4 | 3 | MCP streaming vs HTTP latency |
| | Scalability | 2 | 5 | Actions has serverless scaling |
| **User Experience** | Setup Ease | 2 | 5 | Actions much easier to configure |
| | Daily Usage | 4 | 4 | Both provide good interfaces |

### Final Recommendation

Based on evaluation scores:
- **70-100 points**: Excellent solution, recommended for production
- **50-69 points**: Good solution with some limitations
- **30-49 points**: Adequate for specific use cases only
- **Below 30**: Not recommended

## Troubleshooting Guide

### Common MCP Issues

**Server Won't Start**
```bash
# Check API key
echo $ARTFUL_ARCHIVES_MCP_API_KEY

# Verify dependencies
npm install

# Check ports
lsof -i :3001
```

**Tools Not Visible in Claude**
```bash
# Restart Claude Desktop
# Check MCP server logs
# Verify configuration file syntax
```

### Common Actions Issues

**Authentication Failures**
```bash
# Test API key directly
curl -H "Authorization: Bearer your_key" your_domain/api/external/posts

# Check key permissions in admin interface
# Verify Vercel protection bypass
```

**OpenAPI Import Errors**
```yaml
# Validate YAML syntax
# Check server URL format
# Verify authentication configuration
```

## Continuous Testing

### Automated Testing Pipeline
```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests
on: [push, pull_request]
jobs:
  test-mcp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: node scripts/test-mcp-server.js
  test-actions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: node scripts/test-chatgpt-actions.js
```

### Monitoring & Alerts
- **API Response Times**: Monitor endpoint performance
- **Error Rates**: Track authentication and validation errors
- **Usage Patterns**: Analyze feature adoption and usage
- **Resource Utilization**: Monitor server and serverless metrics

This comprehensive testing guide ensures thorough evaluation of both MCP Server and ChatGPT Actions implementations, helping you make informed decisions about which solution best fits your specific requirements.