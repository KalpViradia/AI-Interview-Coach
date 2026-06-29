import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * API route to expose the raw JWT token to client-side code.
 * 
 * NextAuth stores the JWT in an HttpOnly cookie that client JS can't access.
 * This endpoint reads the cookie server-side and returns the raw JWT string
 * so the api-client.ts can attach it as a Bearer token to backend requests.
 *
 * Security: This is safe because:
 * 1. It only returns the JWT to the same browser that set the cookie (same-origin)
 * 2. The token is already visible to the server/client via NextAuth's session
 * 3. CSRF protection is handled by Next.js's same-origin policy
 */
export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.accessToken) {
    return NextResponse.json({ token: null }, { status: 200 });
  }

  return NextResponse.json({ token: token.accessToken });
}
