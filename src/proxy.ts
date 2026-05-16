import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Detect lost "Azuriz FC" traffic and tag it with a cookie so the home page
 * can show the subtle banner. A `?fc=1` query also forces it on for testing.
 *
 * In Next.js 16 this file is called `proxy.ts` (formerly `middleware.ts`).
 */

const HINT_TERMS = ["azuriz", "futebol", "futbol", "soccer", "torcedor"];

function looksLikeFootballFan(req: NextRequest): boolean {
  // Manual override for testing
  if (req.nextUrl.searchParams.get("fc") === "1") return true;

  const referrer = req.headers.get("referer")?.toLowerCase() ?? "";
  if (HINT_TERMS.some((t) => referrer.includes(t))) return true;

  // Some search engines pass the query in `q` or `query` on the referer
  if (referrer.includes("google") || referrer.includes("bing")) {
    if (HINT_TERMS.some((t) => referrer.includes(t))) return true;
  }

  return false;
}

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  if (looksLikeFootballFan(req)) {
    res.cookies.set("az_fc", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  matcher: [
    // Skip internals + static + favicons
    "/((?!_next/|api/|favicon\\.|.*\\.(?:png|jpg|jpeg|gif|svg|webp|mp4|ico|txt|xml)$).*)",
  ],
};
