import { NextRequest, NextResponse } from 'next/server';
import { getFaithTemporalInfo } from '@/lib/faith/temporal';

export const dynamic = 'force-dynamic';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// High-speed Groq models with guaranteed sub-second response
const GROQ_MODELS = [
  process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
];

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
];

interface FormattedReflection {
  thought: string;
  prayer: string;
  reflectionQuestion: string;
  suggestedVerses: { reference: string; note: string }[];
  comfort: string;
  reflection: string;
  verse?: { reference: string; text: string };
}

function normalizeReflectionResponse(raw: Record<string, unknown>): FormattedReflection {
  const thought =
    (typeof raw.thought === 'string' && raw.thought.trim()) ||
    (typeof raw.comfort === 'string' && raw.comfort.trim()) ||
    'Firman Tuhan senantiasa menjadi pelita bagi langkah kita dan terang bagi jalan kita. Renungkanlah janji penyertaan-Nya hari ini.';

  const prayer =
    (typeof raw.prayer === 'string' && raw.prayer.trim()) ||
    'Tuhan Yesus, terima kasih atas firman-Mu yang menguatkan jiwaku. Mampukan aku untuk mempraktikkan kebenaran-Mu di dalam keseharian dengan penuh kasih dan kesetiaan. Amin.';

  const reflectionQuestion =
    (typeof raw.reflectionQuestion === 'string' && raw.reflectionQuestion.trim()) ||
    (typeof raw.reflection === 'string' && raw.reflection.trim()) ||
    'Bagaimana kamu dapat menerapkan pesan firman ini dalam langkah atau keputusan hidupmu hari ini?';

  let suggestedVerses: { reference: string; note: string }[] = [];
  if (Array.isArray(raw.suggestedVerses) && raw.suggestedVerses.length > 0) {
    suggestedVerses = raw.suggestedVerses.map((v) => ({
      reference: String(v.reference || ''),
      note: String(v.note || v.text || ''),
    }));
  } else if (raw.verse && typeof raw.verse === 'object') {
    const v = raw.verse as { reference?: string; text?: string };
    if (v.reference || v.text) {
      suggestedVerses = [{
        reference: v.reference || 'Alkitab',
        note: v.text || '',
      }];
    }
  }

  return {
    thought,
    prayer,
    reflectionQuestion,
    suggestedVerses,
    comfort: thought,
    reflection: reflectionQuestion,
    verse: suggestedVerses[0] ? { reference: suggestedVerses[0].reference, text: suggestedVerses[0].note } : undefined,
  };
}

