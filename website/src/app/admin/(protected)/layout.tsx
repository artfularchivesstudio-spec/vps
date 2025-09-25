import { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import AdminNavigation from '@/components/admin/AdminNavigation'
import AdminUserMenu from '@/components/admin/AdminUserMenu'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { DarkModeToggle } from '@/components/ui/DarkModeToggle'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient()
  // E2E bypass for tests: set header x-e2e-bypass to a known token (non-production only unless E2E_BYPASS_TOKEN is set)
  const h = headers()
  const bypassHeader = h.get('x-e2e-bypass')
  const allowedBypass = process.env.E2E_BYPASS_TOKEN || (process.env.NODE_ENV !== 'production' ? 'test-bypass' : undefined)
  
  const {
    data: { user },
  } = allowedBypass && bypassHeader === allowedBypass
    ? { data: { user: { id: 'e2e-user' } as any } }
    : await supabase.auth.getUser()

  // Only redirect if user is not authenticated
  // The login page has its own layout to avoid this check
  if (!user) {
    redirect('/admin/login')
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Admin Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Artful Archives Admin
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <AdminNavigation />
                <DarkModeToggle />
                <AdminUserMenu user={user} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}