import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuth = !!token;
  const path = request.nextUrl.pathname;

  // 1. Redirect authenticated users away from auth pages
  const isAuthPage = path.startsWith("/login") || path.startsWith("/register");
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return null;
  }

  // 2. Dashboard is authenticated-only. Guests land on the interview setup flow
  // instead of bouncing through Login from a misleading "Back to Dashboard" path.
  if (path.startsWith("/dashboard")) {
    if (!isAuth) {
      return NextResponse.redirect(new URL("/interview/new", request.url));
    }
    return NextResponse.next();
  }

  // 3. Resume vault is authenticated-only because it reads saved user data.
  if (path.startsWith("/resumes")) {
    if (!isAuth) {
      let from = request.nextUrl.pathname;
      if (request.nextUrl.search) {
        from += request.nextUrl.search;
      }
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on these specific paths to optimize performance
  matcher: ["/dashboard/:path*", "/resumes/:path*", "/login", "/register"]
};
