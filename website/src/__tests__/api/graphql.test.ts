import { POST } from '@/app/api/graphql/route'
import { describe, expect, test, vi, afterEach } from 'vitest'

// 🧪 GraphQL API test – ensures our tiny playground actually pokes the edge function
describe('api/graphql', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('posts query proxies to edge function', async () => {
    process.env.SUPABASE_URL = 'https://demo.supabase.co'
    const mockFetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve([{ id: '42' }]) })
    // @ts-ignore – monkey patch global fetch for this test
    global.fetch = mockFetch

    const req = { json: async () => ({ query: '{ posts { id } }' }) } as any
    const res = await POST(req)
    const body = await res.json()

    expect(body.data.posts[0].id).toBe('42')
    expect(mockFetch).toHaveBeenCalledWith('https://demo.supabase.co/functions/v1/posts')
  })
})

