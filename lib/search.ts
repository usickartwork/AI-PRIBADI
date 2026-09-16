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
      throw new Error(`Tavily API merespons HTTP ${res.status}: ${errText.slice(0, 150)}`);
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

  if (tavilyKey) {
    try {
      return await searchTavily(query, tavilyKey);
    } catch (tavilyErr: unknown) {
      console.warn("[searchWeb] Tavily failed, trying SearXNG fallback:", tavilyErr);
      // Fallback to SearXNG if configured
      return await searchSearxng(query);
    }
  }

  // Fallback if no Tavily API Key provided
  return await searchSearxng(query);
}

