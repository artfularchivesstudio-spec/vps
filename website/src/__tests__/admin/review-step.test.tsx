import ReviewStep from '@/components/admin/wizard/ReviewStep'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// 🧪 Function-level comment: checks that analysis kicks off blog brewing and fills the editor ☕️📝
describe('ReviewStep', () => {
  it('generates blog content from analysis', async () => {
    const mockSetPostData = vi.fn()
    const postData = { analysis: 'Shiny statue in moonlit plaza.' }

    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            blogContent: 'Night owls admire the glow.',
            suggestedTitle: 'Moonlit Marvel',
            suggestedSlug: 'moonlit-marvel',
            excerpt: 'A brief shimmer tale.'
          }),
          { status: 200 }
        )
      )
    )
    vi.stubGlobal('fetch', fetchMock as any)

    render(
      <ReviewStep
        onNext={vi.fn()}
        onBack={vi.fn()}
        postData={postData}
        setPostData={mockSetPostData}
      />
    )

    expect(screen.getByText('Shiny statue in moonlit plaza.')).toBeInTheDocument()

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/generate-blog-content',
        expect.any(Object)
      )
    )

    await waitFor(() =>
      expect(mockSetPostData).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Night owls admire the glow.',
          title: 'Moonlit Marvel',
          slug: 'moonlit-marvel',
          excerpt: 'A brief shimmer tale.'
        })
      )
    )
  })
})
