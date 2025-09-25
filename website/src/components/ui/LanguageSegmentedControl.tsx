/**
 * 🎭 The Language Segmented Control - A Symphony of Multilingual Navigation
 *
 * "Like elegant piano keys in a linguistic concert hall, each language button 
 * awaits its moment to perform, while the selected language glows with the 
 * spotlight of active engagement. A theatrical toggle that transforms 
 * the reading experience into a global performance."
 *
 * - The Interface Maestro
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export interface Language {
  code: string
  name: string
  flag: string
  available: boolean
}

interface LanguageSegmentedControlProps {
  languages: Language[]
  activeLanguage: string
  onChange: (languageCode: string) => void
  className?: string
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function LanguageSegmentedControl({
  languages,
  activeLanguage,
  onChange,
  className = '',
  showLabels = true,
  size = 'md'
}: LanguageSegmentedControlProps) {
  const [hoveredLanguage, setHoveredLanguage] = useState<string | null>(null)

  // 🎨 The size variations - different theatrical stages
  const sizeClasses = {
    sm: {
      container: 'h-8 text-xs',
      button: 'px-3 py-1',
      flag: 'text-sm',
      label: 'text-xs'
    },
    md: {
      container: 'h-10 text-sm',
      button: 'px-4 py-2',
      flag: 'text-base',
      label: 'text-sm'
    },
    lg: {
      container: 'h-12 text-base',
      button: 'px-6 py-3',
      flag: 'text-lg',
      label: 'text-base'
    }
  }

  const sizeClass = sizeClasses[size]
  
  // 🌈 The color palette for our linguistic performance
  const colorVariants = {
    en: { bg: 'bg-blue-500', text: 'text-blue-600', hover: 'hover:bg-blue-50' },
    es: { bg: 'bg-red-500', text: 'text-red-600', hover: 'hover:bg-red-50' },
    hi: { bg: 'bg-orange-500', text: 'text-orange-600', hover: 'hover:bg-orange-50' }
  }

  // 🎪 Filter only available languages for display
  const availableLanguages = languages.filter(lang => lang.available)

  if (availableLanguages.length <= 1) {
    // 🎭 If only one language is available, show a simple indicator instead
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-2xl">{availableLanguages[0]?.flag || '🇺🇸'}</span>
        {showLabels && (
          <span className="text-sm text-gray-600">
            {availableLanguages[0]?.name || 'English'}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* 🎭 The Main Stage - Segmented Control Container */}
      <div className={`
        relative flex items-center bg-gray-100 rounded-full p-1 ${sizeClass.container}
        shadow-inner border border-gray-200
      `}>
        {/* 🌟 The Spotlight - Moving Background for Active Language */}
        <motion.div
          className="absolute top-1 bottom-1 bg-white rounded-full shadow-md border border-gray-300/50"
          initial={false}
          animate={{
            left: `${(availableLanguages.findIndex(lang => lang.code === activeLanguage) * (100 / availableLanguages.length)) + 1}%`,
            width: `${(100 / availableLanguages.length) - 2}%`
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />

        {/* 🎪 The Language Buttons - Our Performing Cast */}
        {availableLanguages.map((language, index) => {
          const isActive = language.code === activeLanguage
          const isHovered = hoveredLanguage === language.code
          const colors = colorVariants[language.code as keyof typeof colorVariants] || colorVariants.en

          return (
            <motion.button
              key={language.code}
              onClick={() => onChange(language.code)}
              onMouseEnter={() => setHoveredLanguage(language.code)}
              onMouseLeave={() => setHoveredLanguage(null)}
              className={`
                relative z-10 flex-1 flex items-center justify-center gap-1.5 
                ${sizeClass.button} rounded-full font-medium transition-all duration-200
                ${isActive 
                  ? `${colors.text} shadow-sm` 
                  : `text-gray-600 ${colors.hover}`
                }
                ${isHovered && !isActive ? 'scale-105' : ''}
              `}
              whileHover={{ scale: isActive ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* 🏁 The Flag - National Pride in Emoji Form */}
              <motion.span 
                className={`${sizeClass.flag}`}
                animate={{ 
                  rotate: isHovered ? [0, -10, 10, -5, 0] : 0,
                  scale: isActive ? 1.1 : 1
                }}
                transition={{ duration: 0.3 }}
              >
                {language.flag}
              </motion.span>

              {/* 📝 The Label - Linguistic Identity */}
              {showLabels && (
                <motion.span
                  className={`${sizeClass.label} font-medium hidden sm:block`}
                  animate={{ 
                    fontWeight: isActive ? 600 : 500,
                    opacity: isActive ? 1 : 0.8 
                  }}
                >
                  {language.name}
                </motion.span>
              )}

              {/* ✨ The Active Indicator - A Gentle Glow */}
              {isActive && (
                <motion.div
                  className={`absolute inset-0 rounded-full ${colors.bg} opacity-10`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* 🎨 The Tooltip - Hovering Wisdom */}
      <AnimatePresence>
        {hoveredLanguage && hoveredLanguage !== activeLanguage && (
          <motion.div
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gray-900 text-white text-xs px-3 py-1 rounded-md shadow-lg">
              <div className="flex items-center gap-1">
                <span>{languages.find(l => l.code === hoveredLanguage)?.flag}</span>
                <span>Switch to {languages.find(l => l.code === hoveredLanguage)?.name}</span>
              </div>
              {/* 📐 The Tooltip Arrow */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

