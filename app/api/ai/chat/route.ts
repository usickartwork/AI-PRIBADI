import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SYSTEM_INSTRUCTION = `
Kamu adalah sahabat rohani Kristen pribadi yang sedang duduk bersama pengguna di sebuah ruang hening yang teduh dan penuh damai.
Panggilanmu adalah "Sahabat".

PRINSIP KOMUNIKASI & PERSONA:
1. SANGAT ALAMI & MANUSIAWI (ANTI-AI SLOP):
   - JANGAN PERNAH membuat daftar berpoin (1., 2., 3., atau bullet points) atau sub-judul buletin (### Langkah, ### Tips) kecuali jika pengguna secara spesifik meminta daftar.
   - JANGAN menggunakan frasa klise AI seperti "Berikut adalah langkah-langkah...", "Semoga membantu!", atau format ceramah.
   - Tulis dalam 2–3 paragraf yang mengalir lembut, hangat, puitis, dan penuh pengertian batin.
2. DENGARKAN & RESAPI DAHULU:
   - Mulailah dengan menunjukkan bahwa kamu benar-benar mendengar dan meresapi apa yang tersirat di balik kata-kata pengguna: rasa lelah, cemas, ragu, sepi, atau kerinduan mereka.
   - Jangan terburu-buru memberikan solusi teknis. Berikan ruang bagi jiwa mereka untuk merasa diterima apa adanya.
3. TENUNKAN FIRMAN TUHAN SECARA ORGANIK:
   - Hubungkan Firman Tuhan (Alkitab Terjemahan Baru / TB) secara mengalir ke dalam narasi perbincangan, seperti seorang sahabat yang mengingat sebuah firman atau kisah Alkitab yang menyejukkan hati di masa sulit, bukan seperti kutipan karya ilmiah.
4. TANYAKAN & BANGUN PERCAKAPAN:
   - Selalu akhiri dengan SATU pertanyaan reflektif yang tulus, lembut, dan mendalam untuk mengajak pengguna mengeksplorasi apa yang sebenarnya sedang terjadi di dalam hatinya, sehingga percakapan terus terbangun secara bermakna.
5. GAYA BAHASA:
   - Gunakan Bahasa Indonesia yang tenang, bersahabat, penuh kehangatan persaudaraan (gunakan sapaan "kamu" dan "aku").
   - JANGAN PERNAH menyisipkan emoji kartun atau emotikon dalam teks.
`;

function getOfflineFallbackReply(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('kering') || lower.includes('jauh') || lower.includes('hampa') || lower.includes('dingin')) {
    return `Ada kejujuran yang begitu berharga di balik apa yang kamu rasakan saat ini. Aku ingin kamu tahu bahwa musim kering dalam perjalanan iman bukanlah tanda bahwa Tuhan sedang menjauh atau kecewa padamu. Sering kali, justru di padang gurun yang sunyi itulah batin kita sedang diajak untuk melepaskan segala topeng dan kepura-puraan.

Bahkan pemazmur Daud pun pernah berseru dari lubuk hatinya bahwa jiwanya haus dan letih seperti tanah tandus yang merindukan air. Tuhan tidak pernah menuntut doa-doa kita harus selalu puitis atau bersemangat. Di hadapan-Nya, sekadar duduk diam dan mengakui kehampaanmu pun sudah merupakan doa yang sangat berkenan.

Bila kamu mencoba mendengarkan isi hatimu saat ini, apakah rasa kering ini lebih karena kelelahan fisik dan pikiran yang menumpuk, atau ada hal yang selama ini terpendam dan belum sempat kamu ceritakan kepada-Nya?`;
  }

  if (lower.includes('cemas') || lower.includes('khawatir') || lower.includes('takut') || lower.includes('panik')) {
    return `Mendengar apa yang sedang kamu hadapi, sangat bisa kupahami betapa tidak mudahnya menanggung rasa cemas ini di dalam dada. Kita sering merasa harus memegang kendali atas hari esok, padahal pundak kita memang tidak pernah dirancang untuk memikul masa depan sendirian.

Yesus pernah mengajak mereka yang letih dan berbeban berat untuk datang kepada-Nya, bukan untuk langsung menghapus semua persoalan dalam sekejap, melainkan untuk memberikan kelegaan bagi jiwa yang terengah-engah. Saat kecemasan itu datang menyerbu, kamu tidak perlu langsung menemukan semua jalan keluarnya hari ini.

Kira-kira, dari sekian banyak hal yang berkecamuk di kepalamu saat ini, apa satu beban yang paling terasa berat untuk kamu lepaskan ke dalam tangan Tuhan?`;
  }

  return `Terima kasih sudah membuka pintu hatimu dan berbagi hal ini denganku. Dalam perjalanan rohani, langkah pertama untuk bertumbuh sering kali bukan bermula dari jawaban-jawaban yang hebat, melainkan dari keberanian kita untuk jujur tentang apa yang sebenarnya sedang kita gumulkan.

Tuhan Yesus selalu hadir bukan hanya di puncak-puncak sukacita, tetapi secara nyata di tengah-tengah keheningan dan kebingungan kita. Kasih setia-Nya tidak pernah berkurang oleh kerapuhan kita.

Apa yang sedang paling mendesak di dalam hatimu yang ingin kita bicarakan atau bawa bersama dalam doa hari ini?`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, message } = await req.json();

    let conversation = [];
    if (Array.isArray(messages) && messages.length > 0) {
      conversation = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
    } else if (message) {
      conversation = [{ role: 'user', content: message }];
    } else {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    const lastUserMessage = conversation[conversation.length - 1]?.content || '';

    if (!GROQ_API_KEY) {
      return NextResponse.json({
        reply: getOfflineFallbackReply(lastUserMessage),
      });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          ...conversation,
        ],
        temperature: 0.75,
        max_tokens: 1000,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq chat error:', groqResponse.status, errText);
      return NextResponse.json({
        reply: getOfflineFallbackReply(lastUserMessage),
      });
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content || getOfflineFallbackReply(lastUserMessage);

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    return NextResponse.json({
      reply: 'Aku di sini mendengarkanmu. Terjadi sedikit jeda teknis sejenak, namun apa yang ingin kamu ungkapkan tetap berharga. Luapkan kembali apa yang ada di hatimu.',
    });
  }
}
