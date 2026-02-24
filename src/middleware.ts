import { NextResponse } from "next/server";

/**
 * Minimal middleware — no auth checks needed.
 *
 * Auth.js v5 with database sessions handles cookies via its own route
 * handlers at /api/auth/*. Using NextAuth() in Edge middleware without
 * the database adapter can invalidate session cookies, so we avoid it.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
