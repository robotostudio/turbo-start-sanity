import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRedirectData } from '@/lib/redirect';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    const redirects = await getRedirectData();
    const redirect = redirects.find(redirect => redirect.source === pathname)

    if (redirect) {
      return NextResponse.redirect(
        new URL(redirect.destination, request.url),
        redirect.permanent ? 301 : 302
      )
    }
  } catch (error) {
    console.error('[MIDDLEWARE] Failed to fetch redirects:', error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
