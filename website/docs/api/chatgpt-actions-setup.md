# ChatGPT Actions Setup Guide

This guide walks through setting up ChatGPT Actions to integrate with the Artful Archives Studio External API, enabling conversational content management.

## Overview

ChatGPT Actions allow your Custom GPT to make HTTP requests to external APIs. This integration enables users to:

- Upload and analyze artwork images
- Create and edit blog posts through conversation
- Generate audio narrations
- Manage media assets
- Publish content directly

## Prerequisites

1. **API Key**: Generate an external API key with appropriate scopes
2. **OpenAPI Schema**: Import the provided OpenAPI specification
3. **Custom GPT**: Create or edit your Custom GPT in ChatGPT

## Step 1: Generate API Key

First, create an API key for your Custom GPT:

```typescript
// Using the External API Auth system
import { externalAPIAuth } from '@/lib/external-api/auth'

const { apiKey, id } = await externalAPIAuth.createApiKey(
  'ChatGPT Custom GPT',
  [
    'posts:read',
    'posts:write', 
    'posts:publish',
    'media:read',
    'media:write',
    'ai:analyze',
    'ai:generate-audio'
  ],
  1000 // Rate limit: 1000 requests per minute
)

console.log('API Key:', apiKey)
```

**Important**: Store the API key securely. It will be used in the Actions authentication.

## Step 2: Configure ChatGPT Actions

### 2.1 Import OpenAPI Schema

1. Go to your Custom GPT configuration
2. Navigate to the **Actions** section
3. Click **Create new action**
4. Copy the OpenAPI schema from `/docs/api/openapi-spec.yaml`
5. Paste it into the schema editor

### 2.2 New Playground API Endpoints (Added August 2025)

The following new endpoints are available for admin users to test and monitor AI integrations:

**Health Monitoring:**
```yaml
/api/admin/playground/health:
  get:
    summary: Get health status of MCP Server and ChatGPT Actions
    description: Returns overall health status and individual component health
    parameters: []
    responses:
      200:
        description: Health data with status indicators
        schema:
          type: object
          properties:
            overall:
              type: string
              enum: [healthy, degraded, unhealthy, unknown]
            mcpTools:
              type: array
              items:
                type: object
                properties:
                  name: { type: string }
                  status: { type: string }
                  lastCheck: { type: string }
                  responseTime: { type: number }
                  error: { type: string }
            chatgptEndpoints:
              type: array
              items:
                type: object
                properties:
                  name: { type: string }
                  status: { type: string }
                  lastCheck: { type: string }
                  responseTime: { type: number }
                  error: { type: string }
            lastUpdated: { type: string }
```

**MCP Server Testing:**
```yaml
/api/admin/playground/test-mcp:
  post:
    summary: Test MCP server tools
    description: Run tests on all or specific MCP server tools
    parameters:
      - name: tool
        in: query
        description: Specific tool to test (optional)
        type: string
        enum: [create_blog_post, analyze_artwork, generate_audio_narration, manage_media_assets, publish_content, search_content, get_analytics]
    responses:
      200:
        description: Test results
        schema:
          type: array
          items:
            type: object
            properties:
              id: { type: string }
              type: { type: string, enum: [mcp] }
              tool: { type: string }
              status: { type: string, enum: [success, error] }
              timestamp: { type: string }
              responseTime: { type: number }
              error: { type: string }
              details: { type: object }
```

**ChatGPT Actions Testing:**
```yaml
/api/admin/playground/test-chatgpt:
  post:
    summary: Test ChatGPT Actions endpoints
    description: Run tests on all or specific ChatGPT Actions endpoints
    parameters:
      - name: endpoint
        in: query
        description: Specific endpoint to test (optional)
        type: string
        enum: [listPosts, createPost, analyzeImageAndGenerateInsights, generateAudio, getAudioJobStatus]
    responses:
      200:
        description: Test results
        schema:
          type: array
          items:
            type: object
            properties:
              id: { type: string }
              type: { type: string, enum: [chatgpt] }
              tool: { type: string }
              status: { type: string, enum: [success, error] }
              timestamp: { type: string }
              responseTime: { type: number }
              error: { type: string }
              details: { type: object }
```

