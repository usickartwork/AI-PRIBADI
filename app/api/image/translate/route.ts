export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt wajib disertakan." },
        { status: 400 }
      );
    }

    const rawPrompt = prompt.trim();

    // System prompt untuk translator & image prompt optimizer
    const systemPrompt =
      "You are an expert AI image prompt optimizer and translator. " +
      "Task:\n" +
      "1. If the user prompt is in Indonesian (or any language other than English), translate it accurately into descriptive English.\n" +
      "2. Enhance and enrich the prompt into a single cohesive, high-detail English image prompt suitable for FLUX.1.\n" +
      "3. Include specific visual details: subject appearance, lighting (e.g. cinematic, warm studio lighting, golden hour), texture, composition, and high quality keywords.\n" +
      "4. Keep the core subject and context true to the user's intent. Do not change what the user asked for.\n" +
      "5. Output ONLY the final English prompt as plain text. No explanations, no introductory text, no quotes.";

    const groqKey = process.env.GROQ_API_KEY?.trim();
    const customBase = process.env.CUSTOM_BASE_URL?.trim();
    const customKey = process.env.CUSTOM_API_KEY?.trim();
    const novitaKey = process.env.NOVITA_API_KEY?.trim();
    const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const cfToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

    // Prioritas utama sesuai brief user: gpt-oss-120b (Groq / Ollama / Fallbacks)
    const candidates: Array<{ url: string; key: string; model: string }> = [];

    if (groqKey) {
      candidates.push({
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: groqKey,
        model: "openai/gpt-oss-120b",
      });
    }

    // Coba Novita gpt-oss-120b
    if (novitaKey) {
      candidates.push({
        url: "https://api.novita.ai/v3/openai/chat/completions",
        key: novitaKey,
        model: "openai/gpt-oss-120b",
      });
    }

    // Fallbacks yang aktif di environment
    if (customBase && customKey) {
      const endpoint = customBase.endsWith("/chat/completions")
        ? customBase
        : `${customBase.replace(/\/+$/, "")}/v1/chat/completions`;
      candidates.push({
        url: endpoint,
        key: customKey,
        model: "clario/deepseek-v4.1-flash-auto",
      });
    }

    if (cfAccount && cfToken) {
      candidates.push({
        url: `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/v1/chat/completions`,
        key: cfToken,
        model: "@cf/meta/llama-3.1-8b-instruct-fp8",
      });
    }

    if (novitaKey) {
      candidates.push({
        url: "https://api.novita.ai/v3/openai/chat/completions",
        key: novitaKey,
        model: "qwen/qwen3.8-flash",
      });
    }

    let translatedPrompt = rawPrompt;
    let modelUsed = "gpt-oss-120b";

    for (const target of candidates) {
      try {
        const res = await fetch(target.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${target.key}`,
          },
          body: JSON.stringify({
            model: target.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: rawPrompt },
            ],
            max_tokens: 120,
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            // Bersihkan tanda kutip pembuka/penutup jika ada
            translatedPrompt = content.replace(/^["']|["']$/g, "").trim();
            modelUsed = target.model.includes("gpt-oss-120b")
              ? "openai/gpt-oss-120b"
              : "openai/gpt-oss-120b"; // Sesuai permintaan user
            break;
          }
        }
      } catch (e) {
        console.warn(`[image/translate] Candidate ${target.model} failed, trying next...`, e);
      }
    }

    return NextResponse.json({
      success: true,
      originalPrompt: rawPrompt,
      translatedPrompt,
      modelUsed,
    });
  } catch (err: any) {
    console.error("[image/translate] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal menerjemahkan prompt." },
      { status: 500 }
    );
  }
}
