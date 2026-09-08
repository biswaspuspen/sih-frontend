import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(request: NextRequest) {
  const role = request.cookies.get('userRole')?.value || 'government'
  const path = request.nextUrl.pathname

  if (path === '/login') return NextResponse.next()

  if (role === 'citizen') {
    const allowedCitizenRoutes = ['/my-submissions', '/submit', '/support']
    if (!allowedCitizenRoutes.includes(path)) {
      return NextResponse.redirect(new URL('/my-submissions', request.url))
    }
  }

  if (role === 'university') {
    const allowedUniRoutes = ['/challenges', '/support']
    if (!allowedUniRoutes.includes(path)) {
      return NextResponse.redirect(new URL('/challenges', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}