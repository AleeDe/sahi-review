// Next.js 16: middleware → proxy
//
// This is a fast cookie-presence gate. The real auth check (and token
// validation) happens in layouts/pages via getCurrentUser(), which calls
// supabase.auth.getUser() with React cache() so it runs at most once per
// request. Calling getUser() here too added ~300–2000ms per navigation
// because it round-trips to Supabase Auth — we skip it on purpose.
import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseSession(request: NextRequest): boolean {
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) {
      return true;
    }
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasSupabaseSession(request);

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding");

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  // Only run on routes that actually need session checks.
  // Public pages (/, /r/[slug], /api/feedback) skip the round-trip to Supabase Auth.
  matcher: ["/dashboard/:path*", "/admin/:path*", "/onboarding", "/login", "/signup"],
};
