'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react'
import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

interface Toast {
  id: string
  emoji: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  durationMs?: number
}

interface ToastContextType {
  push: (toast: Omit<Toast, 'id'>) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      durationMs: toast.durationMs || 5000,
    }
    
    setToasts(prev => [...prev, newToast])

    // Auto-dismiss after duration
    setTimeout(() => {
      dismiss(id)
    }, newToast.durationMs)
  }, [dismiss])

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-start p-4 rounded-lg border shadow-lg transition-all duration-300',
              getBgColor(toast.type),
              'animate-in slide-in-from-right-5 fade-in-0'
            )}
          >
            <div className="flex-shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <span className="text-lg mr-2">{toast.emoji}</span>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {toast.title}
                </h3>
              </div>
              {toast.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-4 flex-shrink-0 rounded-md p-1 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
