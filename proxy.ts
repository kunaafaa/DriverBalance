import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Never intercept NextAuth's own API routes — would cause infinite loops
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  let token = null
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  } catch {
    // Malformed or unreadable token → treat as unauthenticated
  }

  const isAuthenticated = !!token
  const isLoginPage = pathname === "/login"

  if (!isAuthenticated && !isLoginPage) {
    // Preserve the original URL so login can redirect back after successful auth
    const loginUrl = new URL("/login", req.url)
    const originalPath = pathname + (req.nextUrl.search || "")
    loginUrl.searchParams.set("redirect", originalPath)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && isLoginPage) {
    const redirectParam = req.nextUrl.searchParams.get("redirect") || "/"
    // Reject absolute or protocol-relative URLs to prevent open redirects
    const safeRedirect =
      redirectParam.startsWith("/") && !redirectParam.startsWith("//")
        ? redirectParam
        : "/"
    return NextResponse.redirect(new URL(safeRedirect, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
