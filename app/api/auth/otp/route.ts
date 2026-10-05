import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Secret untuk menandatangani token OTP (stateless di seluruh instance Vercel)
const OTP_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.GMAIL_APP_PASSWORD ||
  "usick-ai-secret-otp-signing-key-2026";

function generateOtpToken(email: string, otp: string, expiresAt: number): string {
  const payload = JSON.stringify({ email: email.toLowerCase(), otp, exp: expiresAt });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", OTP_SECRET).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

function verifyOtpToken(token: string, email: string, inputOtp: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [b64, sig] = parts;
    const expectedSig = crypto.createHmac("sha256", OTP_SECRET).update(b64).digest("hex");
    if (sig !== expectedSig) return false;
    const data = JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
    if (data.email !== email.toLowerCase()) return false;
    if (data.otp !== inputOtp) return false;
    if (Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}

// Penyimpanan OTP sementara di memory server (email -> { otp, expiresAt }) sebagai cadangan
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Helper pengiriman email via Gmail SMTP (Nodemailer) dengan dual-port fallback (465 SSL -> 587 STARTTLS)
async function sendViaGmail(user: string, pass: string, toEmail: string, otp: string) {
  const cleanUser = user.replace(/^["']|["']$/g, "").trim();
  const cleanPass = pass.replace(/^["']|["']$/g, "").replace(/\s+/g, "").trim();

  const mailOptions = {
    from: `"Usick AI" <${cleanUser}>`,
    to: toEmail,
    subject: `Kode Verifikasi OTP: ${otp} - Usick AI`,
    text: `Halo,\n\nBerikut kode verifikasi OTP Anda untuk pendaftaran akun Usick AI:\n\n${otp}\n\nKode ini berlaku selama 5 menit. Masukkan kode ini pada aplikasi untuk menyelesaikan pendaftaran Anda.\n\nSalam,\nTim Usick AI Intelligence`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px 20px; text-align: center; border-radius: 16px;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">Usick V1 Intelligence</h1>
        <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px;">Berikut adalah kode verifikasi OTP untuk menyelesaikan pendaftaran akun Anda:</p>
        <div style="display: inline-block; background-color: #18181b; border: 1px solid #3f3f46; border-radius: 16px; padding: 16px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: monospace; margin-bottom: 24px;">
          ${otp}
        </div>
        <p style="color: #71717a; font-size: 12px; line-height: 1.5;">Kode verifikasi ini berlaku selama 5 menit.<br/>Masukkan kode ini pada aplikasi untuk mengaktifkan akun Anda.</p>
      </div>
    `,
  };

  // Coba port 465 (SSL)
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    await transporter.sendMail(mailOptions);
    return;
  } catch (err465: any) {
    console.warn("[OTP] Gmail port 465 gagal, mencoba fallback port 587 STARTTLS...", err465?.message || err465);

    // Fallback port 587 (STARTTLS)
    const transporter587 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    await transporter587.sendMail(mailOptions);
  }
}

// Helper pengiriman email via Resend jika RESEND_API_KEY diset
async function sendViaResend(apiKey: string, toEmail: string, otp: string) {
  const sender = process.env.RESEND_FROM_EMAIL?.trim() || "Usick AI <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [toEmail],
      subject: `Kode Verifikasi OTP: ${otp} - Usick AI`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px 20px; text-align: center; border-radius: 16px;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">Usick V1 Intelligence</h1>
          <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px;">Berikut adalah kode verifikasi OTP untuk menyelesaikan pendaftaran akun Anda:</p>
          <div style="display: inline-block; background-color: #18181b; border: 1px solid #3f3f46; border-radius: 16px; padding: 16px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: monospace; margin-bottom: 24px;">
            ${otp}
          </div>
          <p style="color: #71717a; font-size: 12px; line-height: 1.5;">Kode verifikasi ini berlaku selama 5 menit.<br/>Masukkan kode ini pada aplikasi untuk mengaktifkan akun Anda.</p>
        </div>
      `,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = String(data.message || data.error || "");
    // Deteksi jika akun Resend masih sandbox (hanya bisa kirim ke akun pemilik terdaftar)
    if (res.status === 403 || errorMsg.toLowerCase().includes("testing emails")) {
      // Forward notifikasi ke akun pemilik
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Usick AI <onboarding@resend.dev>",
            to: ["usick.artwork@gmail.com"],
            subject: `[Resend Sandbox OTP] Kode untuk ${toEmail}: ${otp}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; background: #09090b; color: #fff; border-radius: 12px;">
                <h2>Notifikasi Pendaftaran Akun</h2>
                <p>Pengguna dengan email <strong>${toEmail}</strong> meminta pendaftaran akun baru.</p>
                <p>Kode OTP: <strong style="font-size: 22px; color: #fff; letter-spacing: 4px;">${otp}</strong></p>
                <p style="color: #888; font-size: 12px;">Pesan ini diteruskan otomatis karena domain Resend masih dalam status sandbox.</p>
              </div>
            `,
          }),
        });
      } catch (fwdErr) {
        console.warn("[OTP] Gagal meneruskan email ke pemilik:", fwdErr);
      }

      return { isSandboxRestriction: true, originalError: errorMsg };
    }
    throw new Error(errorMsg || "Gagal mengirim email via Resend.");
  }
  return data;
}

// Helper pengiriman email via Brevo jika BREVO_API_KEY diset
async function sendViaBrevo(apiKey: string, toEmail: string, otp: string) {
  const senderEmail = (
    process.env.BREVO_SENDER_EMAIL ||
    process.env.GMAIL_USER ||
    process.env.EMAIL_USER ||
    "usick.artwork@gmail.com"
  ).trim();

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey.trim(),
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Usick AI", email: senderEmail },
      to: [{ email: toEmail }],
      subject: `Kode Verifikasi OTP: ${otp} - Usick AI`,
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px 20px; text-align: center; border-radius: 16px;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">Usick V1 Intelligence</h1>
          <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px;">Berikut adalah kode verifikasi OTP untuk menyelesaikan pendaftaran akun Anda:</p>
          <div style="display: inline-block; background-color: #18181b; border: 1px solid #3f3f46; border-radius: 16px; padding: 16px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: monospace; margin-bottom: 24px;">
            ${otp}
          </div>
          <p style="color: #71717a; font-size: 12px; line-height: 1.5;">Kode verifikasi ini berlaku selama 5 menit.<br/>Masukkan kode ini pada aplikasi untuk mengaktifkan akun Anda.</p>
        </div>
      `,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Gagal mengirim email via Brevo.");
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

      const brevoKey = process.env.BREVO_API_KEY?.trim();
      const gmailUser = (
        process.env.GMAIL_USER ||
        process.env.GMAIL_EMAIL ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER ||
        "usick.artwork@gmail.com"
      )?.trim();

      const gmailPass = (
        process.env.GMAIL_APP_PASSWORD ||
        process.env.GMAIL_PASSWORD ||
        process.env.GMAIL_PASS ||
        process.env.SMTP_PASS ||
        process.env.SMTP_PASSWORD ||
        process.env.EMAIL_PASS ||
        process.env.EMAIL_PASSWORD ||
        "djrsvftujahcelgn"
      )?.trim();
      const resendKey = process.env.RESEND_API_KEY?.trim();

      if (!brevoKey && !resendKey && (!gmailUser || !gmailPass)) {
        return NextResponse.json(
          {
            success: false,
            error: "Konfigurasi email belum lengkap. Harap isi BREVO_API_KEY, GMAIL_USER & GMAIL_APP_PASSWORD, atau RESEND_API_KEY di Vercel.",
          },
          { status: 500 }
        );
      }

      let emailResult: any = null;

      try {
        if (brevoKey) {
          console.log(`[OTP] Mengirim kode OTP ke ${normalizedEmail} via Brevo...`);
          emailResult = await sendViaBrevo(brevoKey, normalizedEmail, generatedOtp);
          console.log(`[OTP] Berhasil mengirim kode OTP via Brevo ke ${normalizedEmail}.`);
        } else if (gmailUser && gmailPass) {
          try {
            console.log(`[OTP] Mengirim kode OTP ke ${normalizedEmail} via Gmail SMTP (${gmailUser})...`);
            await sendViaGmail(gmailUser, gmailPass, normalizedEmail, generatedOtp);
            console.log(`[OTP] Berhasil mengirim kode OTP ke ${normalizedEmail} via Gmail.`);
          } catch (gmailErr: any) {
            console.error("[OTP] Gagal mengirim via Gmail SMTP, mencoba fallback Resend:", gmailErr);
            if (resendKey) {
              emailResult = await sendViaResend(resendKey, normalizedEmail, generatedOtp);
            } else {
              throw gmailErr;
            }
          }
        } else if (resendKey) {
          console.log(`[OTP] Mengirim kode OTP ke ${normalizedEmail} via Resend...`);
          emailResult = await sendViaResend(resendKey, normalizedEmail, generatedOtp);
        }
      } catch (err: unknown) {
        console.error("[OTP] Error sending OTP email:", err);
        return NextResponse.json(
          {
            success: false,
            error: err instanceof Error ? err.message : "Gagal mengirimkan kode OTP ke email.",
          },
          { status: 500 }
        );
      }

      // Generate stateless signed token & simpan ke memory store sebagai cadangan
      const token = generateOtpToken(normalizedEmail, generatedOtp, expiresAt);
      otpStore.set(normalizedEmail, { otp: generatedOtp, expiresAt });

      // Jika terkena limitasi Sandbox Resend, kembalikan devOtp agar pendaftaran tidak macet
      if (emailResult?.isSandboxRestriction) {
        const res = NextResponse.json({
          success: true,
          token,
          devOtp: generatedOtp,
          isSandbox: true,
          message: `Kode verifikasi: ${generatedOtp} (Mode Resend Sandbox). Silakan gunakan kode ini atau cek inbox usick.artwork@gmail.com.`,
        });
        res.cookies.set("usick_otp_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 300,
        });
        return res;
      }

      const res = NextResponse.json({
        success: true,
        token,
        message: `Kode OTP berhasil dikirim ke ${normalizedEmail}.`,
      });
      res.cookies.set("usick_otp_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 300,
      });
      return res;
    }

    // ─── 2. VERIFIKASI KODE OTP ─────────────────────────────────────────────
    if (action === "verify") {
      const inputCode = String(code || "").trim();
      const providedToken =
        (typeof body.token === "string" && body.token) ||
        request.headers.get("cookie")?.match(/usick_otp_token=([^;]+)/)?.[1];

      let isValid = false;

      // Coba verifikasi dengan signed token terlebih dahulu (stateless across lambdas)
      if (providedToken && verifyOtpToken(providedToken, normalizedEmail, inputCode)) {
        isValid = true;
      }

      // Jika token tidak cocok/tidak ada, coba verifikasi dengan memory store
      const record = otpStore.get(normalizedEmail);
      if (!isValid && record) {
        if (Date.now() <= record.expiresAt && record.otp === inputCode) {
          isValid = true;
        } else if (Date.now() > record.expiresAt) {
          otpStore.delete(normalizedEmail);
          return NextResponse.json(
            { success: false, error: "Kode OTP sudah kedaluwarsa (lebih dari 5 menit). Silakan kirim ulang kode." },
            { status: 400 }
          );
        }
      }

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Kode OTP salah atau sudah kedaluwarsa. Periksa kembali 6 angka yang dikirimkan ke email Anda.",
          },
          { status: 400 }
        );
      }

      // Berhasil diverifikasi: bersihkan OTP agar tidak dapat digunakan ulang
      otpStore.delete(normalizedEmail);
      const res = NextResponse.json({ success: true, message: "Kode OTP valid." });
      res.cookies.delete("usick_otp_token");
      return res;
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
