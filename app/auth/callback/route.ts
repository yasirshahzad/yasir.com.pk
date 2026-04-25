import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  // if "next" is in search params, use it as the redirection URL
  // Default to /reset-password if type is recovery
  let next = searchParams.get('next') ?? (type === 'recovery' ? '/reset-password' : '/admin')
  
  // Security: Prevent open redirects by ensuring 'next' is a relative path
  if (next.startsWith('http') || next.startsWith('//')) {
    next = '/admin'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Use URL constructor with origin to ensure we stay on the same site
      const redirectUrl = new URL(next, origin)
      return NextResponse.redirect(redirectUrl.toString())
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
