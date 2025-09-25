import React from 'react'
import { render } from '@testing-library/react'
import { ToastProvider, useToast } from '../../src/components/ui/ToastProvider'

function Demo() {
  const { push } = useToast()
  React.useEffect(() => {
    push({ emoji: '✅', title: 'Saved', description: 'Post saved successfully', type: 'success', durationMs: 0 })
  }, [push])
  return null
}

describe('ToastProvider snapshots', () => {
  it('renders a toast', () => {
    const { asFragment, container } = render(
      <ToastProvider>
        <Demo />
      </ToastProvider>
    )
    // Basic assertion without jest-dom
    if (!container.textContent?.includes('Saved')) {
      throw new Error('Toast not rendered')
    }
    expect(asFragment()).toMatchSnapshot()
  })
})
