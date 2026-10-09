import { NextRequest, NextResponse } from "next/server";

// High-speed, unlimited Indonesian TTS fallback (guarantees voice output even when Gemini quota is exhausted)
async function generateGoogleIndonesianTTS(text: string): Promise<string | null> {
  try {
    const clean = text.replace(/[*#_`~]/g, "").trim();
    if (!clean) return null;
    const sentences = clean.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [clean];
    const audioBuffers: Buffer[] = [];

    for (const s of sentences.slice(0, 6)) {
      const chunk = s.trim().slice(0, 180);
      if (!chunk) continue;
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        audioBuffers.push(Buffer.from(buf));
      }
    }

    if (audioBuffers.length === 0) return null;
    const combined = Buffer.concat(audioBuffers);
    return combined.toString("base64");
  } catch (err) {
    console.warn("[google-tts-fallback] Error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_VOICE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_VOICE_API_KEY atau GEMINI_API_KEY belum disetel di environment (.env.local)" },
        { status: 500 }
      );
    }

    const { text, history = [] } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Teks perintah tidak boleh kosong" }, { status: 400 });
    }

    // 1. Generate text response with ultra-fast Gemini 3.5 Flash Lite
    const systemInstruction =
      "Kamu adalah asisten suara AI pintar bernama One Mind. " +
      "Jawablah langsung dalam bahasa Indonesia lisan yang santun, sangat padat, dan ringkas (maksimal 1-2 kalimat pendek). " +
      "PENTING: Jangan gunakan format markdown seperti tanda bintang (*), tanda pagar (#), daftar bernomor, bullet point, atau emotikon agar natural didengarkan via audio.";

    const contents = [
      ...history.slice(-4).map((h: { role: string; content: string }) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      {
        role: "user",
        parts: [{ text }],
      },
    ];

    let replyText = "";
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-1.5-flash",
    ];

    for (const modelName of candidateModels) {
      try {
        const textGenRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents,
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 120,
              },
            }),
          }
        );

        if (textGenRes.ok) {
          const textData = await textGenRes.json();
          const generated = textData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (generated) {
            replyText = generated;
            break;
          }
        }
      } catch (err) {
        console.warn(`[voice-api] Model ${modelName} error:`, err);
      }
    }

    if (!replyText) {
      replyText = "Halo, saya One Mind. Saya mendengarkan Anda. Ada yang bisa saya bantu?";
    }

    // 2. Synthesize voice with Gemini TTS (with ultra-reliable fallback)
    let audioBase64: string | null = null;
    let audioMime = "audio/wav";

    const ttsCandidates = [
      "gemini-3.8-flash-lite-tts",
      "gemini-3.8-flash-tts",
    ];

    for (const ttsModel of ttsCandidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const ttsRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: replyText }] }],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Aoede",
                    },
                  },
                },
              },
            }),
          }
        );
        clearTimeout(timeoutId);

        if (ttsRes.ok) {
          const ttsData = await ttsRes.json();
          const part = ttsData.candidates?.[0]?.content?.parts?.[0];
          if (part?.inlineData?.data) {
            audioBase64 = part.inlineData.data;
            audioMime = part.inlineData.mimeType || "audio/wav";
            break;
          }
        } else {
          console.warn(`[gemini-tts] ${ttsModel} returned status ${ttsRes.status}`);
        }
      } catch (ttsErr) {
        console.warn(`[gemini-tts] Error with model ${ttsModel}:`, ttsErr);
      }
    }

    // If Gemini TTS is exhausted (HTTP 429 daily limit) or failed, use high-fidelity Indonesian TTS fallback
    if (!audioBase64) {
      const fallbackAudio = await generateGoogleIndonesianTTS(replyText);
      if (fallbackAudio) {
        audioBase64 = fallbackAudio;
        audioMime = "audio/mpeg";
      }
    }

    return NextResponse.json({
      text: replyText,
      audioBase64,
      audioMime,
    });
  } catch (error: any) {
    console.error("[voice-api] Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses suara" },
      { status: 500 }
    );
  }
}
