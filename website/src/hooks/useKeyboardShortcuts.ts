'use client'

import { useEffect, useCallback, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
  category?: string
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false)
  const { push } = useToast()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in inputs/textareas
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Exception: Allow Ctrl/Cmd+S to save even in input fields
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        const saveShortcut = shortcuts.find(s => s.key === 's' && (s.ctrlKey || s.metaKey))
        if (saveShortcut) {
          saveShortcut.action()
        }
      }
      return
    }

    for (const shortcut of shortcuts) {
      const {
        key,
        ctrlKey = false,
        metaKey = false,
        shiftKey = false,
        altKey = false,
        action
      } = shortcut

      const matchesKey = event.key.toLowerCase() === key.toLowerCase()
      const matchesCtrl = ctrlKey === event.ctrlKey
      const matchesMeta = metaKey === event.metaKey
      const matchesShift = shiftKey === event.shiftKey
      const matchesAlt = altKey === event.altKey

      if (matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt) {
        event.preventDefault()
        action()
        break
      }
    }
  }, [enabled, shortcuts])

  // Toggle help modal
  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev)
  }, [])

  // Add help shortcut automatically
  const allShortcuts = [
    ...shortcuts,
    {
      key: '?',
      shiftKey: true,
      action: toggleHelp,
      description: 'Show keyboard shortcuts',
      category: 'Help'
    }
  ]

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Format shortcut for display
  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const parts = []
    if (shortcut.ctrlKey) parts.push('Ctrl')
    if (shortcut.metaKey) parts.push('⌘')
    if (shortcut.altKey) parts.push('Alt')
    if (shortcut.shiftKey) parts.push('Shift')
    parts.push(shortcut.key.toUpperCase())
    return parts.join(' + ')
  }, [])

  // Group shortcuts by category
  const groupedShortcuts = allShortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  return {
    showHelp,
    setShowHelp,
    formatShortcut,
    groupedShortcuts,
    toggleHelp
  }
}