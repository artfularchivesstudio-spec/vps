'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationItems = [
  // {
  //   name: 'Dashboard',
  //   href: '/admin',
  //   icon: '📊',
  //   description: 'Overview and statistics'
  // },
  {
    name: 'Posts',
    href: '/admin/posts',
    icon: '📝',
    description: 'Manage blog posts'
  },
  // {
  //   name: 'Workflow',
  //   href: '/admin/workflow',
  //   icon: '🔄',
  //   description: 'Publishing pipeline',
  //   highlight: true
  // },
  {
    name: 'Multilingual',
    href: '/admin/multilingual',
    icon: '🌐',
    description: 'Translation management'
  },
  {
    name: 'Dev Tools',
    href: '/admin/tools',
    icon: '🛠️',
    description: 'Development and debugging tools'
  },
  {
    name: 'Database Explorer',
    href: '/admin/database-explorer',
    icon: '🗄️',
    description: 'PostgreSQL database browser',
    highlight: true
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: '👥',
    description: 'Admin user management',
    highlight: true
  }
  // {
  //   name: 'Media',
  //   href: '/admin/media',
  //   icon: '🖼️',
  //   description: 'Media library'
  // },
  // {
  //   name: 'Playground',
  //   href: '/admin/playground',
  //   icon: '🧪',
  //   description: 'AI integration testing'
  // },
  // {
  //   name: 'Content Analysis',
  //   href: '/admin/content-analysis',
  //   icon: '🔍',
  //   description: 'Analyze and cleanup content'
  // }
]

export default function AdminNavigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex items-center space-x-1">
      {navigationItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive(item.href)
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{item.icon}</span>
            <span>{item.name}</span>
          </div>
          
          {/* Active indicator */}
          {isActive(item.href) && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600 rounded-full"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          
        </Link>
      ))}
      
      {/* Create Post CTA */}
      <div className="ml-4 pl-4 border-l border-gray-200">
        <Link
          href="/admin/posts/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Create Post</span>
        </Link>
      </div>
    </nav>
  )
}