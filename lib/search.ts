import { searchSearxng, SearchResult } from "./searxng";

export type { SearchResult };

export async function searchTavily(query: string, apiKey: string): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey.trim(),
        query: query.trim(),
        search_depth: "basic",
        max_results: 5,
        include_answer: false,
        include_raw_content: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let msg = errText.slice(0, 150);
      try {
        const parsed = JSON.parse(errText);
        if (parsed.detail?.error) msg = parsed.detail.error;
        else if (parsed.message) msg = parsed.message;
      } catch {}

      if (res.status === 401 || res.status === 403) {
        throw new Error(`API Key Tavily tidak valid. Periksa TAVILY_API_KEY di Vercel Dashboard.`);
      }

      throw new Error(`Tavily API merespons error (HTTP ${res.status}): ${msg}`);
    }

    const data = (await res.json()) as {
      results?: Array<{ title?: string; url?: string; content?: string }>;
    };

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.slice(0, 5).map((item) => ({
      title: item.title || item.url || "Tanpa Judul",
      url: item.url || "",
      snippet: item.content || "",
    }));
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error("Waktu pencarian Tavily habis (timeout 8d).");
      }
      throw err;
    }
    throw new Error("Terjadi kesalahan saat mengontak Tavily API.");
  }
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const tavilyKey = process.env.TAVILY_API_KEY?.trim();

  // Primary: Tavily API
  if (tavilyKey) {
    return await searchTavily(query, tavilyKey);
  }

  // Secondary: Custom Remote SearXNG (only if not pointing to localhost)
  const searxngUrl = process.env.SEARXNG_URL?.trim();
  if (searxngUrl && !searxngUrl.includes("localhost") && !searxngUrl.includes("127.0.0.1")) {
    return await searchSearxng(query);
  }

  // Clear Vercel-focused error message if TAVILY_API_KEY is not configured
  throw new Error(
    "Fitur Web Search memerlukan TAVILY_API_KEY pada Vercel Dashboard (Settings -> Environment Variables). Silakan dapatkan API key gratis di https://tavily.com."
  );
}
