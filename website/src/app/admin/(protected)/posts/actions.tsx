'use client'

import { useState } from 'react'
import { BlogPost } from '@/types/blog'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'

interface BulkActionsProps {
  selectedPosts: string[]
  onSelectionChange: (selectedPosts: string[]) => void
  onBulkActionComplete: () => void
}

export function BulkActions({ selectedPosts, onSelectionChange, onBulkActionComplete }: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { push } = useToast()

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedPosts }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete posts')
      }

      push({
        title: 'Success',
        description: `Deleted ${selectedPosts.length} post${selectedPosts.length > 1 ? 's' : ''}`,
        type: 'success',
        emoji: '✅'
      })

      onSelectionChange([])
      onBulkActionComplete()
    } catch (error) {
      push({
        title: 'Error',
        description: 'Failed to delete posts',
        type: 'error',
        emoji: '❌'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">{selectedPosts.length} selected</span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleBulkDelete}
        disabled={isLoading || selectedPosts.length === 0}
      >
        Delete Selected
      </Button>
    </div>
  )
}