import { createClient } from '@/utils/supabase/server'

/**
 * Validates if the current user is the site administrator.
 * Returns the user object if successful, or throws an error if unauthorized.
 */
export async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized: Authentication required.')
  }

  const adminEmail = process.env.ADMIN_EMAIL

  // If it's the hardcoded admin, they always have access
  if (adminEmail && user.email === adminEmail) {
    return user
  }

  // Otherwise check the database role
  const { data: profile } = await supabase
    .from('reader_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.')
  }

  return user
}

/**
 * Non-throwing version for use in conditional UI rendering or safe checks.
 */
export async function isAdmin() {
  try {
    await assertAdmin()
    return true
  } catch {
    return false
  }
}
