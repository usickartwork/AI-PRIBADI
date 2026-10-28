import { NextRequest } from 'next/server';
import { getFaithTemporalInfo, type FaithTemporalInfo } from '@/lib/faith/temporal';
import { validateUserAccess } from '@/lib/accessControl';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Reliable Groq models with instant response (20b is fast secondary)
const GROQ_MODELS = [
  process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
];

// Active Gemini backup models with fresh quota (verified working via API)
const GEMINI_BACKUP_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

const SYSTEM_PROMPT = `
Kamu adalah seorang sahabat sejati, teman curhat, dan pendamping rohani di Faith Hub.
Kamu berbicara layaknya seorang sahabat dekat Kristen yang sangat hangat, rendah hati, penuh empati, manusiawi, dan SELALU NYAMBUNG saat diajak ngobrol.

IDENTITAS TEOLOGI & IMAN KRISTIANI (MUTLAK):
- Faith Hub dikhususkan dan berpusat bagi yang percaya kepada Tuhan Yesus Kristus (Iman Kristiani).
- Segala bentuk ucapan syukur, berkat, penghiburan, dan dasar rohani SELALU berakar pada Tuhan Allah Bapa, Tuhan Yesus Kristus, dan firman Alkitab.
- DILARANG KERAS menggunakan istilah, salam, sapaan, atau ungkapan dari agama Islam maupun agama non-Kristen lainnya (seperti: Alhamdulillah, Bismillah, InsyaAllah, Astaghfirullah, Subhanallah, Assalamu'alaikum, Barakallah, dsb).
- Jika mengungkapkan rasa syukur atau sukacita, SELALU gunakan ungkapan Kristiani (contoh: Puji Tuhan, Terpujilah Tuhan Yesus, Bersyukur kepada Tuhan, Damai sejahtera dan kasih Kristus menyertaimu).

PRINSIP KOMUNIKASI & CARA MENJAWAB:
1. Teman Curhat yang Nyata, Hangat & Fleksibel:
   - Bersikaplah wajar dan santai seperti sahabat akrab, BUKAN asisten kaku atau mesin penjawab.
   - Jika pengguna menyapa santai ("halo", "hai", "pagi", "apa kabar?"): Balaslah santai, ramah, dan hangat menanyakan kabarnya tanpa ceramah panjang.
   - Dengarkan dan pahami perasaan pengguna dengan tulus (baik saat galau, cemas, lelah, bimbang, maupun bersyukur).

2. BOLD (Penebalan) untuk Poin & Hal-Hal Penting:
   - WAJIB berikan format BOLD (**kata atau kalimat penting**) pada poin-poin krusial di setiap jawabanmu.
   - Tebalkan:
     * Janji atau kebenaran firman kunci (contoh: **Tuhan tidak pernah meninggalkanmu**, **kasih karunia-Nya selalu cukup**).
     * Inti solusi atau pesan utama (contoh: **langkah pertama adalah berani berserah**, **ambil waktu untuk tenang sejenak**).
     * Referensi firman (contoh: **Filipi 4:6–7**, **Mazmur 23:1**).
   - Format tebal ini membuat pembaca bisa langsung menangkap inti sari penghiburan dan kebenaran rohani secara jelas saat membaca.

3. Sertakan Firman / Kutipan Ayat Saat Dibutuhkan:
   - Jika topik atau pergumulan pengguna membutuhkan peneguhan, sertakan 1 kutipan ayat Alkitab nyata (Terjemahan Baru / TB) beserta referensinya (contoh: **Mazmur 23:1**, **Filipi 4:6-7**, **Yeremia 29:11**).
   - Jadikan ayat tersebut sebagai sumber kebenaran dan kekuatan yang menyejukkan hati. Tidak perlu di setiap jawaban, cukup saat relevan dan dibutuhkan agar terasa bermakna.

4. Gunakan Poin Hanya Jika Diperlukan:
   - Tidak perlu memaksakan poin di setiap obrolan santai.
   - Jika menjelaskan langkah praktis, saran rohani, atau beberapa poin pemikiran, gunakan poin (1., 2. atau -) dan **tebalkan judul atau kata kunci tiap poinnya** (contoh: **1. Ambil Waktu Teduh:** penjelasan...).
   - Untuk percakapan curhat yang mendalam, sampaikan dalam paragraf pendek yang mengalir hangat dan nyaman dibaca.

5. Tuntaskan Jawaban & Gaya Bahasa:
   - Tuntaskan kalimatmu sampai selesai secara utuh.
   - Gunakan Bahasa Indonesia yang hangat, akrab, dan bersahabat (gunakan sapaan aku dan kamu).
   - DILARANG menggunakan kata klise robot ("Sebagai AI...", "Tentu!", "Ada yang bisa saya bantu?").
   - DILARANG menggunakan tanda petik dua (") sama sekali di dalam teks jawabanmu.
`;

