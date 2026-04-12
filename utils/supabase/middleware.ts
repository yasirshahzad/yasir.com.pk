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

  // Guard all /admin routes. Only process.env.ADMIN_EMAIL gets access.
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAdmin = user && user.email === process.env.ADMIN_EMAIL

  if (isAdminRoute && !isAdmin) {
    const url = request.nextUrl.clone()
    // Bounce fully unauthenticated to login, bounce low-privilege users back to home
    url.pathname = user ? '/' : '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
