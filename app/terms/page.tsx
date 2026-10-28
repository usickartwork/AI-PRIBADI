import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ketentuan Layanan One Mind",
  description: "Syarat dan Ketentuan Layanan Penggunaan Platform One Mind.",
  alternates: {
    canonical: "https://onemind.web.id/terms",
  },
};

export default function TermsOfServicePage() {
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
            Ketentuan Layanan (Terms of Service)
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Terakhir diperbarui: 16 Oktober 2026
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Penerimaan Ketentuan</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Selamat datang di Usick One (dapat diakses di{" "}
            <a href="https://onemind.web.id" className="text-emerald-400 underline">
              onemind.web.id
            </a>
            ). Dengan mendaftar, mengakses, atau menggunakan layanan kami, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan Layanan ini. Jika Anda tidak menyetujui ketentuan ini, Anda dipersilakan untuk tidak menggunakan platform kami.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Deskripsi Layanan</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Usick One adalah platform produktivitas dan AI workspace yang menyediakan fitur asisten percakapan cerdas, coding assistance, perencana jadwal (Schedule), dan fitur kreatif lainnya untuk mempermudah produktivitas pengguna.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Akun dan Keamanan</h2>
          <ul className="list-disc list-inside text-sm leading-relaxed text-slate-300 space-y-1">
            <li>Anda bertanggung jawab menjaga kerahasiaan kredensial akun dan aktivitas yang terjadi di bawah akun Anda.</li>
            <li>Anda wajib memberikan informasi pendaftaran yang akurat dan sah.</li>
            <li>Segera beritahukan kepada kami apabila Anda mencurigai adanya penggunaan tidak sah atas akun Anda.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Integrasi Layanan Pihak Ketiga (Google Calendar)</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Platform kami menyediakan integrasi opsional dengan Google Calendar API agar jadwal yang Anda buat di Usick One dapat disinkronkan secara otomatis ke Google Calendar milik Anda.
          </p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-slate-300 space-y-1">
            <li>Penggunaan integrasi Google Calendar tunduk pada kebijakan privasi dan ketentuan Google API.</li>
            <li>Anda dapat menghubungkan dan memutuskan sambungan akun Google Anda kapan saja melalui tab Schedule.</li>
            <li>Data yang disinkronkan hanya mencakup event kalender yang dibuat atau dikelola melalui fitur Schedule Usick One.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Penggunaan yang Dilarang</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Pengguna dilarang menggunakan platform Usick One untuk:
          </p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-slate-300 space-y-1">
            <li>Melakukan tindakan melawan hukum, penipuan, atau pelanggaran hak pihak ketiga.</li>
            <li>Mencoba merusak, membebani secara berlebihan, atau mengganggu integritas server dan jaringan kami.</li>
            <li>Menyalahgunakan API atau melakukan rekayasa balik (reverse engineering) yang tidak diizinkan.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Batasan Tanggung Jawab</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Layanan Usick One disediakan &ldquo;sebagaimana adanya&rdquo; (*as is*). Kami berusaha memberikan uptime dan akurasi layanan terbaik, namun tidak menjamin bahwa layanan akan selalu bebas gangguan secara permanen dari faktor eksternal pihak ketiga (seperti keterbatasan API pihak ketiga atau gangguan jaringan).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Perubahan Ketentuan</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Kami dapat memperbarui Ketentuan Layanan ini dari waktu ke waktu. Pembaruan akan berlaku efektif sejak tanggal dipublikasikan di halaman ini.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Hubungi Kami</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Untuk pertanyaan atau informasi lebih lanjut terkait Ketentuan Layanan ini, silakan hubungi kami melalui email:{" "}
            <a href="mailto:support@onemind.web.id" className="text-emerald-400 underline">
              support@onemind.web.id
            </a>
            .
          </p>
          <div className="pt-4 border-t border-slate-800 flex gap-4 text-xs text-slate-400">
            <Link href="/privacy" className="hover:text-emerald-400 underline">
              Kebijakan Privasi (Privacy Policy)
            </Link>
            <Link href="/" className="hover:text-emerald-400 underline">
              Beranda Usick One
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
