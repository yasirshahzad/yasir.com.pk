import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will securely refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Catch-all for PKCE codes that land on unintended pages (e.g. home)
  // This happens if Supabase ignores or rejects the redirectTo param
  const code = request.nextUrl.searchParams.get('code')
  if (code && request.nextUrl.pathname !== '/auth/callback') {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    // If it's a recovery flow, Supabase often includes a type or we can infer it
    // But for now, we just let /auth/callback handle the exchange
    return NextResponse.redirect(url)
  }

  // Guard all /admin routes.
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  
  let isAdmin = false
  if (user) {
    // Check if user is the hardcoded admin from env (fallback/initial setup)
    const isHardcodedAdmin = process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
    
    if (isHardcodedAdmin) {
      isAdmin = true
    } else {
      // Check database for role
      const { data: profile } = await supabase
        .from('reader_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      isAdmin = profile?.role === 'admin'
    }
  }

  if (isAdminRoute && !isAdmin) {
    const url = request.nextUrl.clone()
    // Bounce fully unauthenticated to login, bounce low-privilege users back to home
    url.pathname = user ? '/' : '/login'
    // Keep the intended destination if we're going to login
    if (!user) {
      url.searchParams.set('next', request.nextUrl.pathname)
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
