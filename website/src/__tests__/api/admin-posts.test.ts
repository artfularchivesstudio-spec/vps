import { GET, PUT } from '@/app/api/admin/posts/route'
import { describe, afterEach, it, expect, vi } from 'vitest'

/**
 * 🧪📝 verify admin posts route proxies CRUD to edge function
 * Each test pokes a different method, making sure the proxy doesn't hoard logic 🏓
 */
describe('api/admin/posts proxy', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('relays GET queries to edge function 🎯', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    const mockFetch = vi.fn().mockResolvedValue({ status: 200, text: () => Promise.resolve('hi') })
    // @ts-ignore: patch global fetch for the proxy
    global.fetch = mockFetch

    const req = { method: 'GET', url: 'https://host/api/admin/posts?id=1', text: async () => '' } as any
    const res = await GET(req)
    expect(await res.text()).toBe('hi')
    expect(mockFetch).toHaveBeenCalledWith('https://demo.supabase.co/functions/v1/posts?id=1', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: undefined
    })
  })

  it('relays PUT payloads to edge function ✍️', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    const mockFetch = vi.fn().mockResolvedValue({ status: 200, text: () => Promise.resolve('ok') })
    // @ts-ignore: patch global fetch for the proxy
    global.fetch = mockFetch

    const body = { title: 'New' };
    const req = {
      method: 'PUT',
      url: 'https://host/api/admin/posts?id=2',
      text: async () => JSON.stringify(body),
      clone: () => ({
        json: async () => body,
      }),
    } as any;

    const res = await PUT(req)
    expect(await res.text()).toBe('ok')
    expect(mockFetch).toHaveBeenCalledWith('https://demo.supabase.co/functions/v1/posts?id=2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{"title":"New"}'
    })
  })
})

