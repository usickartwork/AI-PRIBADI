export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRouterEndpoint(rawUrl?: string): string {
  const url = rawUrl?.trim() || "http://localhost:20128/v1/chat/completions";
  if (url.endsWith("/chat/completions")) {
    return url;
  }
  return url.replace(/\/+$/, "") + "/chat/completions";
}

const ROUTER_ENDPOINT = getRouterEndpoint(process.env.ROUTER_URL);
const ROUTER_API_KEY = process.env.ROUTER_API_KEY || "";
const DEFAULT_MODEL = process.env.ROUTER_MODEL || "oc/mimo-v2.5-free";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

async function requestUpstream(bodyJson: string, headers: Record<string, string>) {
  try {
    return await fetch(ROUTER_ENDPOINT, {
      method: "POST",
      headers,
      body: bodyJson,
    });
  } catch (primaryErr) {
    // Fallback if localhost fails due to Windows IPv6 ::1 vs IPv4 127.0.0.1
    if (ROUTER_ENDPOINT.includes("localhost")) {
      const fallbackEndpoint = ROUTER_ENDPOINT.replace("localhost", "127.0.0.1");
      return await fetch(fallbackEndpoint, {
        method: "POST",
        headers,
        body: bodyJson,
      });
    }
    throw primaryErr;
  }
}

export async function POST(request: Request) {
  let body: {
    messages?: ChatMessage[];
    model?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const messages = body.messages;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "Messages required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (ROUTER_API_KEY) {
    headers["Authorization"] = `Bearer ${ROUTER_API_KEY}`;
  }

  try {
    const upstream = await requestUpstream(
      JSON.stringify({
        model: body.model || DEFAULT_MODEL,
        messages,
        stream: true,
        max_tokens: 4096,
      }),
      headers
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("[api/chat] upstream error", upstream.status, errText.slice(0, 500));
      return Response.json(
        {
          error:
            "9Router gagal merespons. Pastikan 9Router aktif di server host dan provider sudah terhubung.",
          detail: errText.slice(0, 500),
        },
        { status: upstream.status, headers: CORS_HEADERS }
      );
    }

    if (!upstream.body) {
      return Response.json(
        { error: "No response body from 9Router" },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    console.error("[api/chat] network error", err);
    return Response.json(
      {
        error:
          "Tidak bisa terhubung ke 9Router dari server. Pastikan 9Router aktif di PC host.",
      },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}