// Empathetic instant fallback responses based on verse reference & keywords
function getOfflineCompanionResponse(text: string, verseContext?: string): FormattedReflection {
  const lower = (text + ' ' + (verseContext || '')).toLowerCase();

  let thought = 'Firman yang kamu renungkan saat ini meneguhkan bahwa kasih setia Tuhan tidak pernah berkesudahan. Di tengah hiruk pikuk hidup, firman-Nya adalah tempat perhentian yang menyegarkan jiwamu.';
  let prayer = 'Tuhan, terima kasih untuk setiap firman-Mu yang selalu hidup dan menguatkan. Pimpin langkahku hari ini agar hidupku berkenan dan selaras dengan kehendak-Mu. Amin.';
  let question = 'Bagaimana pesan dari firman ini dapat membimbing tindakan atau perkataanmu hari ini?';
  let suggested = [{ reference: 'Mazmur 119:105', note: 'Firman-Mu itu pelita bagi kakiku dan terang bagi jalanku.' }];

  if (lower.includes('roma 8') || lower.includes('kebaikan') || lower.includes('bekerja dalam segala sesuatu')) {
    thought = 'Dalam setiap musim hidupmu, baik yang mudah maupun penuh tantangan, Allah tidak pernah berpangku tangan. Ia senantiasa merajut segala kejadian untuk mendatangkan kebaikan dan pertumbuhan iman bagimu yang mengasihi Dia.';
    prayer = 'Bapa di surga, aku percaya rencana-Mu selalu penuh damai sejahtera. Tolong aku untuk bersandar pada hikmat-Mu saat jalanku terasa tidak menentu. Di dalam nama Yesus, amin.';
    question = 'Di bagian hidupmu yang mana saat ini kamu paling perlu mempercayai bahwa Tuhan sedang bekerja mendatangkan kebaikan?';
    suggested = [{ reference: 'Yeremia 29:11', note: 'Rancangan damai sejahtera dan bukan rancangan kecelakaan untuk hari depan penuh harapan.' }];
  } else if (lower.includes('mazmur 23') || lower.includes('gembala') || lower.includes('takkan kekurangan')) {
    thought = 'Sebagai Gembala yang baik, Tuhan mengenal setiap kebutuhan jiwamu secara mendalam. Ia tidak hanya menyediakan kebutuhan lahiriah, tetapi juga menuntunmu ke padang yang tenang untuk memulihkan batinmu.';
    prayer = 'Tuhan Yesus, Engkaulah gembalaku. Lepaskan aku dari rasa kuatir akan hari esok dan ajarku beristirahat dalam naungan pemeliharaan-Mu yang sempurna. Amin.';
    question = 'Kapan terakhir kali kamu benar-benar melepaskan kepenatanmu dan membiarkan Tuhan menyegarkan jiwamu?';
    suggested = [{ reference: 'Yohanes 10:11', note: 'Akulah gembala yang baik. Gembala yang baik memberikan nyawanya bagi domba-dombanya.' }];
  } else if (lower.includes('cemas') || lower.includes('khawatir') || lower.includes('takut') || lower.includes('filipi 4')) {
    thought = 'Kekhawatiran sering kali berusaha merebut damai kita, namun Tuhan mengundang kita untuk menukar rasa cemas itu dengan ucapan syukur dan doa. Damai yang dari Allah sanggup melampaui segala akal manusia.';
    prayer = 'Bapa, kuserahkan segala kekhawatiran dan bebanku ke dalam tangan-Mu. Penuhi hatiku dengan damai sejahtera yang menenangkan seluruh pikiranku hari ini. Amin.';
    question = 'Apa satu kekhawatiran terbesar yang ingin kamu serahkan secara sadar ke dalam tangan Tuhan saat ini?';
    suggested = [{ reference: '1 Petrus 5:7', note: 'Serahkanlah segala kekuatiranmu kepada-Nya, sebab Ia yang memelihara kamu.' }];
  } else if (lower.includes('lelah') || lower.includes('berat') || lower.includes('matius 11')) {
    thought = 'Yesus mengundang siapa pun yang letih lesu untuk datang dan menemukan kelegaan. Kamu tidak dituntut untuk selalu tampil kuat sendirian di hadapan-Nya.';
    prayer = 'Tuhan, pulihkan kekuatanku yang rapuh. Berikan aku peristirahatan batin yang sejati dalam hadirat-Mu yang teduh. Amin.';
    question = 'Bagaimana kamu bisa meluangkan sejenak waktu hari ini untuk sekadar diam dan beristirahat di hadapan Tuhan?';
    suggested = [{ reference: 'Yesaya 40:29', note: 'Dia memberi kekuatan kepada yang lelah dan menambah semangat kepada yang tiada berdaya.' }];
  }

  return normalizeReflectionResponse({
    thought,
    prayer,
    reflectionQuestion: question,
    suggestedVerses: suggested,
  });
}

const SYSTEM_INSTRUCTION = `
Kamu adalah pendamping refleksi Firman Tuhan dan sahabat rohani di Faith Hub.
Tugasmu adalah memberikan panduan perenungan ayat Alkitab yang mendalam, hangat, menguatkan hati, dan mudah dipraktikkan dalam kehidupan sehari-hari.

IDENTITAS TEOLOGI & IMAN KRISTIANI:
- Faith Hub dikhususkan dan berpusat bagi yang percaya kepada Tuhan Yesus Kristus (Iman Kristiani).
- DILARANG KERAS menggunakan istilah atau ungkapan dari agama Islam atau non-Kristen lainnya (seperti Alhamdulillah, Bismillah, InsyaAllah, Astaghfirullah, dll).
- Seluruh doa, ucapan syukur, dan berkat berakar pada Tuhan Allah Bapa, Tuhan Yesus Kristus, dan Alkitab.

ATURAN FORMAT JSON (WAJIB JSON MURNI TANPA MARKDOWN):
{
  "thought": "Penjelasan renungan dan hikmat ayat secara mendalam, hangat, dan menguatkan hati (2-4 kalimat).",
  "prayer": "Doa peneguhan hati singkat yang tulus (2-3 kalimat).",
  "reflectionQuestion": "1 pertanyaan refleksi aplikatif untuk direnungkan hari ini.",
  "suggestedVerses": [
    {
      "reference": "Kitab Pasal:Ayat",
      "note": "Teks ayat atau catatan mengapa ayat ini selaras menguatkan perenungan."
    }
  ]
}
`;

