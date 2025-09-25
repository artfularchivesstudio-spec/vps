#!/usr/bin/env node

/**
 * 🎭 Admin User Creation Utility
 *
 * Creates admin users for the Artful Archives system with proper role management.
 * This script provides a convenient way to set up admin accounts for development and production.
 *
 * Usage:
 *   node scripts/create-admin-user.js [email] [role]
 *
 * Examples:
 *   node scripts/create-admin-user.js admin@artfularchives.com super_admin
 *   node scripts/create-admin-user.js dev@artfularchives.com admin
 */

require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')
const crypto = require('crypto')

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('Please ensure these are set in your .env file')
  process.exit(1)
}

// Initialize Supabase with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

/**
 * Generate a secure random password
 */
function generateSecurePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return password
}

/**
 * Create admin user with authentication
 */
async function createAdminUser(email, role = 'admin', firstName = '', lastName = '') {
  try {
    console.log('🎭 Creating admin user...')
    console.log(`   Email: ${email}`)
    console.log(`   Role: ${role}`)
    console.log(`   Name: ${firstName} ${lastName}`.trim())
    console.log('')

    // Generate a secure password
    const password = generateSecurePassword()
    console.log('🔐 Generated secure password for new admin user')
    console.log('')

    // Create the user in Supabase Auth
    console.log('📝 Creating user account...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin accounts
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role
      }
    })

    if (authError) {
      console.error('❌ Failed to create user account:', authError.message)
      return null
    }

    console.log('✅ User account created successfully')
    console.log(`   User ID: ${authData.user.id}`)
    console.log('')

    // Create admin profile directly with service role
    console.log('🏗️ Creating admin profile...')

    // First, check if profile already exists and handle it
    const { data: existingProfile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    let profileData
    let profileError

    if (existingProfile) {
      // Update existing profile
      console.log('📝 Updating existing admin profile...')
      const result = await supabase
        .from('admin_profiles')
        .update({
          email,
          role,
          first_name: firstName || 'Admin',
          last_name: lastName || 'User'
        })
        .eq('id', authData.user.id)
        .select()
        .single()

      profileData = result.data
      profileError = result.error
    } else {
      // Create new profile
      const result = await supabase
        .from('admin_profiles')
        .insert({
          id: authData.user.id,
          email,
          role,
          first_name: firstName || 'Admin',
          last_name: lastName || 'User'
        })
        .select()
        .single()

      profileData = result.data
      profileError = result.error
    }

    if (profileError) {
      console.error('❌ Failed to create/update admin profile:', profileError.message)

      // Check if it's a duplicate key error
      if (profileError.message.includes('duplicate key') || profileError.message.includes('already exists')) {
        console.error('   An admin profile with this email already exists.')
        console.error('   Try using a different email address.')
      }

      // Clean up the auth user if profile creation failed
      console.log('🧹 Cleaning up auth user...')
      await supabase.auth.admin.deleteUser(authData.user.id)
      return null
    }

    console.log('✅ Admin profile created successfully')
    console.log('')

    return {
      user: authData.user,
      profile: profileData,
      password
    }

  } catch (error) {
    console.error('💥 Unexpected error during user creation:', error.message)
    return null
  }
}

/**
 * List existing admin users
 */
async function listAdminUsers() {
  try {
    console.log('📋 Fetching admin users...')
    console.log('')

    const { data: users, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Failed to fetch admin users:', error.message)
      return
    }

    if (!users || users.length === 0) {
      console.log('📭 No admin users found')
      return
    }

    console.log('🎭 Current Admin Users:')
    console.log('─'.repeat(80))

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Name: ${user.first_name || 'N/A'} ${user.last_name || ''}`.trim())
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`)
      console.log(`   ID: ${user.id}`)
      console.log('')
    })

  } catch (error) {
    console.error('💥 Error fetching admin users:', error.message)
  }
}

/**
 * Update admin user role
 */
