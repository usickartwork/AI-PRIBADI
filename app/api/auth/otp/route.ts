import { NextResponse } from "next/server";

// Penyimpanan OTP sementara (email -> { otp, expiresAt })
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json({ success: false, error: "Email diperlukan." }, { status: 400 });
    }

    // ─── 1. KIRIM / GENERATE KODE OTP ──────────────────────────────────────────
    if (action === "send") {
      // Buat 6 digit kode OTP acak
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = Date.now() + 5 * 60 * 1000; // Berlaku 5 menit

      otpStore.set(normalizedEmail, { otp: generatedOtp, expiresAt });

      return NextResponse.json({
        success: true,
        otp: generatedOtp,
        message: "Kode OTP verifikasi berhasil dibuat.",
      });
    }

    // ─── 2. VERIFIKASI KODE OTP ─────────────────────────────────────────────
    if (action === "verify") {
      const record = otpStore.get(normalizedEmail);

      if (!record) {
        return NextResponse.json(
          { success: false, error: "Kode OTP belum diminta atau sudah kedaluwarsa. Silakan kirim ulang." },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(normalizedEmail);
        return NextResponse.json(
          { success: false, error: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru." },
          { status: 400 }
        );
      }

      const inputCode = String(code || "").trim();
      if (record.otp !== inputCode) {
        return NextResponse.json(
          { success: false, error: "Kode OTP salah. Periksa kembali 6-digit kode verifikasi Anda." },
          { status: 400 }
        );
      }

      // Berhasil diverifikasi: hapus OTP dari antrian agar tidak bisa dipakai ulang
      otpStore.delete(normalizedEmail);
      return NextResponse.json({ success: true, message: "Kode OTP valid." });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenal." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server saat memproses OTP." },
      { status: 500 }
    );
  }
}
