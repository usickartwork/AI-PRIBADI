/**
 * lib/usickKnowledge.ts
 *
 * Sumber pengetahuan produk statis resmi Usick One (onemind.web.id).
 * Digunakan sebagai konteks tambahan aditif untuk Chat AI ketika pengguna bertanya
 * mengenai identitas, fitur, tab, cara penggunaan, paket langganan, atau batasan Usick One.
 *
 * Pembaruan informasi dilakukan secara manual sesuai instruksi pengembang.
 */

export const USICK_ONE_PRODUCT_KNOWLEDGE = `
# PANDUAN & PENGETAHUAN PRODUK RESMI: USICK ONE

## 1. Identitas & Tujuan Usick One
- **Nama Produk**: Usick One
- **Alamat Website / Domain**: onemind.web.id
- **Pengembang / Kreator**: Usick Artwork
- **Definisi & Tujuan**: Usick One adalah platform AI all-in-one workspace tingkat lanjut yang menggabungkan asisten kecerdasan buatan multi-model (flagship), studio pemrograman berbasis AI (Code), manajemen jadwal cerdas terintegrasi (Schedule), studio kreasi & terjemahan visual (Image), komunikasi privat antar pengguna (Messages), streaming musik & lirik (Music), serta catatan ide terintegrasi (Notebook/Catatan).
- **Filosofi Desain**: Mengutamakan kecepatan, fleksibilitas multi-tasking tanpa berpindah aplikasi, desain antarmuka bersih (Dark & Light mode adaptif), serta pengalaman pengguna yang mulus.

---

## 2. Daftar Tab & Fitur yang Tersedia

### A. Tab "Chats" (Obrolan AI Flagship)
- **Fungsi**: Ruang obrolan utama dengan kecerdasan buatan untuk diskusi, pemecahan masalah, penulisan konten, analisis data, ideasi, dan tanya jawab.
- **Dukungan Multimodal**: Pengguna dapat mengirim pesan teks, mengunggah foto/gambar (dari file atau kamera), serta melampirkan file dokumen.
- **Pilihan Model AI**:
  - *Usick One Flagship* (default): Model AI flagship bawaan yang cepat, cerdas, berwawasan luas, dan gratis selamanya bagi seluruh pengguna.
  - *Model AI Eksternal Pro*: Beragam model frontier dunia seperti Claude, GPT, Gemini Pro, DeepSeek, Qwen, dll. (tersedia untuk pengguna paket Pro).
- **Input & Output Suara**:
  - Voice Recording: Pengguna dapat berbicara langsung melalui mikrofon untuk input pesan.
  - Read Aloud / Voice Synthesis: AI dapat membacakan jawabannya dengan audio yang natural.
- **Web Search Real-Time**: Opsi toggle pencarian web langsung untuk mendapatkan informasi, berita, dan fakta terkini dari internet beserta sitasi link sumber.
- **Tingkat Penalaran (Effort Level)**:
  - *Faster*: Jawaban super cepat, padat, ringkas, dan langsung ke inti (hemat waktu).
  - *Balanced*: Keseimbangan optimal antara kecepatan dan kelengkapan penjelasan.
  - *Max (Pro)*: Analisis komprehensif, mendalam, dan penalaran tingkat tinggi.
- **Fitur Interaksi Pesan**:
  - Edit pesan yang sudah dikirim (dan AI akan mengenerate ulang respons berdasarkan pesan hasil edit).
  - Regenerate respons (meminta jawaban baru).
  - Salin pesan (copy to clipboard).
  - Feedback like / dislike.
- **Share Project (Bagikan Percakapan)**:
  - Pengguna dapat membagikan sesi obrolan kepada orang lain melalui tautan publik unik (format: \`/share/[token]\`).
  - Penerima tautan dapat membaca percakapan secara rapi tanpa perlu login.
- **Riwayat Obrolan (Recent Chats)**:
  - Obrolan tersimpan rapi di panel samping (sidebar).
  - Mendukung penyematan chat penting (*Pin*), pencarian riwayat obrolan, serta penghapusan chat.

### B. Tab "Code" (Ngoding Pakai AI - Studio PRD)
- **Fungsi**: Lingkungan pengembangan web (IDE) interaktif langsung di browser dengan bantuan asisten coding AI.
- **Fitur Utama**:
  - File Explorer & Multi-file Editor: Pengguna dapat membuat, membuka, dan mengedit file HTML, CSS, JavaScript, TypeScript, dan React.
  - AI Code Assistant: Membantu merancang arsitektur proyek, menulis kode dari nol, memperbaiki bug (debugging), dan menyempurnakan fitur.
  - Live Interactive Preview: Hasil koding dapat langsung dijalankan dan dilihat pratinjaunya secara live di panel sebelah kanan.
  - Ekspor Proyek: Mendukung pengunduhan file kode untuk pengembangan lokal.
- **Sistem Kuota**: Menggunakan saldo kuota khusus bernama **Code Credits** (terpisah dari AI Credits).

### C. Tab "Schedule" (Smart Schedule & Pengingat)
- **Fungsi**: Manajemen jadwal harian, agenda penting, dan daftar tugas (to-do list).
- **AI Natural Language Parser**:
  - Pengguna cukup mengetik jadwal dalam bahasa sehari-hari (contoh: *"Besok jam 9 pagi rapat evaluasi sprint"* atau *"Ingatkan beli susu nanti malam jam 8"*).
  - AI secara otomatis mengekstrak judul, tanggal, jam, dan kategori jadwal tanpa perlu mengatur kalender secara manual.
- **Integrasi Google Calendar**:
  - Tersedia sinkronisasi resmi dua arah (OAuth) dengan akun Google Calendar pengguna.
  - Jadwal yang dibuat di Usick One dapat langsung disinkronkan ke Google Calendar dan sebaliknya.
- **Pengingat & Notifikasi**: Mendukung pengingat berbasis notifikasi browser tepat waktu.
- **Batasan**: Paket Free mendukung maksimal 3 jadwal aktif, sedangkan paket Pro mendukung hingga 50 jadwal aktif.

### D. Tab "Image" (Studio Gambar AI - Fitur PRO)
- **Fungsi**: Studio kreasi visual kecerdasan buatan.
- **Fitur Utama**:
  - *Image Generator*: Membuat gambar atau ilustrasi artistik berkualitas tinggi berdasarkan deskripsi teks (prompt) yang diberikan pengguna.
  - *Image Translator*: Menganalisis dan menerjemahkan teks visual atau makna di dalam gambar secara cerdas.
- **Akses**: Fitur eksklusif untuk pengguna paket Usick One Pro.

### E. Tab "Messages" (Chat Pribadi Antar Teman - Fitur PRO)
- **Fungsi**: Platform pengiriman pesan instan (direct messaging) privat antar-sesama pengguna Usick One.
- **Fitur Utama**:
  - Chat teks dan pertukaran pesan secara realtime.
  - Tambah teman menggunakan ID atau identifier pengguna yang terdaftar.
  - Pengelolaan kontak (blokir / buka blokir) dan indikator status baca (*read receipts*).
  - Antarmuka pensinyalan panggilan suara & video antarteman.
- **Akses**: Fitur eksklusif untuk pengguna paket Usick One Pro.

### F. Tab "Music" (Music One Player & Connect - Fitur PRO)
- **Fungsi**: Ekosistem pemutar musik streaming dan radio digital terintegrasi di dalam aplikasi.
- **Fitur Utama**:
  - Pemutar musik internal (Music One Player) dengan stasiun radio kurasi.
  - Pencarian lagu, album, dan artis musik.
  - Lirik lagu tersinkronisasi realtime (*synchronized scrolling lyrics*).
  - *Music Connect*: Integrasi akun Spotify dan Apple Music pengguna untuk memutar lagu dan playlist pribadi langsung dari Usick One.
- **Akses**: Fitur eksklusif untuk pengguna paket Usick One Pro.

### G. Tab "Catatan" (Notebook)
- **Fungsi**: Buku catatan digital untuk menuliskan ide kilat, draf dokumen, ringkasan riset, dan catatan penting.
- **Fitur Utama**:
  - Editor catatan yang responsif dan mudah digunakan.
  - Tersimpan dan tersinkronisasi secara aman di database bagi pengguna yang telah login.
  - Fitur pencarian catatan untuk menemukan rekaman ide dengan cepat.

*(Catatan terkait fitur Game 3D & Faith Hub: Komponen teknologinya sudah tersedia di codebase, namun di navigasi sidebar saat ini sengaja disembunyikan agar pengguna fokus pada fitur-fitur produktivitas utama di atas).*

---

## 3. Sistem Langganan & Saldo Kredit (Pricing)

### A. Paket FREE (Gratis Selamanya - Rp0)
- **AI Credits**: 10.000 AI Credits per hari (reset otomatis setiap hari).
- **Code Credits**: 50 Code Credits per hari untuk koding di Tab Code.
- **Smart Schedule**: Maksimal 3 jadwal aktif secara bersamaan.
- **Akses Model**: Model bawaan Usick One Flagship.
- **Mode Penalaran**: Mendukung mode Faster dan Balanced.
- **Akses Tab**: Tab Chats, Tab Code, Tab Schedule, dan Tab Catatan (Notebook).
- **Fitur Tambahan**: Pencarian web real-time dan input suara.

### B. Paket PRO (Rp49.000 / Bulan)
- **AI Credits**: 100.000 AI Credits per hari (reset otomatis setiap hari).
- **Code Credits**: 200 Code Credits per hari untuk koding di Tab Code.
- **Smart Schedule**: Maksimal 50 jadwal aktif secara bersamaan.
- **Akses Model**: Seluruh model AI eksternal unggulan (Claude, GPT, Gemini, DeepSeek, Qwen).
- **Mode Penalaran**: Akses penuh ke mode Max (penalaran mendalam & komprehensif).
- **Membuka Semua Tab Pro**: Akses penuh ke Tab Image, Tab Messages, dan Tab Music.
- **Keunggulan Ekstra**: Prioritas kecepatan server, antrean pemrosesan lebih cepat, dan akses awal ke fitur baru.

### C. Paket ULTRA (Coming Soon)
- Kuota ekstra tinggi (500.000 AI Credits/hari, 1.000 Code Credits/hari, unlimited schedule) yang saat ini berstatus segera hadir (*Coming Soon*).

---

## 4. Integrasi Layanan Eksternal Resmi (Tingkat Informasi Produk)
- **Supabase**: Mengelola keamanan autentikasi pengguna, penyimpanan data profil, riwayat chat, sinkronisasi jadwal, dan pesan teman.
- **Google Calendar**: Integrasi resmi via OAuth untuk sinkronisasi agenda kalender pengguna secara langsung.
- **Spotify & Apple Music**: Integrasi pemutaran musik pada fitur Music Connect.
- **DuckDuckGo & SearXNG**: Mesin penelusuran fakta dan berita internet untuk fitur Web Search.
- **Midtrans**: Gerbang pembayaran resmi dan aman untuk pemrosesan langganan Usick One Pro.

---

## 5. Kemampuan, Keunggulan & Batasan Fitur
- **Kelebihan Utama**: Alur kerja terpadu (chatting, koding, mengatur jadwal, mendengarkan musik, dan mencatat ide tanpa harus membuka banyak tab terpisah).
- **Batasan Akun Free**:
  - Saldo kredit harian (10.000 AI Credits dan 50 Code Credits) akan habis jika digunakan intensif dan baru terisi kembali saat reset harian.
  - Tab Image, Messages, Music, model AI eksternal, dan mode Max hanya dapat dibuka dengan upgrade ke Pro.
  - Eksekusi kode interaktif dilakukan di Tab Code Workspace, bukan dieksekusi langsung di jendela chat reguler.
- **Keamanan & Privasi**: Usick One tidak membagikan data pribadi pengguna kepada pihak ketiga yang tidak berwenang.
`;

