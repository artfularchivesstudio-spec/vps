import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock MCP SDK modules (virtual) so tests don't need the real package installed
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  class Server {
    requestHandlers: Record<string, any> = {}
    constructor(_: any, __: any) {}
    setRequestHandler(schema: any, handler: any) {
      const types = require('@modelcontextprotocol/sdk/types.js')
      if (schema === types.CallToolRequestSchema) {
        this.requestHandlers.CallToolRequestSchema = handler
      } else if (schema === types.ListToolsRequestSchema) {
        this.requestHandlers.ListToolsRequestSchema = handler
      } else {
        this.requestHandlers[schema] = handler
      }
    }
    async connect() {}
    async close() {}
  }
  return { Server }
}, { virtual: true })

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  class StdioServerTransport {}
  return { StdioServerTransport }
}, { virtual: true })

vi.mock('@modelcontextprotocol/sdk/types.js', () => {
  return {
    CallToolRequestSchema: {},
    ListToolsRequestSchema: {},
    McpError: class extends Error { constructor(public code: any, msg: string){ super(msg) } },
    ErrorCode: { InternalError: 'InternalError', MethodNotFound: 'MethodNotFound' }
  }
}, { virtual: true })

// Provide virtual mocks for path-alias modules used in the server
vi.mock('@/lib/supabase/server', () => {
  // Minimal stub client – specific behaviors are overridden in tests when needed
  const noopBuilder = {
    select: () => noopBuilder,
    order: () => noopBuilder,
    limit: () => ({ data: [] as any[] }),
    or: () => ({ data: [] as any[] }),
    delete: () => ({ error: null }),
    update: () => ({ eq: () => ({ error: null }) }),
    eq: () => ({ single: () => ({ data: null }) }),
    single: () => ({ data: null })
  }
  const createClient = () => ({
    from: () => noopBuilder
  })
  return { createClient }
}, { virtual: true })

vi.mock('@/lib/external-api/auth', () => ({ externalAPIAuth: {} }), { virtual: true })

// Import after mocks
import { ArtfulArchivesMCPServer } from '@/lib/mcp/server'

// Helper to set up server with test config
const makeServer = () => new ArtfulArchivesMCPServer({ name: 'test-mcp', version: '0.0.0', apiKey: 'test-key' }) as any

// TODO: re-enable once MCP server mock wiring supports call-tool requests 🌙
describe.skip('MCP Tools - basic behaviors', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // default base URL for URL building in publish_content
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  })

  it('analyze_artwork returns analysis payload from internal API', async () => {
    const fakeAnalysis = { caption: 'A test image', tags: ['test'] }
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ data: fakeAnalysis }) })) as any)

    const server = makeServer()
    // Simulate MCP tool call
    const mockRequest = {
      params: {
        name: 'analyze_artwork',
        arguments: { image_url: 'data:image/png;base64,xxx', analysis_type: 'detailed', include_metadata: false }
      }
    }
    const res = await server.server.requestHandlers.CallToolRequestSchema(mockRequest)
    const payload = JSON.parse(res.content[0].text)

    expect(payload.success).toBe(true)
    expect(payload.analysis).toEqual(fakeAnalysis)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/external/ai/analyze-image'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('generate_audio_narration returns audio data and usage tips', async () => {
    const fakeAudio = { url: 'https://storage/audio/test.mp3', storage: null }
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ data: fakeAudio }) })) as any)

    const server = makeServer()
    // Simulate MCP tool call
    const mockRequest = {
      params: {
        name: 'generate_audio_narration',
        arguments: { text: 'Hello world', style: 'neutral', speed: 1 }
      }
    }
    const res = await server.server.requestHandlers.CallToolRequestSchema(mockRequest)
    const payload = JSON.parse(res.content[0].text)

    expect(payload.success).toBe(true)
    expect(payload.audio).toEqual(fakeAudio)
  })

  it('manage_media_assets list returns recent assets from Supabase', async () => {
    const assets = [
      { id: '1', title: 'Asset1', file_type: 'image/png', file_url: 'https://x/1.png', created_at: '2025-01-01', tags: ['a'] },
      { id: '2', title: 'Asset2', file_type: 'audio/mpeg', file_url: 'https://x/2.mp3', created_at: '2025-01-02', tags: ['b'] }
    ]

    const listBuilder = {
      select: () => listBuilder,
      order: () => listBuilder,
      limit: () => ({ data: assets })
    }

    const server = makeServer()
    // override supabase client for this instance
    server.supabase = { from: () => listBuilder }

    // Simulate MCP tool call
    const mockRequest = {
      params: {
        name: 'manage_media_assets',
        arguments: { action: 'list' }
      }
    }
    const res = await server.server.requestHandlers.CallToolRequestSchema(mockRequest)
    const payload = JSON.parse(res.content[0].text)
    expect(payload.success).toBe(true)
    expect(payload.total).toBe(2)
  })

  it('publish_content publishes immediately and returns public URL', async () => {
    const post = { id: 'p1', title: 'Hello', slug: 'hello' }

    // Chain: from('blog_posts').select('*').eq('id', post_id).single()
    const selectChain = {
      eq: () => ({ single: () => ({ data: post }) })
    }
    const updateChain = { eq: () => ({ error: null }) }

    const supabaseStub = {
      from: (table: string) => ({
        select: () => selectChain,
        update: () => updateChain
      })
    }

    const server = makeServer()
    server.supabase = supabaseStub

    // Simulate MCP tool call
    const mockRequest = {
      params: {
        name: 'publish_content',
        arguments: { post_id: 'p1', platforms: ['website'] }
      }
    }
    const res = await server.server.requestHandlers.CallToolRequestSchema(mockRequest)
    const payload = JSON.parse(res.content[0].text)

    expect(payload.success).toBe(true)
    expect(payload.post.status).toBe('published')
    expect(payload.post.public_url).toBe('http://localhost:3000/blog/hello')
  })
})

