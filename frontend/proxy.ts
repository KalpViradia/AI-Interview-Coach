import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Next.js middleware — runs server-side BEFORE any page renders.
 *
 * Route protection strategy:
 *   - PROTECTED (require auth): /dashboard, /transcript, /report
 *   - GUEST-ALLOWED: /, /login, /register, /upload, /interview, /analysis
 *   - AUTH-REDIRECT: /login and /register redirect to /dashboard if already logged in
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // A user is only fully authenticated if they have a token AND it contains the backend accessToken.
  // This automatically invalidates old/stale sessions from before the token structure was updated.
  const isAuthenticated = !!token && !!token.accessToken;

  // Routes that REQUIRE authentication — only dashboard (history/analytics)
  const protectedRoutes = ["/dashboard"];
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Routes that should redirect to dashboard if already authenticated
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // If trying to access a protected route without auth → redirect to login
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and trying to access login/register → redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

/**
 * Matcher: only run middleware on these routes.
 * Excludes API routes, static files, and Next.js internals.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
  ],
};
