import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum disetel di .env.local" },
        { status: 500 }
      );
    }

    const { text, history = [] } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Teks perintah tidak boleh kosong" }, { status: 400 });
    }

    // 1. Generate text response with Gemini Flash
    const systemInstruction =
      "Kamu adalah asisten suara AI yang ramah, ringkas, cerdas, dan natural. " +
      "Jawablah langsung dalam bahasa Indonesia lisan yang santun dan padat (1-2 kalimat), " +
      "hindari format markdown seperti bintang (*), pagar (#), atau list angka agar nyaman diucapkan secara audio.";

    const contents = [
      ...history.slice(-6).map((h: { role: string; content: string }) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      {
        role: "user",
        parts: [{ text }],
      },
    ];

    const textGenRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        }),
      }
    );

    let replyText = "";
    if (textGenRes.ok) {
      const textData = await textGenRes.json();
      replyText = textData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } else {
      // Fallback response if generation limit
      replyText = "Halo, saya mendengarkan Anda. Ada yang bisa saya bantu hari ini?";
    }

    // 2. Synthesize voice with Gemini 3.8 Flash TTS
    let audioBase64: string | null = null;
    try {
      const ttsRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: replyText }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
            },
          }),
        }
      );

      if (ttsRes.ok) {
        const ttsData = await ttsRes.json();
        const part = ttsData.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          audioBase64 = part.inlineData.data;
        }
      }
    } catch (ttsErr) {
      console.warn("[gemini-tts] Error:", ttsErr);
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
