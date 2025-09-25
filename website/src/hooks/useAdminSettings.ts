'use client'

import { useState, useEffect } from 'react'

interface AdminSettings {
  useWizardMode: boolean
  showAdvancedOptions: boolean
  defaultLanguages: string[]
  autoSave: boolean
}

const DEFAULT_SETTINGS: AdminSettings = {
  useWizardMode: true,
  showAdvancedOptions: false,
  defaultLanguages: ['en'],
  autoSave: true
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      const savedSettings = localStorage.getItem('admin-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch (error) {
      console.error('Failed to load admin settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save settings to localStorage when they change
  const updateSettings = (newSettings: Partial<AdminSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    
    // Only save to localStorage on client side
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('admin-settings', JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save admin settings:', error)
      }
    }
  }

  const toggleWizardMode = () => {
    updateSettings({ useWizardMode: !settings.useWizardMode })
  }

  const toggleAdvancedOptions = () => {
    updateSettings({ showAdvancedOptions: !settings.showAdvancedOptions })
  }

  const toggleAutoSave = () => {
    updateSettings({ autoSave: !settings.autoSave })
  }

  return {
    settings,
    isLoading,
    updateSettings,
    toggleWizardMode,
    toggleAdvancedOptions,
    toggleAutoSave
  }
}