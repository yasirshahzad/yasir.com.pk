import { createClient } from '@/utils/supabase/server'

/**
 * Validates if the current user is the site administrator.
 * Returns the user object if successful, or throws an error if unauthorized.
 */
export async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmail = process.env.ADMIN_EMAIL
  
  if (!user || !adminEmail || user.email !== adminEmail) {
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