function getOfflineFallbackStream(lastMessage: string, temporal: FaithTemporalInfo): ReadableStream {
  const clean = lastMessage.trim().toLowerCase();
  let text = '';

  if (
    clean.includes('jam berapa') ||
    clean.includes('tanggal berapa') ||
    clean.includes('hari apa') ||
    clean.includes('sekarang jam') ||
    clean.includes('hari ini tanggal')
  ) {
    text = `Sekarang hari **${temporal.dayName}, ${temporal.dateStr}**, pukul **${temporal.hourMin} ${temporal.tzShort}**.\n\nSelamat menikmati suasana ${temporal.partOfDay} ini ya. Ada hal atau pergumulan yang lagi ingin kamu ceritakan hari ini?`;
  } else if (
    clean === 'hallo' ||
    clean === 'halo' ||
    clean === 'hai' ||
    clean === 'hi' ||
    clean === 'p' ||
    clean.startsWith('selamat')
  ) {
    text = `Halo, selamat ${temporal.partOfDay}! Senang sekali bisa ngobrol sama kamu di hari ${temporal.dayName} ini. Bagaimana kabarmu?\n\nAda hal yang lagi ada di pikiranmu atau ingin kamu ceritakan? Ceritakan saja, aku siap mendengarkan tanpa menghakimi.`;
  } else if (
    clean.includes('sedih') ||
    clean.includes('lelah') ||
    clean.includes('capek') ||
    clean.includes('berat') ||
    clean.includes('galau') ||
    clean.includes('bingung')
  ) {
    text = `Aku bisa merasakan betapa tidak mudahnya apa yang sedang kamu hadapi saat ini. Terima kasih sudah mau terbuka dan berbagi isi hatimu.\n\nTidak apa-apa kalau hari ini terasa berat. Kamu tidak harus memikul semuanya sendirian.\n\nTarik napas sejenak, pelan-pelan ceritakan apa yang paling mengganjal di pikiranmu saat ini. Aku di sini buat menemanimu.`;
  } else {
    text = `Aku ada di sini untuk mendengarkan dan berjalan bersamamu.\n\nKira-kira apa hal yang paling terasa mengganjal di hatimu saat ini? Ceritakan pelan-pelan ya.`;
  }

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const words = text.split(' ');
      for (const word of words) {
        controller.enqueue(encoder.encode(word + ' '));
        await new Promise((r) => setTimeout(r, 20));
      }
      controller.close();
    },
  });
}

/**
 * Stream response from Gemini models with timeout
 */