async function updateUserRole(email, newRole) {
  try {
    console.log(`🎭 Updating user role for: ${email}`)
    console.log(`   New Role: ${newRole}`)
    console.log('')

    const { data: user, error: fetchError } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (fetchError || !user) {
      console.error('❌ User not found:', email)
      return false
    }

    const { error: updateError } = await supabase
      .from('admin_profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('email', email)

    if (updateError) {
      console.error('❌ Failed to update user role:', updateError.message)
      return false
    }

    console.log('✅ User role updated successfully')
    console.log(`   ${email} is now a ${newRole}`)
    return true

  } catch (error) {
    console.error('💥 Error updating user role:', error.message)
    return false
  }
}

/**
 * Delete admin user
 */
async function deleteAdminUser(email) {
  try {
    console.log(`🗑️ Deleting admin user: ${email}`)
    console.log('⚠️  This action cannot be undone!')
    console.log('')

    // Get user details first
    const { data: user, error: fetchError } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (fetchError || !user) {
      console.error('❌ User not found:', email)
      return false
    }

    // Delete from admin_profiles first
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .delete()
      .eq('email', email)

    if (profileError) {
      console.error('❌ Failed to delete admin profile:', profileError.message)
      return false
    }

    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(user.user_id)

    if (authError) {
      console.error('❌ Failed to delete user account:', authError.message)
      return false
    }

    console.log('✅ Admin user deleted successfully')
    console.log(`   Removed: ${email}`)
    return true

  } catch (error) {
    console.error('💥 Error deleting admin user:', error.message)
    return false
  }
}

/**
 * Main menu system
 */
async function showMenu() {
  console.log('')
  console.log('🎭 Artful Archives Admin User Management')
  console.log('═'.repeat(50))
  console.log('1. Create new admin user')
  console.log('2. List all admin users')
  console.log('3. Update user role')
  console.log('4. Delete admin user')
  console.log('5. Create service user')
  console.log('0. Exit')
  console.log('')

  return new Promise((resolve) => {
    rl.question('Choose an option (0-5): ', (choice) => {
      resolve(choice.trim())
    })
  })
}

/**
 * Create service user (non-interactive admin account)
 */
async function createServiceUser() {
  const email = 'service@artfularchives.com'
  const role = 'super_admin'

  console.log('🔧 Creating service user for automated operations...')
  console.log(`   Email: ${email}`)
  console.log(`   Role: ${role}`)
  console.log('')

  const result = await createAdminUser(email, role, 'Service', 'Account')

  if (result) {
    console.log('✅ Service user created successfully!')
    console.log('')
    console.log('🔑 Service User Credentials:')
    console.log('─'.repeat(30))
    console.log(`Email: ${result.user.email}`)
    console.log(`Password: ${result.password}`)
    console.log(`Role: ${result.profile.role}`)
    console.log('')
    console.log('⚠️  IMPORTANT: Save these credentials securely!')
    console.log('   This user has super_admin privileges for automated operations.')
    console.log('   Consider using API keys instead of this account for production.')
  }
}

/**
 * Interactive user creation
 */
async function interactiveCreateUser() {
  return new Promise((resolve) => {
    console.log('')
    console.log('👤 Create New Admin User')
    console.log('─'.repeat(25))

    rl.question('Email address: ', (email) => {
      rl.question('Role (admin/super_admin) [admin]: ', (role) => {
        const userRole = role.trim() || 'admin'

        rl.question('First name (optional): ', (firstName) => {
          rl.question('Last name (optional): ', async (lastName) => {
            const result = await createAdminUser(
              email.trim(),
              userRole,
              firstName.trim(),
              lastName.trim()
            )

            if (result) {
              console.log('')
              console.log('🎉 Admin user created successfully!')
              console.log('')
              console.log('🔑 Login Credentials:')
              console.log('─'.repeat(20))
              console.log(`Email: ${result.user.email}`)
              console.log(`Password: ${result.password}`)
              console.log(`Role: ${result.profile.role}`)
              console.log('')
              console.log('💡 Share these credentials securely with the new admin user.')
              console.log('   They should change their password after first login.')
            }

            resolve()
          })
        })
      })
    })
  })
}

/**
 * Interactive role update
 */
async function interactiveUpdateRole() {
  return new Promise((resolve) => {
    console.log('')
    console.log('🎭 Update User Role')
    console.log('─'.repeat(20))

    rl.question('User email: ', (email) => {
      rl.question('New role (admin/super_admin): ', async (role) => {
        const success = await updateUserRole(email.trim(), role.trim())
        resolve()
      })
    })
  })
}

/**
 * Interactive user deletion
 */
async function interactiveDeleteUser() {
  return new Promise((resolve) => {
    console.log('')
    console.log('🗑️ Delete Admin User')
    console.log('─'.repeat(20))
    console.log('⚠️  This action cannot be undone!')

    rl.question('User email to delete: ', (email) => {
      rl.question(`Are you sure you want to delete ${email}? (yes/no): `, async (confirm) => {
        if (confirm.toLowerCase() === 'yes') {
          await deleteAdminUser(email.trim())
        } else {
          console.log('❌ Deletion cancelled')
        }
        resolve()
      })
    })
  })
}

/**
 * Main execution
 */
async function main() {
  // Check command line arguments for quick creation
  const args = process.argv.slice(2)

  if (args.length >= 1) {
    // Quick create mode
    const email = args[0]
    const role = args[1] || 'admin'
    const firstName = args[2] || ''
    const lastName = args[3] || ''

    console.log('🚀 Quick admin user creation mode')
    const result = await createAdminUser(email, role, firstName, lastName)

    if (result) {
      console.log('')
      console.log('✅ Admin user created successfully!')
      console.log(`Email: ${result.user.email}`)
      console.log(`Password: ${result.password}`)
      console.log(`Role: ${result.profile.role}`)
    }

    rl.close()
    return
  }

  // Interactive mode
  console.log('🎭 Welcome to Artful Archives Admin User Management!')
  console.log('')

  let exit = false
  while (!exit) {
    const choice = await showMenu()

    switch (choice) {
      case '1':
        await interactiveCreateUser()
        break
      case '2':
        await listAdminUsers()
        break
      case '3':
        await interactiveUpdateRole()
        break
      case '4':
        await interactiveDeleteUser()
        break
      case '5':
        await createServiceUser()
        break
      case '0':
        console.log('👋 Goodbye!')
        exit = true
        break
      default:
        console.log('❌ Invalid option. Please try again.')
    }

    if (!exit) {
      console.log('')
      rl.question('Press Enter to continue...', () => {})
    }
  }

  rl.close()
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Script execution failed:', error.message)
    process.exit(1)
  })
}

module.exports = {
  createAdminUser,
  listAdminUsers,
  updateUserRole,
  deleteAdminUser
}
