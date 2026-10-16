import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

const clerk = clerkMiddleware();

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;
  const isTargetMethod = req.method === "GET" || req.method === "HEAD";

  // Halaman publik & SEO: langsung bypass tanpa handshake redirect
  const isPublicPage =
    pathname === "/" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  if (isPublicPage && isTargetMethod) {
    return NextResponse.next();
  }

  // Route /api/*, /sign-in, /sign-up, /sso-callback, dan rute privat lainnya tetap 100% diproses Clerk
  return clerk(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