/**
 * Daftar kata kunci / frasa untuk mendeteksi apakah pertanyaan pengguna
 * relevan dengan informasi produk, fitur, atau panduan Usick One.
 */
const USICK_RELEVANT_PATTERNS: RegExp[] = [
  /\busick(\s*one)?\b/i,
  /\bonemind(\.web\.id)?\b/i,
  /\b(website|web|aplikasi|app|platform)\s+(ini|usick)\b/i,
  /\bfitur(\s*(apa\s*aja|apa\s*saja|yang\s*ada|di\s*sini|tersedia))\b/i,
  /\btab(\s*(apa\s*aja|chats?|code|schedule|image|messages?|music|catatan|notebook))\b/i,
  /\b(cara\s*(pakai|menggunakan|guna)|fungsi)\s+(tab|fitur|schedule|code|music|image|messages?|usick)\b/i,
  /\b(paket|langganan|harga|biaya|upgrade)\s*(pro|free|ultra|usick)?\b/i,
  /\b(ai|code)\s*credits?\b/i,
  /\bsaldo\s*(kredit|token|ai|code)\b/i,
  /\bgoogle\s*calendar\s*(sync|integrasi)?\b/i,
  /\bmusic\s*connect\b/i,
  /\bshare\s*project\b/i,
  /\bsiapa\s*(pembuat|developer|kreator|yang\s*bikin)\s*(web|aplikasi|usick)\b/i,
  /\bapa\s*itu\s*usick(\s*one)?\b/i,
  /\bbisa\s*(ngapain\s*aja|apa\s*saja)\s*(di\s*sini|web\s*ini|aplikasi\s*ini)\b/i,
];

