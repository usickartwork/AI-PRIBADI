import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

const clerk = clerkMiddleware();

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;
  const isTargetMethod = req.method === "GET" || req.method === "HEAD";

  // Hanya bypass jika request adalah GET/HEAD pada root homepage ('/')
  // dan berasal dari search engine crawler (Googlebot, dll.)
  // Route /api/*, /sign-in, /sign-up, dan route privat lainnya tetap 100% diproses Clerk
  if (pathname === "/" && isTargetMethod) {
    const userAgent = req.headers.get("user-agent") || "";
    const isSearchBot = /googlebot|bingbot|yandex|duckduckbot|slurp|baiduspider/i.test(userAgent);

    if (isSearchBot) {
      return NextResponse.next();
    }
  }

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