**Test History Management:**
```yaml
/api/admin/playground/test-history:
  get:
    summary: Get test execution history
    description: Retrieve paginated test history with filtering options
    parameters:
      - name: type
        in: query
        description: Filter by test type
        type: string
        enum: [mcp, chatgpt]
      - name: status
        in: query
        description: Filter by test status
        type: string
        enum: [success, error]
      - name: limit
        in: query
        description: Number of results per page
        type: integer
        default: 50
      - name: offset
        in: query
        description: Pagination offset
        type: integer
        default: 0
      - name: from_date
        in: query
        description: Filter results from date (ISO string)
        type: string
      - name: to_date
        in: query
        description: Filter results to date (ISO string)
        type: string
    responses:
      200:
        description: Test history with pagination
        schema:
          type: object
          properties:
            results:
              type: array
              items:
                type: object
                properties:
                  id: { type: string }
                  type: { type: string }
                  tool: { type: string }
                  status: { type: string }
                  timestamp: { type: string }
                  responseTime: { type: number }
                  error: { type: string }
                  details: { type: object }
            pagination:
              type: object
              properties:
                limit: { type: integer }
                offset: { type: integer }
                total: { type: integer }
                hasMore: { type: boolean }
            filters:
              type: object
              properties:
                type: { type: string }
                status: { type: string }
                from_date: { type: string }
                to_date: { type: string }
  delete:
    summary: Clean up test history
    description: Delete old test results
    parameters:
      - name: type
        in: query
        description: Cleanup type
        type: string
        enum: [all, older_than_date, by_status]
        required: true
      - name: older_than
        in: query
        description: Delete results older than date (ISO string)
        type: string
      - name: status
        in: query
        description: Delete results with specific status
        type: string
        enum: [success, error]
    responses:
      200:
        description: Cleanup results
        schema:
          type: object
          properties:
            message: { type: string }
            deletedCount: { type: integer }
            deleteType: { type: string }
            parameters: { type: object }
```

### 2.3 Configure Authentication

1. Set **Authentication Type** to **API Key**
2. Set **API Key** to **Bearer Token**
3. Enter your generated API key
4. Set the header name to **Authorization**

### 2.4 Configure Privacy Policy

Set the privacy policy URL (optional):
```
https://artfularchivesstudio.com/privacy
```

## Step 3: Test the Integration

### 3.1 Basic Test Conversation

Test with this conversation flow:

```
User: "Hello! Can you help me create a blog post?"
GPT: "I'd be happy to help you create a blog post! I can assist with analyzing artwork images, generating content, and publishing posts. What would you like to create a post about?"

User: "I have an artwork image I'd like to analyze"
GPT: "Perfect! Please upload your artwork image and I'll analyze it using AI to create engaging blog content."

[User uploads image]
GPT: [Calls analyze-image action] "I've analyzed your artwork! Here's what I found..." [Shows analysis] "Would you like me to create a blog post based on this analysis?"

User: "Yes, please create the post"
GPT: [Calls create post action] "I've created your blog post! Here are the details..." [Shows post info] "Would you like me to generate an audio narration for this post?"

User: "Yes, generate audio"
GPT: [Calls generate-audio action] "I've generated an audio narration! The audio has been saved and associated with your post. Would you like to publish the post now?"

User: "Yes, publish it"
GPT: [Calls publish action] "Your blog post has been published successfully! You can view it at [URL]"
```

### 3.2 Error Handling Test

Test error scenarios:

```
User: "Create a post without any content"
GPT: [Calls create post with empty content] [Receives validation error] "I need some content to create a post. Could you provide the title and content for your blog post?"
```

## Step 4: Custom GPT Instructions

Add these instructions to your Custom GPT:

```markdown
# Artful Archives Studio Assistant

You are an AI assistant for Artful Archives Studio, specializing in art content creation and blog management. You help users create engaging blog posts about artwork through a conversational interface.

## Core Capabilities

### Image Analysis
- When users upload artwork images, use the `analyze-image` action
- Provide detailed analysis from both OpenAI and Claude
- Suggest titles and improvements
- Ask if they want to create a blog post from the analysis

### Content Creation
- Use the `create-post` action to create blog posts
- Always validate required fields (title, content)
- Suggest SEO-friendly titles and slugs
- Offer to generate audio narrations

### Audio Generation
- Use the `generate-audio` action for TTS narrations
- Recommend voice options based on content type
- Save audio to storage when creating narrations
- Associate audio with blog posts

### Publishing Workflow
- Guide users through draft → review → publish workflow
- Use the `publish` action when users are ready
- Provide public URLs after publishing
- Explain publishing options (immediate vs scheduled)

## Conversation Flow Guidelines

### 1. Initial Greeting
- Introduce capabilities
- Ask what type of content they want to create
- Offer to analyze artwork or create posts

### 2. Image Analysis
- Request image upload if they mention artwork
- Use `analysis_type=detailed` for blog posts
- Present analysis results clearly
- Offer to create post from analysis

### 3. Post Creation
- Collect title and content requirements
- Use analysis results as content base
- Create post with `status=draft` initially
- Show post details after creation

### 4. Audio Generation
- Offer audio generation after post creation
- Use appropriate voice (Bella for art content)
- Set `save_to_storage=true` for permanent posts
- Confirm audio generation success

### 5. Publishing
- Review post details before publishing
- Use `publish` action when user confirms
- Provide public URL and confirmation
- Offer social media sharing options

## Error Handling

### API Errors
- Explain errors in user-friendly terms
- Suggest corrections for validation errors
- Retry with corrected data when possible
- Offer alternative approaches if needed

### Rate Limiting
- If rate limited, explain the delay
- Suggest waiting or trying fewer operations
- Prioritize user's most important requests

### Content Issues
- Validate content before API calls
- Suggest improvements for empty/short content
- Help with SEO optimization
- Guide content structure

## Best Practices

### Content Quality
- Encourage detailed, engaging content
- Suggest art-focused keywords and themes
- Recommend proper formatting
- Offer SEO title suggestions

### User Experience
- Keep conversations natural and helpful
- Explain what you're doing with each action
- Ask for confirmation before publishing
- Provide clear status updates

### Technical Details
- Use appropriate API scopes for each action
- Handle file uploads correctly
- Set proper parameters for each endpoint
- Include error context in responses

## Voice and Tone

- Professional but approachable
- Art-focused and knowledgeable
- Encouraging creativity
- Clear about technical processes
- Helpful with content improvement

Remember: You're helping create beautiful, engaging content about art. Focus on the creative and educational aspects while handling the technical details smoothly.
```

