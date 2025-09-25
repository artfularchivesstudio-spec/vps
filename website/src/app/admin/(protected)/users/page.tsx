import { AdminUserManager } from '@/components/admin/AdminUserManager'

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <AdminUserManager />
    </div>
  )
}

export const metadata = {
  title: 'Admin User Management | Artful Archives',
  description: 'Manage admin users, roles, and permissions in the Artful Archives admin panel.',
}
