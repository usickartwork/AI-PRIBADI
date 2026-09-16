export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export type SearxngSearchResponse = {
  results: SearchResult[];
  error?: string;
};

export async function searchSearxng(query: string): Promise<SearchResult[]> {
  const baseUrl = (process.env.SEARXNG_URL || "http://localhost:8080").replace(/\/+$/, "");
  const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(query)}&format=json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`SearXNG merespons HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    const rawText = await res.text();

    if (
      !contentType.includes("application/json") &&
      (rawText.trim().startsWith("<!DOCTYPE") || rawText.trim().startsWith("<html"))
    ) {
      throw new Error(
        "SearXNG JSON API tidak aktif. Silakan aktifkan format 'json' pada file settings.yml SearXNG Anda (search.formats: [html, json])."
      );
    }

    let data: { results?: Array<{ title?: string; url?: string; content?: string; snippet?: string }> };
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(
        "Gagal membaca respons JSON dari SearXNG. Pastikan format 'json' sudah diizinkan pada settings.yml SearXNG."
      );
    }

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    // Maksimal 5 hasil per search sesuai requirement
    return data.results.slice(0, 5).map((r) => ({
      title: r.title || r.url || "Tanpa Judul",
      url: r.url || "",
      snippet: r.content || r.snippet || "",
    }));
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error(`Waktu pencarian SearXNG (${baseUrl}) habis (timeout 6d).`);
      }
      if (err.message.includes("ECONNREFUSED") || err.message.includes("fetch failed")) {
        throw new Error(
          `Tidak dapat terhubung ke SearXNG di ${baseUrl}. Pastikan instance SearXNG berjalan.`
        );
      }
      throw err;
    }
    throw new Error("Terjadi kesalahan tidak diketahui saat menghubungi SearXNG.");
  }
}
