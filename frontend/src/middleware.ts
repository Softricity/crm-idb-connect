// src/middleware.ts
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

  // 2. Handle Page requests (JWT token-based authentication)
  const authToken = request.cookies.get("auth-token");
  const partnerSession = request.cookies.get("partner-session");
  let partnerUser = null;

  // Check if both token and session exist
  if (authToken && partnerSession) {
    try {
      partnerUser = JSON.parse(partnerSession.value);
    } catch (error) {
      // Clear invalid cookies
      const responseWithClearedCookie = NextResponse.next({
        request: { headers: request.headers },
      });
      responseWithClearedCookie.cookies.delete("partner-session");
      responseWithClearedCookie.cookies.delete("auth-token");
      return responseWithClearedCookie;
    }
  }

  const isAuthenticated = !!partnerUser && !!authToken;

  if (!isAuthenticated && currentPath !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && (currentPath === "/login" || currentPath === "/")) {
    // Redirect based on role
    if (partnerUser?.role === "agent") {
      return NextResponse.redirect(new URL("/b2b", request.url));
    } else if (partnerUser?.role === "counsellor") {
      return NextResponse.redirect(new URL("/counsellor", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthenticated && partnerUser) {
    const userRole = partnerUser.role;

    // Admin-only routes
    if (currentPath.startsWith("/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Agent role - redirect to B2B panel
    if (userRole === "agent") {
      if (!(currentPath === "/b2b" || currentPath.startsWith("/b2b/"))) {
        return NextResponse.redirect(new URL("/b2b", request.url));
      }
    }

    // Counsellor role - redirect to counsellor panel
    if (userRole === "counsellor") {
      if (!(currentPath === "/counsellor" || currentPath.startsWith("/counsellor/"))) {
        return NextResponse.redirect(new URL("/counsellor", request.url));
      }
    }

    // Prevent agents and counsellors from accessing admin routes
    if (userRole !== "admin") {
      if (currentPath.startsWith("/agents") || 
          currentPath.startsWith("/counsellors") || 
          currentPath.startsWith("/commissions")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // ✅ Updated matcher to include both pages and API routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};