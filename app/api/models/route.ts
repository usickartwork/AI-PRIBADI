export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRouterModelsEndpoint(rawUrl?: string): string {
  const url = rawUrl?.trim() || "http://localhost:20128/v1/models";
  if (url.endsWith("/models")) {
    return url;
  }
  const base = url.replace(/\/chat\/completions\/?$/, "");
  if (base.endsWith("/v1")) {
    return base + "/models";
  }
  return base.replace(/\/+$/, "") + "/v1/models";
}

const ROUTER_MODELS_ENDPOINT = getRouterModelsEndpoint(process.env.ROUTER_URL);
const ROUTER_API_KEY = process.env.ROUTER_API_KEY || "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function formatLabel(id: string): string {
  const parts = id.split("/");
  if (parts.length === 2) {
    const provider = parts[0];
    const name = parts[1]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return `[${provider.toUpperCase()}] ${name}`;
  }
  if (parts.length >= 3) {
    const provider = parts[0];
    const name = parts.slice(1).join("/");
    return `[${provider.toUpperCase()}] ${name}`;
  }
  return id;
}

export async function GET() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (ROUTER_API_KEY) {
    headers["Authorization"] = `Bearer ${ROUTER_API_KEY}`;
  }

  try {
    let res: Response;
    try {
      res = await fetch(ROUTER_MODELS_ENDPOINT, { headers });
    } catch {
      if (ROUTER_MODELS_ENDPOINT.includes("localhost")) {
        const fallback = ROUTER_MODELS_ENDPOINT.replace("localhost", "127.0.0.1");
        res = await fetch(fallback, { headers });
      } else {
        return Response.json({ models: [] }, { headers: CORS_HEADERS });
      }
    }

    if (!res.ok) {
      return Response.json({ models: [] }, { headers: CORS_HEADERS });
    }

    const data = (await res.json()) as { data?: { id?: string }[] };
    const rawList = Array.isArray(data.data) ? data.data : [];
    const models = rawList
      .filter((m) => typeof m.id === "string" && m.id.length > 0)
      .map((m) => ({
        id: m.id as string,
        label: formatLabel(m.id as string),
      }));

    return Response.json({ models }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[api/models] error", err);
    return Response.json({ models: [] }, { headers: CORS_HEADERS });
  }
}
