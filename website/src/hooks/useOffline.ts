'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

interface OfflineQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retries: number
}

interface UseOfflineReturn {
  isOnline: boolean
  queuedActions: OfflineQueueItem[]
  addToQueue: (type: 'create' | 'update' | 'delete', data: any) => void
  processQueue: () => Promise<void>
  clearQueue: () => void
  isProcessingQueue: boolean
}

const QUEUE_STORAGE_KEY = 'offline_queue'
const MAX_RETRIES = 3

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(true)
  const [queuedActions, setQueuedActions] = useState<OfflineQueueItem[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  
  const { push } = useToast()

  // Load queue from localStorage on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    try {
      const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (savedQueue) {
        setQueuedActions(JSON.parse(savedQueue))
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    // Only save on client side
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queuedActions))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }, [queuedActions])

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      if (online) {
        push({
          emoji: '🌐',
          title: 'Back online',
          description: 'Syncing your changes...',
          type: 'success',
          durationMs: 3000
        })
        // Automatically process queue when coming back online
        // Note: processQueue will be called separately when coming online
      } else {
        push({
          emoji: '📴',
          title: 'You\'re offline',
          description: 'Changes will sync when you\'re back online',
          type: 'warning',
          durationMs: 5000
        })
      }
    }

    // Set initial status
    setIsOnline(navigator.onLine)

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [push])

  // Add action to offline queue
  const addToQueue = useCallback((type: 'create' | 'update' | 'delete', data: any) => {
    const queueItem: OfflineQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    }

    setQueuedActions(prev => [...prev, queueItem])
    
    push({
      emoji: '💾',
      title: 'Saved offline',
      description: 'Will sync when you\'re back online',
      type: 'info',
      durationMs: 3000
    })
  }, [push])

  // Process queued actions
  const processQueue = useCallback(async () => {
    if (!isOnline || queuedActions.length === 0 || isProcessingQueue) {
      return
    }

    setIsProcessingQueue(true)
    
    try {
      const processedItems: string[] = []
      const failedItems: OfflineQueueItem[] = []

      for (const item of queuedActions) {
        try {
          // Process the queued action based on type
          switch (item.type) {
            case 'create':
              await processCreateAction(item.data)
              break
            case 'update':
              await processUpdateAction(item.data)
              break
            case 'delete':
              await processDeleteAction(item.data)
              break
          }
          
          processedItems.push(item.id)
        } catch (error) {
          console.error(`Failed to process queue item ${item.id}:`, error)
          
          if (item.retries < MAX_RETRIES) {
            failedItems.push({
              ...item,
              retries: item.retries + 1
            })
          } else {
            // Max retries reached, remove from queue
            push({
              emoji: '❌',
              title: 'Sync failed',
              description: `Failed to sync ${item.type} action after ${MAX_RETRIES} attempts`,
              type: 'error',
              durationMs: 5000
            })
          }
        }
      }

      // Update queue - remove processed items, keep failed items for retry
      setQueuedActions(prev => [
        ...prev.filter(item => !processedItems.includes(item.id)),
        ...failedItems
      ])

      if (processedItems.length > 0) {
        push({
          emoji: '✅',
          title: 'Synced successfully',
          description: `${processedItems.length} changes synced`,
          type: 'success',
          durationMs: 3000
        })
      }
    } catch (error) {
      console.error('Queue processing failed:', error)
      push({
        emoji: '⚠️',
        title: 'Sync error',
        description: 'Will try again later',
        type: 'warning',
        durationMs: 3000
      })
    } finally {
      setIsProcessingQueue(false)
    }
  }, [isOnline, queuedActions, isProcessingQueue, push])

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueuedActions([])
    // Only clear localStorage on client side
    if (typeof window !== 'undefined') {
      localStorage.removeItem(QUEUE_STORAGE_KEY)
    }
  }, [])

  return {
    isOnline,
    queuedActions,
    addToQueue,
    processQueue,
    clearQueue,
    isProcessingQueue
  }
}

// Helper functions to process different action types
async function processCreateAction(data: any) {
  // Implement your create API call here
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`Create failed: ${response.statusText}`)
  }
  
  return response.json()
}

async function processUpdateAction(data: any) {
  // Implement your update API call here
  const response = await fetch(`/api/posts/${data.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`Update failed: ${response.statusText}`)
  }
  
  return response.json()
}

async function processDeleteAction(data: any) {
  // Implement your delete API call here
  const response = await fetch(`/api/posts/${data.id}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.statusText}`)
  }
}