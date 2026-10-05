export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, size = "1024x1024" } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt gambar wajib disertakan." },
        { status: 400 }
      );
    }

    const rawPrompt = prompt.trim();
    const novitaKey = process.env.NOVITA_API_KEY?.trim();

    if (!novitaKey) {
      return NextResponse.json(
        { error: "NOVITA_API_KEY belum dikonfigurasi di server." },
        { status: 500 }
      );
    }

    // 1. Optimasi & Maksimalkan prompt menggunakan gpt-oss-120b
    let finalPrompt = rawPrompt;
    try {
      const groqKey = process.env.GROQ_API_KEY?.trim();
      const customBase = process.env.CUSTOM_BASE_URL?.trim();
      const customKey = process.env.CUSTOM_API_KEY?.trim();

      const systemPrompt =
        "You are an expert AI image prompt optimizer and visual director. " +
        "Task: Take the user raw prompt (whether in Indonesian or any language) and maximize it into an extraordinary, detailed, high-impact English prompt for image generation. " +
        "Enrich it with visual aesthetics, subject details, composition, artistic style, lighting (e.g., cinematic lighting, soft diffused studio light, golden hour, chiaroscuro), textures, colors, and atmosphere. " +
        "Keep the core subject, intent, and message completely faithful to the user request. " +
        "Output ONLY the final maximized English prompt as plain text. No introductory words, no conversational filler, no markdown formatting, no quotes.";

      // Prioritas utama sesuai brief user: gpt-oss-120b (Groq / Novita)
      const optimizerCandidates: Array<{ url: string; key: string; model: string }> = [];

      if (groqKey) {
        optimizerCandidates.push({
          url: "https://api.groq.com/openai/v1/chat/completions",
          key: groqKey,
          model: "openai/gpt-oss-120b",
        });
      }

      if (novitaKey) {
        optimizerCandidates.push({
          url: "https://api.novita.ai/v3/openai/chat/completions",
          key: novitaKey,
          model: "openai/gpt-oss-120b",
        });
      }

      if (customBase && customKey) {
        const endpoint = customBase.endsWith("/chat/completions")
          ? customBase
          : `${customBase.replace(/\/+$/, "")}/v1/chat/completions`;
        optimizerCandidates.push({
          url: endpoint,
          key: customKey,
          model: "clario/deepseek-v4.1-flash-auto",
        });
      }

      if (novitaKey) {
        optimizerCandidates.push({
          url: "https://api.novita.ai/v3/openai/chat/completions",
          key: novitaKey,
          model: "qwen/qwen3.8-flash",
        });
      }

      for (const target of optimizerCandidates) {
        try {
          const transRes = await fetch(target.url, {
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
              max_tokens: 220,
              temperature: 0.7,
            }),
          });

          if (transRes.ok) {
            const transData = await transRes.json();
            const content = transData.choices?.[0]?.message?.content?.trim();
            if (content) {
              finalPrompt = content.replace(/^["']|["']$/g, "").trim();
              break;
            }
          }
        } catch (e) {
          console.warn(`[image/generate] Optimizer candidate ${target.model} failed, trying next:`, e);
        }
      }
    } catch (e) {
      console.warn("[image/generate] Prompt translation warning:", e);
    }

    // 2. Generate Gambar menggunakan model ming-image-0.1-design dari Novita AI
    const novitaRes = await fetch("https://api.novita.ai/openai/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${novitaKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "ming-image-0.1-design",
        prompt: finalPrompt,
        size,
        response_format: "b64_json",
      }),
    });

    if (!novitaRes.ok) {
      const errText = await novitaRes.text();
      console.error("[image/generate] Novita error:", novitaRes.status, errText);
      return NextResponse.json(
        { error: `Gagal menghasilkan gambar dari Novita AI (${novitaRes.status}).` },
        { status: novitaRes.status }
      );
    }

    const novitaData = await novitaRes.json();
    const b64 = novitaData.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "Model tidak mengembalikan data gambar." },
        { status: 502 }
      );
    }

    const dataUrl = `data:image/png;base64,${b64}`;

    return NextResponse.json({
      success: true,
      image: dataUrl,
      prompt: rawPrompt,
      translatedPrompt: finalPrompt,
      model: "ming-image-0.1-design",
      size,
    });
  } catch (err: any) {
    console.error("[image/generate] Exception:", err);
    return NextResponse.json(
      { error: err?.message || "Terjadi kesalahan saat membuat gambar." },
      { status: 500 }
    );
  }
}
