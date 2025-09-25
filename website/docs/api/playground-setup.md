# AI Integration Playground Setup Guide

The AI Integration Playground provides administrators with comprehensive testing and monitoring capabilities for both MCP Server tools and ChatGPT Actions endpoints.

## Overview

The playground offers:

- **Real-time Health Monitoring** - Live status tracking for all AI integrations
- **Individual Testing** - Test specific tools/endpoints with detailed results
- **Bulk Testing** - Run comprehensive tests across all integrations
- **Test History** - Complete audit trail with filtering and pagination
- **Performance Metrics** - Response time tracking and error diagnostics
- **Visual Dashboard** - User-friendly interface with status indicators

## Access Requirements

### Admin Authentication

1. **Login Required** - Must be authenticated as an admin user
2. **Admin Role** - User must have 'admin' role in admin_profiles table
3. **Protected Route** - Playground is in `/admin/(protected)/` directory

### Database Setup

The playground requires two database tables:

**1. admin_profiles table:**
```sql
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
```

**2. playground_test_results table:**
```sql
CREATE TABLE IF NOT EXISTS public.playground_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('mcp', 'chatgpt')),
    tool_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    response_time INTEGER NOT NULL,
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Environment Variables

Ensure these are configured:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Service API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# External API Configuration
EXTERNAL_API_KEY=your_external_api_key
NEXT_PUBLIC_BASE_URL=https://artful-archives-website.vercel.app
```

## How to Use the Playground

### 1. Access the Interface

Navigate to: `/admin/playground` (requires admin login)

### 2. Overview Dashboard

The main dashboard shows:

- **System Health Badge** - Overall status (healthy/degraded/unhealthy)
- **MCP Server Tools** - Individual tool status with icons
- **ChatGPT Actions** - Individual endpoint status with icons  
- **Recent Test Results** - Latest test executions
- **Last Updated Timestamp** - When health was last checked

### 3. Health Monitoring

- **Automatic Updates** - Status refreshes every 30 seconds
- **Manual Refresh** - Click "Refresh Status" button
- **Status Indicators** - Color-coded badges (green=healthy, yellow=degraded, red=unhealthy)
- **Response Times** - Performance metrics for each component

### 4. Individual Testing

**MCP Server Tab:**
- Test specific MCP tools individually
- Click tool-specific "Test" buttons
- View detailed results with timing

**ChatGPT Actions Tab:**
- Test specific endpoints individually  
- Monitor response times and success rates
- Debug API connectivity issues

**Tools Available for Testing:**

*MCP Server Tools:*
- `create_blog_post` - Blog post creation functionality
- `analyze_artwork` - AI-powered artwork analysis  
- `generate_audio_narration` - Text-to-speech generation
- `manage_media_assets` - Media library management
- `publish_content` - Content publishing workflows
- `search_content` - Content search and discovery
- `get_analytics` - Performance metrics and analytics

*ChatGPT Actions Endpoints:*
- `listPosts` - Retrieve published blog posts
- `createPost` - Create new blog posts via ChatGPT
- `analyzeImageAndGenerateInsights` - AI image analysis
- `generateAudio` - TTS audio generation with job management
- `getAudioJobStatus` - Monitor audio generation job status

### 5. Bulk Testing

- **"Test All"** button runs comprehensive tests across all integrations
- **Parallel Execution** - Tests run simultaneously for faster results
- **Progress Indicators** - Real-time status during bulk testing
- **Consolidated Results** - Combined results from all tests

### 6. Test History

**Features:**
- **Complete Audit Trail** - All test executions stored in database
- **Advanced Filtering** - Filter by type (MCP/ChatGPT) and status (success/error)
- **Date Range Filtering** - Filter by date ranges
- **Pagination** - Efficient browsing of large result sets
- **Detailed Results** - Response times, error messages, test details

**Filtering Options:**
```
- Type: MCP Server | ChatGPT Actions | All
- Status: Success | Error | All  
- Date Range: From/To dates
- Limit: Number of results per page
```

