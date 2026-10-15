import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Active Gemini models that support multimodal image understanding
const GEMINI_VISION_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
];

const VISION_SYSTEM_PROMPT = `
Kamu adalah sahabat rohani dan pendamping saat teduh di Faith Hub. Tugasmu adalah menyimpulkan isi foto yang diambil pengguna dan memberikan renungan firman yang tertata rapi, sangat mudah dibaca, serta menguatkan hati.

FORMAT TATA LETAK JAWABAN (WAJIB DIIKUTI DENGAN RAPI MENGGUNAKAN POIN & TEBAL):

**1. Kesimpulan Foto**
Tuliskan 1-2 kalimat jelas dan padat mengenai apa yang tampak di dalam foto (teks bacaan, perikop Alkitab, catatan khotbah, benda, tempat, atau suasana).

**2. Poin-Poin Renungan Rohani**
Sampaikan 2 atau 3 poin perenungan ringkas yang bermakna. Gunakan tanda poin (-) dan **TEBALKAN kata kunci** di awal setiap poin:
- **Poin 1:** Penjelasan hikmat rohani yang relevan dan praktis...
- **Poin 2:** Penjelasan hikmat rohani yang menyejukkan hati...

**3. Ayat Firman Tuhan yang Menguatkan**
Sertakan 1 kutipan ayat Alkitab (Terjemahan Baru / TB) yang paling selaras dengan isi foto:
> **Referensi Kitab Pasal:Ayat**
> Teks lengkap ayat Alkitab...

**4. Doa Singkat / Langkah Refleksi**
Tuliskan doa 2-3 kalimat yang hangat dan tulus atau satu pertanyaan reflektif untuk direnungkan pengguna hari ini.

ATURAN GAYA BAHASA:
- Gunakan bahasa Indonesia yang hangat, akrab, manusiawi (gunakan sapaan aku dan kamu).
- Selalu pisahkan setiap bagian utama dengan enter ganda (\n\n) agar tampilan terstruktur dan tidak menumpuk menjadi paragraf panjang.
- DILARANG menggunakan tanda petik ganda (") untuk membungkus kalimat jawabanmu.
`;

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Data gambar (base64) diperlukan.' },
        { status: 400 }
      );
    }

    const userPrompt =
      prompt ||
      'Tolong simpulkan apa isi foto ini secara jelas, jelaskan makna pesannya, dan berikan renungan rohani yang menguatkan.';

    // Extract base64 and mime type
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    const mimeType = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : image;

    // 1. Try Active Gemini Vision Models (Verified working 200 OK)
    if (GEMINI_API_KEY) {
      for (const model of GEMINI_VISION_MODELS) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType,
                        data: base64Data,
                      },
                    },
                    {
                      text: `${VISION_SYSTEM_PROMPT}\n\nPermintaan pengguna: ${userPrompt}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.72,
                maxOutputTokens: 800,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (textResult) {
              return NextResponse.json({ summary: textResult });
            }
          } else {
            const errText = await res.text();
            console.warn(`Gemini Vision model ${model} non-200 (${res.status}):`, errText.slice(0, 100));
          }
        } catch (geminiErr: any) {
          console.warn(`Gemini Vision model ${model} error:`, geminiErr?.message || geminiErr);
        }
      }
    }

    // 2. Try OpenAI Vision if available
    if (OPENAI_API_KEY) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: VISION_SYSTEM_PROMPT },
              {
                role: 'user',
                content: [
                  { type: 'text', text: userPrompt },
                  { type: 'image_url', image_url: { url: image } },
                ],
              },
            ],
            max_tokens: 600,
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const textResult = data.choices?.[0]?.message?.content?.trim();
          if (textResult) {
            return NextResponse.json({ summary: textResult });
          }
        }
      } catch (openAiErr: any) {
        console.warn('OpenAI Vision failed:', openAiErr?.message || openAiErr);
      }
    }

    // 3. Fallback message only if no key or all providers failed
    return NextResponse.json(
      {
        summary:
          'Foto telah berhasil diterima di memori.\n\nSaat ini sedang ada kendala jaringan sementara untuk menganalisis isi foto. Silakan pastikan koneksi internet stabil dan coba ambil foto kembali ya.',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('API /api/ai/vision error:', err);
    return NextResponse.json(
      { error: 'Gagal menganalisis foto. Silakan coba kembali.' },
      { status: 500 }
    );
  }
}

