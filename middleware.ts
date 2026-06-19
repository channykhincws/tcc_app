import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow Next.js internals + static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('auth-token')?.value

  if (!token) {
    // API routes return 401, pages redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const user = verifyToken(token)

    // Inject user info into headers for API routes
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', user.role)
    requestHeaders.set('x-user-name', user.name)
    if (user.teacherId) requestHeaders.set('x-teacher-id', user.teacherId)

    // Teacher can only access attendance
    if (user.role === 'TEACHER') {
      const allowedPaths = ['/attendance', '/dashboard', '/api/attendance', '/api/classes', '/api/students']
      const isAllowed = allowedPaths.some(p => pathname.startsWith(p))
      if (!isAllowed) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/attendance', req.url))
      }
    }

    // Accountant paths
    if (user.role === 'ACCOUNTANT') {
      const allowedPaths = ['/payments', '/dashboard', '/reports', '/api/payments', '/api/invoices', '/api/reports', '/api/students', '/api/enrollments']
      const isAllowed = allowedPaths.some(p => pathname.startsWith(p))
      if (!isAllowed && !pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/payments', req.url))
      }
    }

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    // Token invalid - clear it
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.set('auth-token', '', { expires: new Date(0), path: '/' })
    return res
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
