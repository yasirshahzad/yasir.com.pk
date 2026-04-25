'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  let next = (formData.get('next') as string) || '/admin'

  // Security: Prevent open redirects
  if (next.startsWith('http') || next.startsWith('//')) {
    next = '/admin'
  }

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  // Note: if confirm email is off, they will essentially be logged in or at least registered
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) return { error: 'Email is required' }

  const supabase = await createClient()
  const headerList = await headers()
  const origin = headerList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  if (!password) return { error: 'Password is required' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) return { error: error.message }
  return { success: true }
}