export async function POST(req: NextRequest) {
  try {
    const { topic, verse, message, mode, struggle, desire, userAnswers, timeZone } = await req.json();
    const activeSystemInstruction = SYSTEM_INSTRUCTION + getFaithTemporalInfo(timeZone).promptBlock;
    const userInput = struggle || desire || userAnswers || message || topic || verse || '';

    if (!userInput.trim() && !verse) {
      return NextResponse.json({ error: 'Mohon tentukan ayat atau topik yang ingin kamu renungkan.' }, { status: 400 });
    }

    const userPrompt = `
Kebutuhan: ${mode === 'prayer' ? 'Didoakan / membawa pergumulan' : mode === 'curhat' ? 'Curhat rohani' : 'Merenungkan ayat Firman Tuhan'}.
Ayat / Perikop: "${verse || topic || ''}"
${struggle ? `\nPergumulan / Situasi yang sedang dihadapi pengguna:\n"${struggle}"` : ''}
${desire ? `\nHarapan / Kebutuhan batin pengguna dari firman ini:\n"${desire}"` : ''}
${userAnswers ? `\nJawaban Kuesioner Pengguna:\n"${userAnswers}"` : ''}
${userInput && !struggle && !userAnswers ? `\nInput perenungan: "${userInput}"` : ''}

INSTRUKSI KHUSUS:
1. Hubungkan secara spesifik firman Tuhan dari ayat tersebut dengan jawaban/pergumulan dan kebutuhan yang disampaikan pengguna di atas.
2. Analisis bagaimana janji Tuhan atau hikmat dalam ayat ini menjawab situasi nyata yang sedang dialami pengguna.
3. Berikan renungan ("thought") yang personal, mengena, dan aplikatif (bukan khotbah umum yang kaku).
4. Buatkan doa ("prayer") yang merefleksikan pergumulan dan harapan pengguna tersebut.
5. Berikan 1 pertanyaan refleksi ("reflectionQuestion") praktis agar pengguna dapat mengambil langkah nyata hari ini.

Buatkan respon dalam format JSON yang ditentukan.
`;

    // 1. Try Groq (Ultra-fast primary engine: ~600-800ms)
    const effectiveGroqKey = process.env.GROQ_API_KEY || GROQ_API_KEY;
    if (effectiveGroqKey) {
      for (const model of GROQ_MODELS) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${effectiveGroqKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: activeSystemInstruction },
                { role: 'user', content: userPrompt },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.7,
              max_tokens: 600,
            }),
            signal: AbortSignal.timeout(3500),
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const rawContent = data.choices?.[0]?.message?.content;
            if (rawContent) {
              const parsed = JSON.parse(rawContent);
              return NextResponse.json(normalizeReflectionResponse(parsed));
            }
          }
        } catch (e: any) {
          console.warn(`Groq model ${model} skipped (${e?.message})`);
        }
      }
    }

    // 2. Try Google Gemini with strict 3.5s timeout
    const effectiveGeminiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
    if (effectiveGeminiKey) {
      for (const model of GEMINI_MODELS) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveGeminiKey}`;
          const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${activeSystemInstruction}\n\n${userPrompt}` }],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
                maxOutputTokens: 600,
              },
            }),
            signal: AbortSignal.timeout(3500),
          });

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              return NextResponse.json(normalizeReflectionResponse(parsed));
            }
          }
        } catch (e: any) {
          console.warn(`Gemini model ${model} skipped (${e?.message})`);
        }
      }
    }

    // 3. Fallback to instant, empathetic reflection companion
    return NextResponse.json(getOfflineCompanionResponse(userInput, verse));
  } catch (error) {
    console.error('Faith Companion AI error:', error);
    return NextResponse.json(getOfflineCompanionResponse(''));
  }
}
