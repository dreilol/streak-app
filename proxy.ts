import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const hasAuth = req.cookies.getAll().some(c => c.name.startsWith("sb-"));
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  // Only a convenience redirect. Real protection is Supabase RLS.
  // We do NOT redirect away from /login when a cookie exists, because an
  // expired cookie would otherwise trap the user in a redirect loop.
  if (!hasAuth && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|.*\\..*).*)"],
};
