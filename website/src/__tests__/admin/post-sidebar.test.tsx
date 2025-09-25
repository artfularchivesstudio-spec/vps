import { PostSidebar } from '@/components/admin/posts/PostSidebar'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

/**
 * 🧪 ensures PostSidebar lists translated text/audio languages
 * A tiny census of tongues and tunes 🗣️🎵
 */
describe('PostSidebar language lists', () => {
  it('shows text and audio languages', () => {
    const post: any = {
      id: '1',
      slug: 'demo',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
      content: 'hello',
      title: 'hi',
      excerpt: null,
      status: 'draft',
      origin_source: 'manual',
      published_at: null,
      selected_ai_provider: null,
      title_translations: { es: 'hola' },
      content_translations: { es: 'hola' },
      excerpt_translations: null,
      primary_audio_id: null
    }
    render(
      <PostSidebar
        post={post}
        audioAsset={null}
        audioJobs={[]}
        translationLoading={{}}
        audioGenerationLoading={false}
        onGenerateTranslation={() => {}}
        onGenerateAudio={() => {}}
        textLanguages={['en','es']}
        audioLanguages={['en']}
      />
    )
    expect(screen.getByText('📚 Text Languages')).toBeInTheDocument()
    expect(screen.getByText('en, es')).toBeInTheDocument()
    expect(screen.getByText('🎧 Audio Languages')).toBeInTheDocument()
    expect(screen.getByText('en')).toBeInTheDocument()
  })
})
