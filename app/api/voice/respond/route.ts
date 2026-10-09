import { NextRequest, NextResponse } from "next/server";

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
    // Prioritaskan model tercepat untuk conversational voice
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
                maxOutputTokens: 100,
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
      replyText = "Halo, saya mendengarkan Anda. Ada yang bisa saya bantu?";
    }

    // 2. Synthesize voice with Gemini 3.8 Flash Lite TTS
    let audioBase64: string | null = null;
    const ttsCandidates = [
      "gemini-3.8-flash-lite-tts",
      "gemini-3.8-flash-tts",
    ];

    for (const ttsModel of ttsCandidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

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
            break;
          }
        }
      } catch (ttsErr) {
        console.warn(`[gemini-tts] Error with model ${ttsModel}:`, ttsErr);
      }
    }

    return NextResponse.json({
      text: replyText,
      audioBase64,
      audioMime: "audio/wav",
    });
  } catch (error: any) {
    console.error("[voice-api] Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses suara" },
      { status: 500 }
    );
  }
}

