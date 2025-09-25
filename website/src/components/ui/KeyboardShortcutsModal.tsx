'use client'
import React from 'react';

import { motion, AnimatePresence } from 'framer-motion'

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

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
  groupedShortcuts: Record<string, KeyboardShortcut[]>
  formatShortcut: (shortcut: KeyboardShortcut) => string
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
  groupedShortcuts,
  formatShortcut
}: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">⌨️ Keyboard Shortcuts</h2>
                  <p className="text-purple-100 mt-1">Speed up your workflow with these shortcuts</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-purple-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {shortcuts.map((shortcut, index) => (
                        <div
                          key={`${category}-${index}`}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-gray-700">{shortcut.description}</span>
                          <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-md text-sm font-mono text-gray-800 shadow-sm">
                            {formatShortcut(shortcut)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pro Tips */}
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Pro Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Shortcuts work everywhere except when typing in text fields</li>
                  <li>• Use <kbd className="px-1 bg-blue-100 rounded text-xs">Ctrl+S</kbd> or <kbd className="px-1 bg-blue-100 rounded text-xs">⌘+S</kbd> to save even while typing</li>
                  <li>• Press <kbd className="px-1 bg-blue-100 rounded text-xs">?</kbd> anytime to see this help</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}