## Step 5: Advanced Configuration

### 5.1 Webhook Integration (Optional)

Set up webhooks for real-time updates:

```typescript
// Example webhook handler
export async function POST(request: Request) {
  const { event, data } = await request.json()
  
  switch (event) {
    case 'post.published':
      // Notify external systems
      break
    case 'audio.generated':
      // Update progress tracking
      break
  }
  
  return Response.json({ received: true })
}
```

### 5.2 Custom Prompts

Customize AI analysis prompts for different use cases:

```typescript
const customPrompts = {
  social_media: "Create engaging, shareable content perfect for social media platforms...",
  technical: "Focus on artistic technique, medium analysis, and technical execution...",
  educational: "Provide educational content suitable for art students and enthusiasts..."
}
```

### 5.3 Voice Selection Logic

Implement smart voice selection:

```typescript
function selectVoice(contentType: string, contentLength: number) {
  if (contentType === 'artistic' && contentLength > 500) {
    return 'Bella' // Sophisticated, clear
  } else if (contentType === 'casual') {
    return 'Josh' // Friendly, approachable
  }
  return 'Bella' // Default
}
```

## Step 6: Testing Scenarios

### Scenario 1: Complete Workflow
```
1. Upload artwork image
2. Get AI analysis
3. Create blog post
4. Generate audio
5. Publish post
6. Get public URL
```

### Scenario 2: Content Editing
```
1. Create draft post
2. Edit content through conversation
3. Update post via API
4. Preview changes
5. Publish when ready
```

### Scenario 3: Media Management
```
1. Upload multiple images
2. Tag and organize media
3. Use in blog posts
4. Track usage
```

## Troubleshooting

### Common Issues

**401 Unauthorized**
- Check API key format and validity
- Verify authentication configuration
- Ensure Bearer token format

**403 Forbidden**
- Check API key scopes
- Verify required permissions
- Review scope configuration

**429 Rate Limited**
- Wait for rate limit reset
- Reduce request frequency
- Check rate limit headers

**400 Validation Error**
- Review request body format
- Check required fields
- Validate data types

### Debug Mode

Enable detailed logging:

```typescript
const debugMode = process.env.NODE_ENV === 'development'

if (debugMode) {
  console.log('API Request:', {
    method,
    url,
    headers,
    body
  })
}
```

## Security Considerations

### API Key Management
- Use environment variables
- Rotate keys regularly
- Monitor usage patterns
- Set appropriate rate limits

### Content Validation
- Sanitize user inputs
- Validate file uploads
- Check content length limits
- Filter inappropriate content

### Access Control
- Use minimal required scopes
- Implement proper authentication
- Log all API access
- Monitor for abuse

## Performance Optimization

### Caching Strategies
- Cache AI analysis results
- Store generated audio files
- Use CDN for media assets
- Implement request deduplication

### Rate Limit Management
- Batch related operations
- Prioritize user interactions
- Implement exponential backoff
- Use efficient endpoints

## Monitoring and Analytics

### Key Metrics
- API request success rates
- Response times
- Error rates by endpoint
- User engagement patterns

### Logging
- Request/response logging
- Error tracking
- Performance monitoring
- Usage analytics

## Next Steps

1. **Deploy to Production**: Use production API endpoints
2. **Monitor Usage**: Track API performance and errors
3. **Gather Feedback**: Collect user experience feedback
4. **Iterate and Improve**: Enhance based on real usage
5. **Scale Infrastructure**: Optimize for increased usage

## Support

For technical support:
- Check API documentation: `/docs/api/`
- Review error responses
- Monitor system status
- Contact development team

The ChatGPT Actions integration provides a powerful, conversational interface for content management, making it easy for users to create, edit, and publish engaging art-focused blog content.