**History Management:**
- **Cleanup Options** - Remove old test results
- **Export Capabilities** - Download test history data
- **Performance Analysis** - Track trends over time

## API Endpoints

### Health Monitoring

```http
GET /api/admin/playground/health
```

**Response:**
```json
{
  "overall": "healthy|degraded|unhealthy|unknown",
  "mcpTools": [
    {
      "name": "create_blog_post", 
      "status": "healthy",
      "lastCheck": "2025-08-29T12:00:00Z",
      "responseTime": 250,
      "error": null
    }
  ],
  "chatgptEndpoints": [
    {
      "name": "listPosts",
      "status": "healthy", 
      "lastCheck": "2025-08-29T12:00:00Z",
      "responseTime": 180,
      "error": null
    }
  ],
  "lastUpdated": "2025-08-29T12:00:00Z"
}
```

### MCP Server Testing

```http
POST /api/admin/playground/test-mcp
POST /api/admin/playground/test-mcp?tool=create_blog_post
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "mcp",
    "tool": "create_blog_post", 
    "status": "success",
    "timestamp": "2025-08-29T12:00:00Z",
    "responseTime": 450,
    "error": null,
    "details": {
      "action": "create_test_post",
      "payload": {...},
      "result": "Draft post created successfully"
    }
  }
]
```

### ChatGPT Actions Testing

```http
POST /api/admin/playground/test-chatgpt
POST /api/admin/playground/test-chatgpt?endpoint=listPosts
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001", 
    "type": "chatgpt",
    "tool": "listPosts",
    "status": "success",
    "timestamp": "2025-08-29T12:00:00Z", 
    "responseTime": 320,
    "error": null,
    "details": {
      "action": "list_blog_posts",
      "http_status": 200,
      "response_preview": ["posts", "meta", "pagination"],
      "performance": "good"
    }
  }
]
```

### Test History Management

```http
GET /api/admin/playground/test-history?type=mcp&status=success&limit=50
DELETE /api/admin/playground/test-history?type=older_than_date&older_than=2025-08-01
```

## Troubleshooting

### Common Issues

**1. 403 Forbidden Errors**
- **Cause**: User not in admin_profiles table or missing admin role
- **Solution**: Add user to admin_profiles with role='admin'
- **Command**: 
```sql
INSERT INTO admin_profiles (user_id, role, email) 
VALUES ('your-user-id', 'admin', 'admin@example.com');
```

**2. Database Table Missing**
- **Cause**: Migrations not applied to production database
- **Solution**: Run Supabase migrations
- **Files**: `/supabase/migrations/20250829000001_create_playground_test_results.sql`

**3. JavaScript Map Errors**
- **Cause**: API returning undefined data
- **Solution**: Implemented defensive programming with fallback empty arrays
- **Status**: Fixed in latest deployment

**4. API Connection Issues**
- **Cause**: Missing environment variables or invalid API keys
- **Solution**: Verify all required environment variables are set
- **Check**: OPENAI_API_KEY, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY

**5. Performance Issues**
- **Cause**: Too many concurrent tests
- **Solution**: Use individual testing instead of bulk testing
- **Alternative**: Increase API rate limits

### Debug Mode

Enable detailed logging in development:

```typescript
// In API routes
const debugMode = process.env.NODE_ENV === 'development'

if (debugMode) {
  console.log('Playground API Request:', {
    method: request.method,
    url: request.url,
    user: user?.id,
    timestamp: new Date().toISOString()
  })
}
```

### Monitoring Commands

Check system health:

