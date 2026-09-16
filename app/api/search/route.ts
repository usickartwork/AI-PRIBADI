export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { searchSearxng } from "@/lib/searxng";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return Response.json({ error: "Query 'q' parameter required" }, { status: 400 });
  }

  try {
    const results = await searchSearxng(q);
    return Response.json({ query: q, count: results.length, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search error";
    return Response.json({ error: message }, { status: 500 });
  }
}
