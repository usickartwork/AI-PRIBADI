import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Penyimpanan OTP sementara di memory server (email -> { otp, expiresAt })
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Helper pengiriman email via Gmail SMTP (Nodemailer)
async function sendViaGmail(user: string, pass: string, toEmail: string, otp: string) {
  const cleanPass = pass.replace(/\s+/g, "");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass: cleanPass,
    },
  });

  await transporter.sendMail({
    from: `"Usick AI" <${user}>`,
    to: toEmail,
    subject: `Kode Verifikasi OTP: ${otp} - Usick AI`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px 20px; text-align: center; border-radius: 16px;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">Usick V1 Intelligence</h1>
        <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px;">Berikut adalah kode verifikasi OTP untuk menyelesaikan pendaftaran akun Anda:</p>
        <div style="display: inline-block; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 16px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #34d399; font-family: monospace; margin-bottom: 24px;">
          ${otp}
        </div>
        <p style="color: #71717a; font-size: 12px; line-height: 1.5;">Kode verifikasi ini berlaku selama 5 menit.<br/>Masukkan kode ini pada aplikasi untuk mengaktifkan akun Anda.</p>
      </div>
    `,
  });
}

// Helper pengiriman email via Resend jika RESEND_API_KEY diset
async function sendViaResend(apiKey: string, toEmail: string, otp: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Usick AI <onboarding@resend.dev>",
      to: [toEmail],
      subject: `Kode Verifikasi OTP: ${otp} - Usick AI`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px 20px; text-align: center; border-radius: 16px;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">Usick V1 Intelligence</h1>
          <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px;">Berikut adalah kode verifikasi OTP untuk menyelesaikan pendaftaran akun Anda:</p>
          <div style="display: inline-block; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 16px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #34d399; font-family: monospace; margin-bottom: 24px;">
            ${otp}
          </div>
          <p style="color: #71717a; font-size: 12px; line-height: 1.5;">Kode verifikasi ini berlaku selama 5 menit.<br/>Masukkan kode ini pada aplikasi untuk mengaktifkan akun Anda.</p>
        </div>
      `,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Gagal mengirim email via Resend.");
  }
  return data;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json({ success: false, error: "Alamat email diperlukan." }, { status: 400 });
    }

    // ─── 1. KIRIM KODE OTP KE EMAIL PENGGUNA ────────────────────────────────────
    if (action === "send") {
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 Menit

      const gmailUser = process.env.GMAIL_USER?.trim();
      const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
      const resendKey = process.env.RESEND_API_KEY?.trim();

      if (!resendKey && (!gmailUser || !gmailPass)) {
        return NextResponse.json(
          {
            success: false,
            error: "Konfigurasi email belum lengkap. Harap isi GMAIL_USER & GMAIL_APP_PASSWORD atau RESEND_API_KEY di Vercel.",
          },
          { status: 500 }
        );
      }

      try {
        if (gmailUser && gmailPass) {
          await sendViaGmail(gmailUser, gmailPass, normalizedEmail, generatedOtp);
        } else if (resendKey) {
          await sendViaResend(resendKey, normalizedEmail, generatedOtp);
        }
      } catch (err: unknown) {
        console.error("Error sending OTP email:", err);
        return NextResponse.json(
          {
            success: false,
            error: err instanceof Error ? err.message : "Gagal mengirimkan kode OTP ke email.",
          },
          { status: 500 }
        );
      }

      // Simpan OTP ke memory
      otpStore.set(normalizedEmail, { otp: generatedOtp, expiresAt });

      return NextResponse.json({
        success: true,
        message: `Kode OTP berhasil dikirim ke ${normalizedEmail}.`,
      });
    }

    // ─── 2. VERIFIKASI KODE OTP ─────────────────────────────────────────────
    if (action === "verify") {
      const record = otpStore.get(normalizedEmail);

      if (!record) {
        return NextResponse.json(
          { success: false, error: "Kode OTP belum diminta atau sudah kedaluwarsa. Silakan kirim ulang kode." },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(normalizedEmail);
        return NextResponse.json(
          { success: false, error: "Kode OTP sudah kedaluwarsa (lebih dari 5 menit). Silakan kirim ulang kode." },
          { status: 400 }
        );
      }

      const inputCode = String(code || "").trim();
      if (record.otp !== inputCode) {
        return NextResponse.json(
          { success: false, error: "Kode OTP salah. Periksa kembali 6 angka yang dikirimkan ke email Anda." },
          { status: 400 }
        );
      }

      // Berhasil diverifikasi: hapus OTP agar tidak dapat digunakan ulang
      otpStore.delete(normalizedEmail);
      return NextResponse.json({ success: true, message: "Kode OTP valid." });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Terjadi kesalahan pada server saat memproses OTP.",
      },
      { status: 500 }
    );
  }
}