```bash
# Check database connectivity
curl -X GET "https://artful-archives-website.vercel.app/api/admin/playground/health" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Run MCP tests
curl -X POST "https://artful-archives-website.vercel.app/api/admin/playground/test-mcp" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Check test history
curl -X GET "https://artful-archives-website.vercel.app/api/admin/playground/test-history?limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Security Considerations

### Access Control
- **Admin Only** - Playground restricted to admin users
- **Row Level Security** - Database policies enforce admin access
- **API Key Validation** - All endpoints require valid authentication
- **Rate Limiting** - Built-in protection against abuse

### Data Privacy
- **Test Data** - No sensitive data stored in test results
- **Error Logging** - Error messages sanitized for security
- **API Keys** - Never exposed in client-side code
- **Audit Trail** - All test executions logged for accountability

### Performance Protection
- **Rate Limiting** - Prevents excessive API usage
- **Timeout Controls** - Tests timeout after reasonable periods
- **Resource Monitoring** - Database usage tracked and limited
- **Error Boundaries** - Graceful handling of test failures

## Performance Optimization

### Caching Strategies
- **Health Data** - Cached for 30 seconds to reduce API calls
- **Test Results** - Stored in database for historical analysis
- **API Responses** - Consider caching for repeated identical tests
- **Status Icons** - Pre-loaded UI components for fast rendering

### Database Optimization
- **Indexes** - Proper indexing on commonly queried columns
- **Pagination** - Efficient pagination for large result sets
- **Cleanup Jobs** - Automated cleanup of old test results
- **Query Optimization** - Efficient SQL queries with proper joins

### Frontend Performance
- **Lazy Loading** - Components loaded on demand
- **Real-time Updates** - Efficient WebSocket or polling
- **Error Boundaries** - Prevent UI crashes from API failures
- **Loading States** - Proper loading indicators during tests

## Monitoring and Analytics

### Key Metrics to Track
- **Test Success Rates** - Overall system health trends
- **Response Times** - Performance degradation detection  
- **Error Patterns** - Common failure points identification
- **Usage Patterns** - Which tools are tested most frequently
- **System Availability** - Uptime tracking for each component

### Alerts and Notifications
- **Health Degradation** - Alert when overall health drops
- **Test Failures** - Notify on consecutive test failures
- **Performance Issues** - Alert on slow response times
- **System Errors** - Immediate notification of critical failures

### Reporting
- **Daily Health Reports** - Automated health summaries
- **Weekly Performance Reports** - Trend analysis and insights
- **Monthly System Review** - Comprehensive system health review
- **Custom Reports** - Exportable test data for analysis

## Integration with External Systems

### Webhook Integration
Set up webhooks to notify external systems of test results:

```typescript
// Example webhook payload
{
  "event": "playground.test.completed",
  "timestamp": "2025-08-29T12:00:00Z",
  "data": {
    "testId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "mcp",
    "tool": "create_blog_post",
    "status": "success", 
    "responseTime": 450,
    "details": {...}
  }
}
```

### Monitoring System Integration
Connect to monitoring platforms:

```typescript
// Example Datadog integration
import { StatsD } from 'node-statsd';

const statsd = new StatsD();

// Track test metrics
statsd.timing('playground.mcp.response_time', responseTime);
statsd.increment('playground.mcp.success');
```

### Slack/Discord Notifications
Send notifications to team channels:

```typescript
// Example Slack webhook
const slackPayload = {
  text: "🚨 MCP Server Health Alert",
  attachments: [{
    color: "danger",
    fields: [{
      title: "Tool",
      value: "create_blog_post",
      short: true
    }, {
      title: "Status", 
      value: "unhealthy",
      short: true
    }]
  }]
}
```

## Future Enhancements

### Planned Features
- **Automated Testing Schedules** - Cron-based test execution
- **Advanced Analytics Dashboard** - Detailed performance insights
- **Custom Test Scenarios** - User-defined test workflows
- **Load Testing Capabilities** - Stress testing for scalability
- **API Documentation Integration** - Live API docs with testing

### Enhancement Roadmap
1. **Q1 2025**: Automated scheduling and advanced analytics
2. **Q2 2025**: Custom test scenarios and load testing  
3. **Q3 2025**: Enhanced monitoring and alerting
4. **Q4 2025**: Machine learning-based failure prediction

The AI Integration Playground provides a robust foundation for monitoring and testing your AI infrastructure, ensuring reliable operation and quick issue resolution.