/**
 * Memeriksa apakah prompt pengguna relevan dengan produk Usick One.
 * Jika relevan, mengembalikan teks konteks pengetahuan produk Usick One.
 * Jika tidak relevan, mengembalikan null (sehingga tidak mengubah perilaku chat umum).
 */
export function getUsickOneKnowledgeContext(userQuery: string): string | null {
  if (!userQuery || typeof userQuery !== "string") {
    return null;
  }

  const queryTrimmed = userQuery.trim().toLowerCase();
  if (queryTrimmed.length === 0) {
    return null;
  }

  const isRelevant = USICK_RELEVANT_PATTERNS.some((pattern) => pattern.test(queryTrimmed));

  if (!isRelevant) {
    return null;
  }

  return (
    `\n\n[Sumber Pengetahuan Produk Resmi Usick One]:\n` +
    USICK_ONE_PRODUCT_KNOWLEDGE.trim() +
    `\n\nATURAN MENJAWAB:\n` +
    `1. Gunakan informasi resmi Usick One di atas jika pengguna bertanya mengenai Usick One, website ini, fitur-fitur, tab yang tersedia, cara penggunaan, paket langganan, atau batasannya.\n` +
    `2. Jawab dengan ramah, jelas, akurat, dan percaya diri sesuai data yang tercantum di atas.\n` +
    `3. Jangan mengarang fitur yang tidak tercantum dalam dokumentasi resmi di atas.`
  );
}
