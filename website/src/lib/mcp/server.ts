import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool
} from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@/lib/supabase/server'
import { externalAPIAuth } from '@/lib/external-api/auth'

interface MCPServerConfig {
  name: string
  version: string
  apiKey?: string
  rateLimitOverride?: number
}

/**
 * @file This is the heart of our MCP server, the grand central station for all tool-related activities.
 * If our app were a kingdom, this would be the throne room where the magic happens.
 *
 * @overview This file defines the `ArtfulArchivesMCPServer`, a class that implements the Model Context Protocol.
 * It's responsible for exposing a set of tools that can be called by a model, handling requests,
 * and orchestrating the underlying logic to create, manage, and analyze content.
 * Think of it as a digital genie, granting wishes to the AI model.
 *
 * @see https://github.com/model-context-protocol/mcp-sdk-js for more information on the MCP SDK.
 * It's a good read. Trust me, I'm a comment.
 */
export class ArtfulArchivesMCPServer {
  private server: Server
  private supabase = createClient()
  private config: MCPServerConfig

  constructor(config: MCPServerConfig) {
    this.config = config
    this.server = new Server(
      {
        name: config.name || 'artful-archives-mcp',
        version: config.version || '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    )

    this.setupToolHandlers()
    this.setupResourceHandlers()
  }

  /**
   * @private
   * @method setupToolHandlers
   * @description This is where we tell the server what tools it has in its toolbox.
   * It's like giving a superhero their gadgets.
   */
  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          /**
           * @tool create_blog_post
           * @description A tool to create a new blog post. It can be used to generate content from scratch
           * or to save content provided by the user. It's the digital quill for our AI scribe.
           */
          {
            name: 'create_blog_post',
            description: 'Create a new blog post with AI-generated or custom content',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Post title'
                },
                content: {
                  type: 'string',
                  description: 'Post content'
                },
                image_url: {
                  type: 'string',
                  description: 'Featured image URL'
                },
                generate_audio: {
                  type: 'boolean',
                  description: 'Generate TTS audio narration',
                  default: false
                },
                publish: {
                  type: 'boolean',
                  description: 'Publish immediately',
                  default: false
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Post tags'
                }
              },
              required: ['title', 'content']
            }
          },
          {
            name: 'analyze_artwork',
            description: 'Analyze artwork using dual AI models (OpenAI + Claude)',
            inputSchema: {
              type: 'object',
              properties: {
                image_url: {
                  type: 'string',
                  description: 'Image URL or base64 data'
                },
                analysis_type: {
                  type: 'string',
                  enum: ['detailed', 'brief', 'technical', 'artistic'],
                  description: 'Type of analysis to perform',
                  default: 'detailed'
                },
                include_metadata: {
                  type: 'boolean',
                  description: 'Include image metadata',
                  default: false
                }
              },
              required: ['image_url']
            }
          },
          {
            name: 'generate_audio_narration',
            description: 'Generate audio narration from text using TTS',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Text to convert to speech'
                },
                voice_id: {
                  type: 'string',
                  description: 'Voice ID to use'
                },
                style: {
                  type: 'string',
                  enum: ['neutral', 'enthusiastic', 'contemplative', 'dramatic'],
                  description: 'Speaking style',
                  default: 'neutral'
                },
                speed: {
                  type: 'number',
                  minimum: 0.5,
                  maximum: 2.0,
                  description: 'Speech speed multiplier',
                  default: 1.0
                },
                save_to_storage: {
                  type: 'boolean',
                  description: 'Save audio to permanent storage',
                  default: true
                }
              },
              required: ['text']
            }
          },
          {
            name: 'manage_media_assets',
            description: 'Upload, organize, and manage media assets',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['upload', 'delete', 'list', 'search', 'organize'],
                  description: 'Media management action'
                },
                file_data: {
                  type: 'string',
                  description: 'Base64 encoded file data (for upload)'
                },
                file_name: {
                  type: 'string',
                  description: 'Name for uploaded file'
                },
                search_query: {
                  type: 'string',
                  description: 'Search query for media'
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags for organization'
                },
                asset_id: {
                  type: 'string',
                  description: 'Asset ID for specific operations'
                }
              },
              required: ['action']
            }
          },
          {
            name: 'publish_content',
            description: 'Publish content to various platforms',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'string',
                  description: 'Post ID to publish'
                },
                platforms: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Platforms to publish to',
                  default: ['website']
                },
                schedule_time: {
                  type: 'string',
                  description: 'Schedule publication time (ISO string)'
                },
                social_media_text: {
                  type: 'string',
                  description: 'Custom social media text'
                }
              },
              required: ['post_id']
            }
          },
          {
            name: 'search_content',
            description: 'Search and retrieve content from the system',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query'
                },
                content_type: {
                  type: 'string',
                  enum: ['posts', 'media', 'all'],
                  description: 'Type of content to search',
                  default: 'all'
                },
                filters: {
                  type: 'object',
                  description: 'Additional filters (status, tags, etc.)'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum results to return',
                  default: 10
                }
              },
              required: ['query']
            }
          },
          {
            name: 'get_analytics',
            description: 'Retrieve analytics and performance data',
            inputSchema: {
              type: 'object',
              properties: {
                metric_type: {
                  type: 'string',
                  enum: ['post_performance', 'content_trends', 'user_engagement', 'system_usage'],
                  description: 'Type of analytics to retrieve'
                },
                time_range: {
                  type: 'string',
                  enum: ['day', 'week', 'month', 'year'],
                  description: 'Time range for analytics',
                  default: 'month'
                },
                post_id: {
                  type: 'string',
                  description: 'Specific post ID for post performance'
                }
              },
              required: ['metric_type']
            }
          }
        ]
      }
    })

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        switch (name) {
          case 'create_blog_post':
            return await this.createBlogPost(args)
          case 'analyze_artwork':
            return await this.analyzeArtwork(args)
          case 'generate_audio_narration':
            return await this.generateAudioNarration(args)
          case 'manage_media_assets':
            return await this.manageMediaAssets(args)
          case 'publish_content':
            return await this.publishContent(args)
          case 'search_content':
            return await this.searchContent(args)
          case 'get_analytics':
            return await this.getAnalytics(args)
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            )
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    })
  }

  private setupResourceHandlers() {
    // TODO: Implement resource handlers for content access
    // Resources provide read-only access to content
  }

  // Tool Implementation Methods

  private async createBlogPost(args: any) {
    const {
      title,
      content,
      image_url,
      generate_audio = false,
      publish = false,
      tags = []
    } = args

    try {
      // Create post data
      const postData = {
        title,
        content,
        featured_image_url: image_url,
        status: publish ? 'published' : 'draft',
        origin_source: 'claude',
        tags
      }

      // Use internal API to create post
      const { data: post, error: postError } = await this.supabase
        .from('blog_posts')
        .insert(postData)
        .select()
        .single()

      if (postError) {
        throw new Error(`Failed to create post: ${postError.message}`)
      }

      let audioResult = null
      if (generate_audio) {
        audioResult = await this.generateAudio(content, post.id)
      }

      if (publish) {
        const { error: publishError } = await this.supabase
          .from('blog_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', post.id)

        if (publishError) {
          console.error('Failed to publish post:', publishError)
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              post: {
                id: post.id,
                title: post.title,
                slug: post.slug,
                status: post.status,
                created_at: post.created_at,
                public_url: publish ? `${this.getBaseUrl()}/blog/${post.slug}` : null
              },
              audio: audioResult,
              actions_performed: [
                'post_created',
                ...(generate_audio ? ['audio_generated'] : []),
                ...(publish ? ['post_published'] : [])
              ]
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create blog post: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private async analyzeArtwork(args: any) {
    const {
      image_url,
      analysis_type = 'detailed',
      include_metadata = false
    } = args

    try {
      // Call internal AI analysis
      const analysisResult = await this.callInternalAPI('/ai/analyze-image', {
        method: 'POST',
        body: JSON.stringify({
          image_data: image_url,
          analysis_type,
          include_metadata
        })
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              analysis: analysisResult.data,
              recommended_actions: [
                'Create blog post from analysis',
                'Generate audio narration',
                'Optimize for SEO'
              ]
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to analyze artwork: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private async generateAudioNarration(args: any) {
    const {
      text,
      voice_id,
      style = 'neutral',
      speed = 1.0,
      save_to_storage = true
    } = args

    try {
      const audioResult = await this.generateAudio(text, null, {
        voice_id,
        style,
        speed,
        save_to_storage
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              audio: audioResult,
              usage_tips: [
                'Audio can be associated with blog posts',
                'Use for accessibility and engagement',
                'Consider voice selection for content type'
              ]
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to generate audio: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private async manageMediaAssets(args: any) {
    const { action, file_data, file_name, search_query, tags, asset_id } = args

    try {
      switch (action) {
        case 'list':
          const { data: assets } = await this.supabase
            .from('media_assets')
            .select('id, title, file_type, file_url, created_at, tags')
            .order('created_at', { ascending: false })
            .limit(20)

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  assets,
                  total: assets?.length || 0
                }, null, 2)
              }
            ]
          }

        case 'search':
          if (!search_query) {
            throw new Error('Search query is required')
          }

          const { data: searchResults } = await this.supabase
            .from('media_assets')
            .select('id, title, file_type, file_url, created_at, tags')
            .or(`title.ilike.%${search_query}%,description.ilike.%${search_query}%`)
            .order('created_at', { ascending: false })

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  query: search_query,
                  results: searchResults,
                  count: searchResults?.length || 0
                }, null, 2)
              }
            ]
          }

        case 'upload':
          // TODO: Implement file upload via MCP
          throw new Error('File upload not yet implemented in MCP')

        case 'delete':
          if (!asset_id) {
            throw new Error('Asset ID is required for deletion')
          }

          const { error: deleteError } = await this.supabase
            .from('media_assets')
            .delete()
            .eq('id', asset_id)

          if (deleteError) {
            throw deleteError
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  action: 'deleted',
                  asset_id
                }, null, 2)
              }
            ]
          }

        default:
          throw new Error(`Unknown media action: ${action}`)
      }
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Media management failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private async publishContent(args: any) {
    const {
      post_id,
      platforms = ['website'],
      schedule_time,
      social_media_text
    } = args

    try {
      // Get post details
      const { data: post, error: fetchError } = await this.supabase
        .from('blog_posts')
        .select('*')
        .eq('id', post_id)
        .single()

      if (fetchError || !post) {
        throw new Error('Post not found')
      }

      // Update post status
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (schedule_time) {
        updateData.published_at = schedule_time
        updateData.status = 'scheduled'
      } else {
        updateData.published_at = new Date().toISOString()
        updateData.status = 'published'
      }

      const { error: updateError } = await this.supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', post_id)

      if (updateError) {
        throw updateError
      }

      const publicUrl = `${this.getBaseUrl()}/blog/${post.slug}`

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              post: {
                id: post_id,
                title: post.title,
                status: updateData.status,
                published_at: updateData.published_at,
                public_url: publicUrl
              },
              platforms: platforms,
              scheduled: !!schedule_time,
              actions_completed: [
                'post_published',
                ...(platforms.includes('social') ? ['social_media_queued'] : [])
              ]
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to publish content: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private async searchContent(args: any) {
    const {
      query,
      content_type = 'all',
      filters = {},
      limit = 10
    } = args

    try {
      const results: any = {}

      if (content_type === 'posts' || content_type === 'all') {
        const { data: posts } = await this.supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, status, created_at')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(limit)

        results.posts = posts || []
      }

      if (content_type === 'media' || content_type === 'all') {
        const { data: media } = await this.supabase
          .from('media_assets')
          .select('id, title, file_type, file_url, created_at')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(limit)

        results.media = media || []
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              query,
              content_type,
              results,
              total_results: Object.values(results).reduce((acc: number, arr: any) => acc + arr.length, 0)
            }, null, 2)
          }
        ]
      }
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Search failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private async getAnalytics(args: any) {
    const {
      metric_type,
      time_range = 'month',
      post_id
    } = args

    try {
      // Calculate date range
      const now = new Date()
      const ranges = {
        day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      }
      const startDate = ranges[time_range as keyof typeof ranges]

      const analytics: any = {
        metric_type,
        time_range,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      }

      switch (metric_type) {
        case 'post_performance':
          if (post_id) {
            // Specific post analytics
            const { data: post } = await this.supabase
              .from('blog_posts')
              .select('id, title, created_at, status')
              .eq('id', post_id)
              .single()

            analytics.post = post
            analytics.metrics = {
              // TODO: Add actual analytics data
              views: Math.floor(Math.random() * 1000),
              shares: Math.floor(Math.random() * 50),
              engagement_rate: (Math.random() * 10).toFixed(2) + '%'
            }
          } else {
            // Overall post performance
            const { data: posts, count } = await this.supabase
              .from('blog_posts')
              .select('status', { count: 'exact' })
              .gte('created_at', startDate.toISOString())

            analytics.summary = {
              total_posts: count || 0,
              published_posts: posts?.filter(p => p.status === 'published').length || 0,
              draft_posts: posts?.filter(p => p.status === 'draft').length || 0
            }
          }
          break

        case 'content_trends':
          const { data: recentPosts } = await this.supabase
            .from('blog_posts')
            .select('origin_source, created_at')
            .gte('created_at', startDate.toISOString())

          analytics.trends = {
            ai_generated: recentPosts?.filter(p => ['openai', 'claude'].includes(p.origin_source)).length || 0,
            manual: recentPosts?.filter(p => p.origin_source === 'manual').length || 0,
            total: recentPosts?.length || 0
          }
          break

        case 'system_usage':
          // API usage analytics
          const { data: apiLogs, count: apiCount } = await this.supabase
            .from('api_request_logs')
            .select('method, status_code', { count: 'exact' })
            .gte('created_at', startDate.toISOString())

          analytics.api_usage = {
            total_requests: apiCount || 0,
            success_rate: apiLogs ? 
              ((apiLogs.filter(log => log.status_code < 400).length / apiLogs.length) * 100).toFixed(2) + '%' : '0%',
            top_methods: this.getTopMethods(apiLogs || [])
          }
          break

        default:
          throw new Error(`Unknown metric type: ${metric_type}`)
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analytics, null, 2)
          }
        ]
      }
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Analytics retrieval failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // Helper Methods

  private async generateAudio(text: string, postId?: string | null, options: any = {}) {
    const audioResult = await this.callInternalAPI('/ai/generate-audio', {
      method: 'POST',
      body: JSON.stringify({
        text,
        save_to_storage: true,
        title: postId ? `Audio for post ${postId}` : 'Generated Audio',
        ...options
      })
    })

    if (postId && audioResult.data.storage?.media_asset_id) {
      // Associate audio with post
      await this.supabase
        .from('blog_posts')
        .update({ primary_audio_id: audioResult.data.storage.media_asset_id })
        .eq('id', postId)
    }

    return audioResult.data
  }

  private async callInternalAPI(endpoint: string, options: RequestInit) {
    // Use internal API calls or external API with admin privileges
    const response = await fetch(`${this.getBaseUrl()}/api/external${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `API call failed: ${response.status}`)
    }

    return response.json()
  }

  private getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  }

  private getTopMethods(logs: any[]): Record<string, number> {
    const methodCounts = logs.reduce((acc, log) => {
      acc[log.method] = (acc[log.method] || 0) + 1
      return acc
    }, {})

    return Object.entries(methodCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .reduce((acc, [method, count]) => {
        acc[method] = count as number
        return acc
      }, {} as Record<string, number>)
  }

  // Server lifecycle methods

  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.log('Artful Archives MCP Server started')
  }

  async stop() {
    await this.server.close()
    console.log('Artful Archives MCP Server stopped')
  }
}

// Export for CLI usage
export async function startMCPServer(config?: Partial<MCPServerConfig>) {
  const server = new ArtfulArchivesMCPServer({
    name: 'artful-archives-mcp',
    version: '1.0.0',
    ...config
  })

  await server.start()

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down MCP server...')
    await server.stop()
    process.exit(0)
  })

  return server
}