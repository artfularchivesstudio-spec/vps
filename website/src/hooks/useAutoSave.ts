'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'

interface AutoSaveData {
  title?: string
  content?: string
  excerpt?: string
  slug?: string
  imageUrl?: string
  analysisPrompt?: string
  [key: string]: any
}

interface UseAutoSaveOptions {
  interval?: number // Auto-save interval in milliseconds (default: 30 seconds)
  key: string // Unique key for this auto-save instance
  enabled?: boolean
}

interface UseAutoSaveReturn {
  save: (data: AutoSaveData) => void
  lastSaved: Date | null
  isSaving: boolean
  hasUnsavedChanges: boolean
  savedData: AutoSaveData | null
  clearAutoSave: () => Promise<void>
}

export function useAutoSave({ 
  interval = 30000, 
  key, 
  enabled = true 
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [savedData, setSavedData] = useState<AutoSaveData | null>(null)
  
  const dataRef = useRef<AutoSaveData>({})
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveRef = useRef<string>('')
  
  const { push } = useToast()
  const supabase = createClient()

  // Save function
  const save = useCallback(async (data: AutoSaveData) => {
    if (!enabled) return
    
    const currentDataString = JSON.stringify(data)
    
    // Skip if data hasn't changed
    if (currentDataString === lastSaveRef.current) {
      return
    }
    
    try {
      setIsSaving(true)
      
      // Save to localStorage as backup (only on client side)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`autosave_${key}`, currentDataString)
        localStorage.setItem(`autosave_${key}_timestamp`, Date.now().toString())
      }
      
      // Save to Supabase if we have enough data for a draft
      if (data.title || data.content) {
        const { data: existingDraft, error: fetchError } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('auto_save_key', key)
          .maybeSingle()

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError
        }

        const draftData = {
          title: data.title || 'Auto-saved Draft',
          content: data.content || '',
          excerpt: data.excerpt || '',
          slug: data.slug || `draft-${Date.now()}`,
          featured_image_url: data.imageUrl || null,
          auto_save_key: key,
          is_auto_saved: true,
          status: 'draft'
        }

        if (existingDraft) {
          // Update existing draft
          const { error } = await supabase
            .from('blog_posts')
            .update({
              ...draftData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDraft.id)

          if (error) throw error
        } else {
          // Create new draft
          const { error } = await supabase
            .from('blog_posts')
            .insert([draftData])

          if (error) throw error
        }
      }
      
      lastSaveRef.current = currentDataString
      setSavedData(data)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      
      // Subtle toast notification
      push({ 
        emoji: '💾', 
        title: 'Auto-saved', 
        description: 'Your progress has been saved',
        type: 'info',
        durationMs: 2000
      })
    } catch (error) {
      console.error('Auto-save failed:', error)
      push({ 
        emoji: '⚠️', 
        title: 'Auto-save failed', 
        description: 'We\'ll keep trying in the background',
        type: 'warning',
        durationMs: 3000
      })
    } finally {
      setIsSaving(false)
    }
  }, [enabled, key, supabase, push])

  // Schedule auto-save
  const scheduleAutoSave = useCallback((data: AutoSaveData) => {
    if (!enabled) return
    
    dataRef.current = data
    setHasUnsavedChanges(true)
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      save(dataRef.current)
    }, interval)
  }, [enabled, interval, save])

  // Load saved data on mount
  useEffect(() => {
    if (!enabled) return
    
    const loadSavedData = async () => {
      try {
        // Try localStorage first (only on client side)
        if (typeof window !== 'undefined') {
          const localData = localStorage.getItem(`autosave_${key}`)
          const localTimestamp = localStorage.getItem(`autosave_${key}_timestamp`)
          
          if (localData && localTimestamp) {
            const data = JSON.parse(localData)
            const timestamp = new Date(parseInt(localTimestamp))
            
            setSavedData(data)
            setLastSaved(timestamp)
            lastSaveRef.current = localData
          }
        }
        
        // Also check Supabase for auto-saved drafts
        const { data: draft } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('auto_save_key', key)
          .eq('is_auto_saved', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (draft) {
          const draftData = {
            title: draft.title,
            content: draft.content,
            excerpt: draft.excerpt,
            slug: draft.slug,
            imageUrl: draft.featured_image_url
          }
          
          const draftTimestamp = new Date(draft.updated_at)
          
          // Use the most recent save (local vs remote)
          if (typeof window === 'undefined' || !localStorage.getItem(`autosave_${key}_timestamp`) || draftTimestamp > new Date(parseInt(localStorage.getItem(`autosave_${key}_timestamp`) || '0'))) {
            setSavedData(draftData)
            setLastSaved(draftTimestamp)
            lastSaveRef.current = JSON.stringify(draftData)
          }
        }
      } catch (error) {
        console.error('Failed to load auto-saved data:', error)
      }
    }
    
    loadSavedData()
  }, [enabled, key, supabase])

  // Clear auto-save data
  const clearAutoSave = useCallback(async () => {
    try {
      // Clear localStorage (only on client side)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`autosave_${key}`)
        localStorage.removeItem(`autosave_${key}_timestamp`)
      }
      
      // Clear Supabase auto-saves
      await supabase
        .from('blog_posts')
        .delete()
        .eq('auto_save_key', key)
        .eq('is_auto_saved', true)
      
      setSavedData(null)
      setLastSaved(null)
      setHasUnsavedChanges(false)
      lastSaveRef.current = ''
    } catch (error) {
      console.error('Failed to clear auto-save data:', error)
    }
  }, [key, supabase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Handle visibility change (save before tab switch/close)
  useEffect(() => {
    if (!enabled) return
    
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        save(dataRef.current)
      }
    }
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        save(dataRef.current)
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, hasUnsavedChanges, save])

  return {
    save: scheduleAutoSave,
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    savedData,
    clearAutoSave
  }
}