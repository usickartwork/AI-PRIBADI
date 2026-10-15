import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — Usick One",
  description: "Kebijakan Privasi Usick One dan Penggunaan Google API User Data.",
  alternates: {
    canonical: "https://onemind.web.id/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl space-y-8">
        <div>
          <Link
            href="/"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1 mb-4"
          >
            ← Kembali ke Usick One
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Kebijakan Privasi Usick One
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Terakhir diperbarui: 16 Oktober 2026
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Pendahuluan</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Usick One (tersedia di{" "}
            <a href="https://onemind.web.id" className="text-emerald-400 underline">
              onemind.web.id
            </a>
            ) menghargai dan berkomitmen melindungi privasi data setiap pengguna. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan platform kami, termasuk saat Anda menggunakan integrasi Google Calendar.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Informasi yang Kami Kumpulkan</h2>
          <ul className="list-disc list-inside text-sm leading-relaxed text-slate-300 space-y-1">
            <li>
              <strong>Informasi Akun:</strong> Alamat email dan identitas profil yang Anda gunakan saat mendaftar.
            </li>
            <li>
              <strong>Data Jadwal (Schedule):</strong> Judul jadwal, waktu mulai, waktu selesai, durasi, zona waktu, dan pengingat yang Anda buat di fitur Schedule.
            </li>
            <li>
              <strong>Kredensial OAuth:</strong> Token otorisasi Google OAuth yang dienkripsi secara aman saat Anda menghubungkan Google Calendar.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            3. Penggunaan Data Google API (Google Calendar)
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Fitur integrasi Google Calendar di Usick One menggunakan Google Calendar API resmi dengan scope izin minimum yang diperlukan (<code>https://www.googleapis.com/auth/calendar.events</code>).
          </p>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 space-y-2">
            <p className="font-medium text-emerald-300">Prinsip Penggunaan Data Google:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>
                <strong>Tujuan Eksklusif:</strong> Akses Google Calendar hanya digunakan untuk membuat, memperbarui, atau menghapus event kalender yang Anda buat melalui tab Schedule Usick One.
              </li>
              <li>
                <strong>Tanpa Akses Kontak atau Email:</strong> Kami tidak pernah membaca email, daftar kontak, atau data Google lain di luar kalender yang Anda izinkan.
              </li>
              <li>
                <strong>Tidak Dijual atau Dibagikan:</strong> Kami tidak pernah menjual, menyewakan, atau membagikan data pengguna Google kepada pihak ketiga atau pengiklan mana pun.
              </li>
              <li>
                <strong>Tidak Digunakan untuk Melatih Model AI:</strong> Data kalender Anda tidak pernah digunakan untuk melatih model kecerdasan buatan (AI/LLM).
              </li>
              <li>
                <strong>Kepatuhan Kebijakan Pengguna Google API:</strong> Penggunaan dan transfer informasi yang diterima dari Google API oleh Usick One tunduk pada{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline"
                >
                  Google API Services User Data Policy
                </a>
                , termasuk persyaratan <em>Limited Use</em>.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Keamanan dan Penyimpanan Data</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Kredensial sensitif seperti Google OAuth Refresh Token dienkripsi menggunakan standar enkripsi tingkat militer (<strong>AES-256-GCM</strong>) di sisi server sebelum disimpan ke database. Kredensial tidak pernah diekspos ke browser atau disimpan di local storage perangkat Anda.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Pencabutan Izin & Penghapusan Data</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Anda memiliki kontrol penuh atas akun dan data Anda:
          </p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-slate-300 space-y-1">
            <li>
              Anda dapat memutuskan koneksi Google Calendar kapan saja melalui menu pengaturan Schedule di Usick One.
            </li>
            <li>
              Anda juga dapat mencabut akses kapan saja melalui halaman izin Google Anda di{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline"
              >
                myaccount.google.com/permissions
              </a>
              .
            </li>
            <li>
              Saat koneksi diputus, token yang tersimpan di server kami akan dihapus secara permanen.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Kontak Kami</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini atau pengelolaan data Anda, silakan hubungi tim kami di{" "}
            <a href="mailto:support@onemind.web.id" className="text-emerald-400 underline">
              support@onemind.web.id
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
