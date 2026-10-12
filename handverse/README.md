# HandVerse — Real-Time Hand Tracking & 3D Interactive Camera Experiment

Pengalaman interaktif kamera 3D berbasis webcam dan kamera HP yang memungkinkan pengguna mengendalikan objek 3D secara real-time menggunakan gerakan tangan tanpa API berbayar dan tanpa server upload.

---

## 🚀 Fitur Utama

1. **Camera API & Permissions**:
   - Deteksi kamera depan (*User*) dan belakang (*Environment*).
   - Penanganan izin eksplisit dan cleanup track kamera secara bersih saat berhenti.
   - Pilihan ganti kamera (*Flip Camera*) jika perangkat memiliki lebih dari 1 kamera.

2. **AI Hand Tracking (MediaPipe Tasks Vision)**:
   - Pelacakan 21 hand landmarks secara lokal di browser dengan akselerasi GPU (fallback otomatis ke CPU jika GPU tidak didukung).
   - Deteksi hingga 2 tangan secara bersamaan.
   - Overlay skeleton bercahaya (*cyan & electric violet*).

3. **Gesture Recognition (`gestureRecognizer.ts`)**:
   - Pengenalan 6 kelas gestur utama: `Open Palm`, `Fist`, `Pinch`, `Peace Sign`, `Pointing`, dan `Unknown`.
   - Normalisasi jarak landmark terhadap skala ukuran tangan (bukan piksel absolut).
   - *Temporal smoothing buffer* untuk mencegah flickering antar gestur.

4. **3 Eksperimen 3D Interaktif (Three.js)**:
   - **✦ Orb Control**: Bola energi holografik melayang di atas telapak tangan dengan cincin orbital. Renggangan jari memodifikasi diameter bola.
   - **⚡ Gesture Particles**: 1000 partikel nebula yang meledak menyebar saat telapak tangan dibuka, dan memadat menjadi inti saat tangan mengepal.
   - **💎 Hologram Object**: Kristal octahedron sci-fi yang berputar dengan sapuan tangan dan mengaktifkan **Grab Mode** saat gestur *Pinch* (cubit jempol & telunjuk).

5. **Antarmuka Glassmorphism Responsif**:
   - Real-time FPS counter, status delegasi AI (GPU/CPU), dan badge nama gestur aktif.
   - Tata letak responsif untuk MacBook desktop dan layar smartphone portrait/landscape.

---

## 🛠️ Instalasi & Menjalankan Aplikasi

Pastikan Node.js (v18+) telah terpasang di sistem Anda.

```bash
# 1. Masuk ke direktori handverse
cd handverse

# 2. Instal dependensi
npm install

# 3. Jalankan server pengujian lokal
npm run dev
```

Aplikasi akan berjalan di:
- **Local (MacBook/PC)**: `http://localhost:5173`
- **Network (Smartphone)**: `http://<IP-Lokal-Anda>:5173`

---

## 📱 Petunjuk Pengujian

### 1. Pengujian di MacBook / Desktop (Chrome / Safari):
- Buka `http://localhost:5173`.
- Klik tombol **"Start Experiment"**.
- Berikan izin kamera saat browser meminta persetujuan.
- Rentangkan telapak tangan di depan webcam: perhatikan landmark skeleton dan objek 3D muncul seketika mengikuti tangan Anda!

### 2. Pengujian di Smartphone (iOS Safari / Android Chrome):
- Pastikan smartphone terhubung ke jaringan Wi-Fi yang sama dengan MacBook.
- Akses alamat Network (misal: `http://192.168.1.x:5173`).
  > **Catatan Kamera**: Sebagian browser mobile membatasi `getUserMedia` hanya pada koneksi HTTPS atau `localhost`. Untuk pengujian langsung di HP, deploy ke Vercel/Netlify atau gunakan tunneling HTTPS seperti `ngrok http 5173`.

---

## 📦 Script Perintah

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan Vite dev server dengan dukungan host lokal |
| `npm run build` | Kompilasi TypeScript check dan build produksi Vite |
| `npm run preview` | Menjalankan preview build produksi secara lokal |

