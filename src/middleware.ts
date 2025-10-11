// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;

  // 1. Handle API requests (for CORS)
  if (currentPath.startsWith("/api/")) {
    const response = NextResponse.next();
    // Add CORS headers to the response
    response.headers.append("Access-Control-Allow-Credentials", "true");
    response.headers.append("Access-Control-Allow-Origin", "*"); // Replace with your actual origin in production
    response.headers.append("Access-Control-Allow-Methods", "GET,DELETE,PATCH,POST,PUT");
    response.headers.append(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );
    return response;
  }

  // 2. Handle Page requests (your existing authentication logic)
  const { supabase, response } = createSupabaseClient(request);

  const partnerSession = request.cookies.get("partner-session");
  let partnerUser = null;

  if (partnerSession) {
    try {
      partnerUser = JSON.parse(partnerSession.value);
    } catch (error) {
      const responseWithClearedCookie = NextResponse.next({
        request: { headers: request.headers },
      });
      responseWithClearedCookie.cookies.delete("partner-session");
      return responseWithClearedCookie;
    }
  }

  const isAuthenticated = !!partnerUser;

  if (!isAuthenticated && currentPath !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && (currentPath === "/login" || currentPath === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthenticated && partnerUser) {
    const userRole = partnerUser.role;

    if (currentPath.startsWith("/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (userRole === "agent") {
      if (!(currentPath === "/b2b" || currentPath.startsWith("/b2b/"))) {
        return NextResponse.redirect(new URL("/b2b", request.url));
      }
    }
  }

  return response;
}

export const config = {
  // ✅ Updated matcher to include both pages and API routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};


// This helper function remains the same
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