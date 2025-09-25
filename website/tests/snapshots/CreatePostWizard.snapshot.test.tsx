import React from 'react'
import { render } from '@testing-library/react'

vi.mock('../../src/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getSession: async () => ({ data: { session: null } }) },
    storage: { from: () => ({ upload: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
    rpc: async () => ({}),
    from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'post_123' } }) }) }) }),
  }),
}))
vi.mock('../../src/lib/observability/logger', () => ({ logger: { logSuccess: vi.fn(), logUploadError: vi.fn() } }))

import CreatePostWizard from '../../src/components/admin/CreatePostWizard'
import { ToastProvider } from '../../src/components/ui/ToastProvider'

describe('CreatePostWizard snapshots', () => {
  it('renders title and HUD', () => {
    const { asFragment, container } = render(
      <ToastProvider>
        <CreatePostWizard />
      </ToastProvider>
    )
    const text = container.textContent || ''
    if (!text.includes('Create New Post')) throw new Error('Title missing')
    ;['🖼️ Upload','📝 Review','🎙️ Audio','✅ Finalize'].forEach(label => {
      if (!text.includes(label)) throw new Error(`HUD missing: ${label}`)
    })
    expect(asFragment()).toMatchSnapshot()
  })
})
