import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    // const { pathname } = req.nextUrl;
    // const token = req.cookies.get("token")?.value;
    // const role = req.cookies.get("role")?.value?.toUpperCase();
    // const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    // const isOrganizer = role === "ORGANIZER";
    // const isProfileCompleted = req.cookies.get("isProfileCompleted")?.value;

    // // only ADMIN & SUPER_ADMIN allowed
    // if (pathname.startsWith("/admin")) {
    //     if (!token) return NextResponse.redirect(new URL("/auth/login", req.url));
    //     if (!isAdmin) {
    //         return NextResponse.redirect(new URL("/", req.url));
    //     }
    // }

    // // Account setup is strictly for ORGANIZER role
    // if (pathname === "/auth/account-setup") {
    //     if (!token) return NextResponse.redirect(new URL("/auth/login", req.url));
    //     if (isAdmin) {
    //         return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    //     }
    //     if (!isOrganizer) {
    //         // Regular USER role never accesses account-setup -> redirect to home
    //         return NextResponse.redirect(new URL("/", req.url));
    //     }
    // }

    // // Protect Dashboard routes: requires authentication
    // if (pathname.startsWith("/dashboard")) {
    //     if (!token) return NextResponse.redirect(new URL("/auth/login", req.url));
    //     // Admin has their own dashboard at /admin/dashboard
    //     if (isAdmin) {
    //         return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    //     }
    //     // Only ORGANIZER can access /dashboard; regular users go to home
    //     if (!isOrganizer) {
    //         return NextResponse.redirect(new URL("/", req.url));
    //     }
    //     // For organizer: block dashboard if profile is not completed
    //     if (isProfileCompleted === "false") {
    //         return NextResponse.redirect(new URL("/auth/account-setup", req.url));
    //     }
    // }

    // // Redirect logged-in users away from login page
    // if (pathname === "/auth/login" && token) {
    //     if (isAdmin) {
    //         return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    //     }
    //     if (isOrganizer) {
    //         if (isProfileCompleted === "false") {
    //             return NextResponse.redirect(new URL("/auth/account-setup", req.url));
    //         }
    //         return NextResponse.redirect(new URL("/dashboard", req.url));
    //     }
    //     // Regular USER role -> redirect to Home page
    //     return NextResponse.redirect(new URL("/", req.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*", "/auth/login", "/auth/account-setup"],
};