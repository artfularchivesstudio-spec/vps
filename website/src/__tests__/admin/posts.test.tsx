import PostsPage from '@/app/admin/(protected)/posts/page'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the dependencies
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => ({
            data: [
              {
                id: '1',
                title: 'Test Post',
                slug: 'test-post',
                status: 'published',
                origin_source: 'manual',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                featured_image_url: null,
                excerpt: 'Test excerpt',
                content: 'Test content',
                primary_audio_id: null,
                ai_analysis_openai: null,
                ai_analysis_claude: null,
                selected_ai_provider: null,
                title_translations: null,
                content_translations: null,
                excerpt_translations: null,
                published_at: '2024-01-01T00:00:00Z'
              }
            ],
            error: null
          })),
          count: vi.fn(() => ({ count: 1, error: null }))
        })),
        delete: vi.fn(() => ({ error: null })),
        update: vi.fn(() => ({ error: null }))
      })),
      channel: vi.fn(() => ({
        on: vi.fn(() => ({
          subscribe: vi.fn(() => ({
            then: vi.fn((callback) => callback('SUBSCRIBED'))
          }))
        })),
        subscribe: vi.fn()
      })),
      removeChannel: vi.fn()
    })),
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'test-user' } } }))
    }
  })
}))

vi.mock('@/components/ui/ToastProvider', () => ({
  useToast: () => ({
    push: vi.fn()
  })
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  useParams: () => ({ id: '1' })
}))

describe('PostsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<PostsPage />)
    expect(screen.getByText('Loading posts...')).toBeInTheDocument()
  })

  it('renders posts table when data is loaded', async () => {
    render(<PostsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })
    
    expect(screen.getByText('test-post')).toBeInTheDocument()
    expect(screen.getByText('published')).toBeInTheDocument()
  })

  it('filters posts by search term', async () => {
    render(<PostsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search posts...')
    await userEvent.type(searchInput, 'Nonexistent')
    
    expect(screen.queryByText('Test Post')).not.toBeInTheDocument()
    expect(screen.getByText('No posts found')).toBeInTheDocument()
  })

  it('filters posts by status', async () => {
    render(<PostsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })
    
    const statusSelect = screen.getByLabelText('Status')
    await userEvent.selectOptions(statusSelect, 'draft')
    
    expect(screen.queryByText('Test Post')).not.toBeInTheDocument()
    expect(screen.getByText('No posts found')).toBeInTheDocument()
  })

  it('toggles post status', async () => {
    render(<PostsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })
    
    const publishButton = screen.getByText('Unpublish')
    await userEvent.click(publishButton)
    
    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument()
    })
  })

  it('handles bulk selection', async () => {
    render(<PostsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })
    
    const checkbox = screen.getByLabelText('Select post: Test Post')
    await userEvent.click(checkbox)
    
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    expect(screen.getByText('Bulk actions available')).toBeInTheDocument()
  })

  it('handles pagination', async () => {
    // Mock multiple pages of data
    const mockSupabase = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => ({
              data: Array(10).fill(null).map((_, i) => ({
                id: `${i + 1}`,
                title: `Post ${i + 1}`,
                slug: `post-${i + 1}`,
                status: 'published',
                origin_source: 'manual',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                featured_image_url: null,
                excerpt: `Excerpt ${i + 1}`,
                content: `Content ${i + 1}`,
                primary_audio_id: null,
                ai_analysis_openai: null,
                ai_analysis_claude: null,
                selected_ai_provider: null,
                title_translations: null,
                content_translations: null,
                excerpt_translations: null,
                published_at: '2024-01-01T00:00:00Z'
              })),
              error: null
            })),
            count: vi.fn(() => ({ count: 25, error: null }))
          })),
          delete: vi.fn(() => ({ error: null })),
          update: vi.fn(() => ({ error: null }))
        })),
        channel: vi.fn(() => ({
          on: vi.fn(() => ({
            subscribe: vi.fn(() => ({
              then: vi.fn((callback) => callback('SUBSCRIBED'))
            }))
          })),
          subscribe: vi.fn()
        })),
        removeChannel: vi.fn()
      })),
      auth: {
        getUser: vi.fn(() => ({ data: { user: { id: 'test-user' } } }))
      }
    }))

    vi.doMock('@/lib/supabase/client', () => ({
      createClient: mockSupabase
    }))

    render(<PostsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })
    
    const nextButton = screen.getByText('Next')
    await userEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })
  })

  it('handles errors gracefully', async () => {
    const mockSupabase = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => ({
              data: null,
              error: { message: 'Database connection failed' }
            })),
            count: vi.fn(() => ({ count: 0, error: null }))
          })),
          delete: vi.fn(() => ({ error: null })),
          update: vi.fn(() => ({ error: null }))
        })),
        channel: vi.fn(() => ({
          on: vi.fn(() => ({
            subscribe: vi.fn(() => ({
              then: vi.fn((callback) => callback('SUBSCRIBED'))
            }))
          })),
          subscribe: vi.fn()
        })),
        removeChannel: vi.fn()
      })),
      auth: {
        getUser: vi.fn(() => ({ data: { user: { id: 'test-user' } } }))
      }
    }))

    vi.doMock('@/lib/supabase/client', () => ({
      createClient: mockSupabase
    }))

    render(<PostsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load posts')).toBeInTheDocument()
    })
  })
})