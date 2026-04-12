import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization')
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    // The browser encodes credentials as Base64 format: user:pwd
    const [user, pwd] = atob(authValue).split(':')
    
    const adminUser = process.env.ADMIN_USER || 'admin'
    const adminPwd = process.env.ADMIN_PASSWORD || 'password'

    if (user === adminUser && pwd === adminPwd) {
      const response = NextResponse.next()
      // Set a cookie so the frontend knows the user is an admin without abandoning SSG
      response.cookies.set('adminSession', '1', { path: '/', maxAge: 60 * 60 * 24 * 7 })
      return response
    }
  }

  // Request authentication if credentials are missing or incorrect
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Secure Area"',
    },
  })
}

// Ensure the middleware only runs for the /admin routes
export const config = {
  matcher: ['/admin/:path*'],
}
