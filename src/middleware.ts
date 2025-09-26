// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseClient(request);

  // Always check partner session cookie
  const partnerSession = request.cookies.get("partner-session");
  let partnerUser = null;

  if (partnerSession) {
    try {
      partnerUser = JSON.parse(partnerSession.value);
    } catch (error) {
      // Invalid partner session cookie → clear it
      const responseWithClearedCookie = NextResponse.next({
        request: { headers: request.headers },
      });
      responseWithClearedCookie.cookies.delete("partner-session");
      return responseWithClearedCookie;
    }
  }

  const isAuthenticated = !!partnerUser;
  const currentPath = request.nextUrl.pathname;

  // Redirect unauthenticated users to login (except if already on login page)
  if (!isAuthenticated && currentPath !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login page and root to dashboard
  if (isAuthenticated && (currentPath === "/login" || currentPath === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthenticated && partnerUser) {
    const userRole = partnerUser.role;

    // Restrict /admin to admin role only
    if (currentPath.startsWith("/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Restrict agents → only allow /b2b routes
    if (userRole === "agent") {
      if (!(currentPath === "/b2b" || currentPath.startsWith("/b2b/"))) {
        return NextResponse.redirect(new URL("/b2b", request.url));
      }
    }

    // Example: Restrict counsellor-only routes
    // if (currentPath.startsWith("/counsellor-only") && userRole !== "counsellor") {
    //   return NextResponse.redirect(new URL("/dashboard", request.url));
    // }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)"],
};

const createSupabaseClient = (request: NextRequest) => {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options) => {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options) => {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  return { supabase, response };
};
