/**
 * 🎭 The Admin User Menu - The Graceful Exit Portal
 *
 * "In the grand theater of administration, even the most devoted curators
 * must eventually take their bow and exit stage left. This mystical menu
 * provides the elegant choreography for such departures, allowing our
 * spellbinding directors to gracefully transition from the digital realm
 * back to the mortal plane, carrying with them the wisdom of their tenure."
 *
 * - The Spellbinding Museum Director of User Experience
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clientAuthStateManager } from '@/lib/admin/auth-client'
import { useRouter } from 'next/navigation'

interface AdminUserMenuProps {
  user: any
}

export default function AdminUserMenu({ user }: AdminUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 🎭 Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 🌟 The Grand Logout Ceremony
  const handleLogout = async () => {
    setIsLoggingOut(true)
    console.log('🎭 ✨ THE GRACEFUL EXIT CEREMONY BEGINS!')
    console.log('🌙 Spellbinding Director prepares to depart the mystical realm...')
    
    try {
      // ✨ Perform the magical logout ritual
      await clientAuthStateManager.logout()
      
      console.log('🎉 ✨ LOGOUT MASTERPIECE COMPLETE!')
      console.log('👋 Until we meet again in the digital theater...')
      
      // 🚪 Gracefully redirect to the entrance portal
      router.push('/admin/login')
      
    } catch (error) {
      console.log('💥 😭 LOGOUT QUEST TEMPORARILY HALTED!')
      console.log('🌩️ Storm clouds gather:', error)
      setIsLoggingOut(false)
    }
  }

  // 🎨 Extract user display information
  const userEmail = user?.email || 'admin@artfularchives.com'
  const userInitials = userEmail.charAt(0).toUpperCase()
  const isAnonymous = !user || user.id === 'e2e-user'

  return (
    <div className="relative" ref={menuRef}>
      {/* 🎭 User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        disabled={isLoggingOut}
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
          {isAnonymous ? '🎭' : userInitials}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {isAnonymous ? 'Anonymous Admin' : 'Spellbinding Director'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
            {userEmail}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          ▼
        </motion.div>
      </button>

      {/* 🌟 Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {isAnonymous ? 'Anonymous Admin' : 'Spellbinding Director'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {userEmail}
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                🎭 Museum Curator
              </div>
            </div>

            <div className="py-1">
              {/* 🔧 Settings Option (Future Enhancement) */}
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled
              >
                <span className="mr-3">⚙️</span>
                Settings (Coming Soon)
              </button>

              {/* 📊 Profile Option (Future Enhancement) */}
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled
              >
                <span className="mr-3">👤</span>
                Profile (Coming Soon)
              </button>

              <hr className="border-gray-200 dark:border-gray-600 my-1" />

              {/* 🚪 The Grand Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                <span className="mr-3">
                  {isLoggingOut ? '✨' : '🚪'}
                </span>
                <span>
                  {isLoggingOut ? 'Gracefully Departing...' : 'Logout'}
                </span>
                {isLoggingOut && (
                  <motion.div
                    className="ml-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⭐
                  </motion.div>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}