async function streamGeminiModel(
  messages: Array<{ role: string; content: string }>,
  modelName: string,
  systemPrompt: string
) {
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const abortCtrl = new AbortController();
  const timeoutId = setTimeout(() => abortCtrl.abort(), 6000);

  try {
    const res = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.72,
          maxOutputTokens: 1800,
        },
      }),
      signal: abortCtrl.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    let clerkUserId: string | undefined;
    try {
      const a = await auth();
      clerkUserId = a.userId || undefined;
    } catch {}

    const accessCheck = await validateUserAccess({ userId: clerkUserId, feature: 'faith' });
    if (!accessCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: accessCheck.error || 'Akses ke Faith Space sedang dibatasi.',
          reason: accessCheck.reason,
        }),
        {
          status: accessCheck.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { messages, timeZone } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const temporal = getFaithTemporalInfo(timeZone);
    const activeSystemPrompt = SYSTEM_PROMPT + temporal.promptBlock;

    // Keep context window focused (last 10 messages = 5 conversation turns) for ultra-fast TTFT
    const contextWindow = messages.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const lastUserMessage = contextWindow[contextWindow.length - 1]?.content || '';

    // =========================================================================
    // 1. UTAMA: Groq Models (qwen/qwen3.8-27b, openai/gpt-oss-20b, openai/gpt-oss-120b)
    // =========================================================================
    if (GROQ_API_KEY) {
      for (const groqModel of GROQ_MODELS) {
        try {
          const groqAbortCtrl = new AbortController();
          const groqTimeout = setTimeout(() => groqAbortCtrl.abort(), 4000);

          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: groqModel,
              messages: [{ role: 'system', content: activeSystemPrompt }, ...contextWindow],
              stream: true,
              temperature: 0.72,
              max_tokens: 1800,
            }),
            signal: groqAbortCtrl.signal,
          });

          clearTimeout(groqTimeout);

          if (groqRes && groqRes.ok && groqRes.body) {
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            const groqReader = groqRes.body.getReader();
            let buffer = '';

            const textStream = new ReadableStream({
              async start(controller) {
                try {
                  while (true) {
                    const { done, value } = await groqReader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (!trimmed || trimmed.startsWith(':')) continue;
                      if (trimmed === 'data: [DONE]') {
                        controller.close();
                        return;
                      }

                      if (trimmed.startsWith('data: ')) {
                        try {
                          const json = JSON.parse(trimmed.slice(6));
                          const delta = json.choices?.[0]?.delta?.content;
                          if (delta) {
                            controller.enqueue(encoder.encode(delta));
                          }
                        } catch {
                          // ignore incomplete chunk
                        }
                      }
                    }
                  }
                  controller.close();
                } catch (err) {
                  controller.error(err);
                }
              },
              cancel() {
                groqReader.cancel();
              },
            });

            return new Response(textStream, {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'X-Content-Type-Options': 'nosniff',
                'X-Accel-Buffering': 'no',
                'X-Model-Used': `groq-${groqModel}`,
              },
            });
          } else if (groqRes) {
            const errBody = await groqRes.text().catch(() => '');
            console.warn(`Groq ${groqModel} non-200 (${groqRes.status}):`, errBody.slice(0, 100));
          }
        } catch (err) {
          console.warn(`Groq ${groqModel} error, trying next backup:`, err);
        }
      }
    }

    // =========================================================================
    // 2. BACKUP OTOMATIS: Gemini Model Aktif (gemini-2.5-flash, gemini-2.0-flash, dll)
    // =========================================================================
    if (GEMINI_API_KEY) {
      for (const geminiModel of GEMINI_BACKUP_MODELS) {
        try {
          const geminiRes = await streamGeminiModel(contextWindow, geminiModel, activeSystemPrompt);

          if (geminiRes && geminiRes.ok && geminiRes.body) {
            console.log(`[Faith Hub] Streaming via backup model: ${geminiModel}`);
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            const geminiReader = geminiRes.body.getReader();
            let buffer = '';

            const textStream = new ReadableStream({
              async start(controller) {
                try {
                  while (true) {
                    const { done, value } = await geminiReader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (!trimmed || !trimmed.startsWith('data: ')) continue;
                      const jsonStr = trimmed.slice(6);
                      try {
                        const parsed = JSON.parse(jsonStr);
                        const parts = parsed.candidates?.[0]?.content?.parts;
                        if (Array.isArray(parts)) {
                          for (const part of parts) {
                            if (part.text) {
                              controller.enqueue(encoder.encode(part.text));
                            }
                          }
                        }
                      } catch {
                        // skip malformed chunk
                      }
                    }
                  }
                  controller.close();
                } catch (streamErr) {
                  controller.error(streamErr);
                }
              },
              cancel() {
                geminiReader.cancel();
              },
            });

            return new Response(textStream, {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'X-Content-Type-Options': 'nosniff',
                'X-Accel-Buffering': 'no',
                'X-Model-Used': `backup-${geminiModel}`,
              },
            });
          } else {
            console.warn(`Gemini model ${geminiModel} status:`, geminiRes?.status);
          }
        } catch (geminiErr) {
          console.warn(`Gemini model ${geminiModel} error:`, geminiErr);
        }
      }
    }

    // =========================================================================
    // 3. OFFLINE FALLBACK (Hanya jika Groq DAN seluruh model Gemini tidak terhubung)
    // =========================================================================
    return new Response(getOfflineFallbackStream(lastUserMessage, temporal), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('API /api/faith/chat error:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kendala sementara. Silakan ulangi tanggapan.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

