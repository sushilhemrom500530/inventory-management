import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that strictly require authentication
const protectedPrefixes = [
  "/dashboard",
  "/products",
  "/categories",
  "/sales",
  "/alerts",
  "/notifications",
  "/ai-advisor",
  "/reports",
  "/profile",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogoutIntent = request.nextUrl.searchParams.has("logout");
  const token = isLogoutIntent ? undefined : request.cookies.get("token")?.value;

  // If user explicitly navigated with ?logout, purge cookies immediately
  if (isLogoutIntent) {
    const response = NextResponse.next();
    response.cookies.delete("token");
    response.cookies.delete("refreshToken");
    response.cookies.delete("user");
    response.cookies.delete("role");
    return response;
  }

  // 1. If accessing a protected route without a valid token, redirect to login
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already logged in and visiting login or register, redirect to dashboard
  if (token && (pathname === "/auth/login" || pathname === "/auth/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/categories/:path*",
    "/sales/:path*",
    "/alerts/:path*",
    "/notifications/:path*",
    "/notifications",
    "/ai-advisor/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
