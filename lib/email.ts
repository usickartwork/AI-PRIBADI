import nodemailer from "nodemailer";

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export type ScheduleEmailReminderParams = {
  toEmail: string;
  scheduleTitle: string;
  scheduledTimeText: string;
  durationText?: string;
  notes?: string;
  reminderMinutes: number;
};

// Helper pengiriman email via Google Apps Script HTTPS Webhook (100% Bebas Blokir Port & IP)
async function sendViaGoogleWebhook(webhookUrl: string, toEmail: string, subject: string, html: string) {
  const cleanUrl = webhookUrl.replace(/^["']|["']$/g, "").trim();
  const res = await fetch(cleanUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: toEmail.trim(),
      subject,
      html,
    }),
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || "Gagal mengirim email via Google Webhook.");
  }
  return data;
}

// Helper pengiriman email via Gmail SMTP (Nodemailer)
async function sendViaGmail(user: string, pass: string, toEmail: string, subject: string, html: string) {
  const cleanUser = user.replace(/^["']|["']$/g, "").trim();
  const cleanPass = pass.replace(/^["']|["']$/g, "").replace(/\s+/g, "").trim();

  // 1. Coba service: "gmail"
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
    });

    return await transporter.sendMail({
      from: `"One Mind" <${cleanUser}>`,
      to: toEmail,
      subject,
      html,
    });
  } catch (serviceErr: any) {
    console.warn("[Email] Gmail service gagal, mencoba port 465 manual...", serviceErr?.message || serviceErr);

    // Fallback port 465 (SSL)
    const transporter465 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    return await transporter465.sendMail({
      from: `"One Mind" <${cleanUser}>`,
      to: toEmail,
      subject,
      html,
    });
  }
}

// Helper pengiriman email via Resend
async function sendViaResend(apiKey: string, toEmail: string, subject: string, html: string) {
  const sender = process.env.RESEND_FROM_EMAIL?.trim() || "One Mind Schedule <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [toEmail],
      subject,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.message || data.error || "Gagal mengirim email via Resend.";

    // Deteksi khusus batasan sandbox/testing domain bawaan Resend (onboarding@resend.dev)
    const isSandboxRestriction =
      typeof errorMsg === "string" &&
      (errorMsg.includes("only send testing emails to your own email address") ||
        errorMsg.includes("resend.com/domains"));

    if (isSandboxRestriction) {
      const ownerEmail = (
        process.env.GMAIL_USER ||
        process.env.EMAIL_USER ||
        "usick.artwork@gmail.com"
      ).trim();

      console.warn(
        `[Resend Sandbox] Email tujuan (${toEmail}) bukan email pemilik Resend. Resend menolak karena domain pengirim masih ${sender}. Mem-forward ke ${ownerEmail}...`
      );

      // Jika alamat tujuan bukan email owner, forward ke owner agar notifikasi tetap sampai dan tidak hilang
      if (toEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
        const forwardedHtml = `
          <div style="background-color: #27272a; color: #f43f5e; border: 1px solid #e11d48; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-family: sans-serif; font-size: 13px; line-height: 1.6;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">⚠️ [Pemberitahuan Sandbox Resend]</div>
            <div>Pengingat ini dibuat untuk akun: <strong>${escapeHtml(toEmail)}</strong>.</div>
            <div style="margin-top: 6px; color: #d4d4d8;">
              Karena akun Resend saat ini masih menggunakan domain uji coba (<code>onboarding@resend.dev</code>), Resend secara otomatis menolak pengiriman ke akun luar selain pemilik akun (<code>${ownerEmail}</code>).
            </div>
            <div style="margin-top: 8px; color: #e4e4e7;">
              👉 <strong>Solusi:</strong> Untuk mengirim notifikasi langsung ke email pengguna lain, verifikasi domain Anda di <a href="https://resend.com/domains" style="color: #38bdf8; text-decoration: underline;" target="_blank">resend.com/domains</a>, lalu atur <code>RESEND_FROM_EMAIL</code>.
            </div>
          </div>
          ${html}
        `;

        const fallbackRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: sender,
            to: [ownerEmail],
            subject: `[Jadwal Akun: ${toEmail}] ${subject}`,
            html: forwardedHtml,
          }),
        });

        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok) {
          console.log(`[Resend Fallback] Berhasil meneruskan notifikasi pengingat ke ${ownerEmail}.`);
          return {
            ...fallbackData,
            forwarded: true,
            originalRecipient: toEmail,
            forwardedTo: ownerEmail,
          };
        }
      }
    }

    throw new Error(errorMsg);
  }
  return data;
}

// Helper pengiriman email via Brevo (Sendinblue) REST API (Gratis 300 email/hari ke penerima apapun)
async function sendViaBrevo(apiKey: string, toEmail: string, subject: string, html: string) {
  const cleanApiKey = apiKey.replace(/^["']|["']$/g, "").trim();
  const senderEmail = (
    process.env.BREVO_SENDER_EMAIL ||
    process.env.GMAIL_USER ||
    process.env.EMAIL_USER ||
    "usick.artwork@gmail.com"
  ).trim();

  console.log(`[Brevo] Mengirim email ke ${toEmail} dari ${senderEmail}...`);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": cleanApiKey,
      "Content-Type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "One Mind", email: senderEmail },
      to: [{ email: toEmail.trim() }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[Brevo] Gagal mengirim email:", data);
    throw new Error(data.message || data.error || "Gagal mengirim email via Brevo.");
  }
  console.log("[Brevo] Email berhasil dikirim! messageId:", data.messageId);
  return data;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // 1. Coba Google Apps Script Webhook jika diset (paling reliable di cloud serverless, 100% bebas blokir)
  const webhookUrl = process.env.GMAIL_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    try {
      console.log(`[Email] Mengirim email ke ${to} via Google Apps Script Webhook...`);
      return await sendViaGoogleWebhook(webhookUrl, to, subject, html);
    } catch (whErr: any) {
      console.error("[Email] Gagal via Google Webhook, mencoba opsi berikutnya:", whErr?.message || whErr);
    }
  }

  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();

  // 2. Coba Brevo API jika tersedia (mendukung pengiriman ke email apa saja tanpa wajib domain custom)
  if (brevoKey) {
    try {
      return await sendViaBrevo(brevoKey, to, subject, html);
    } catch (brevoErr: any) {
      console.error("[Email] Gagal mengirim via Brevo, mencoba provider berikutnya:", brevoErr?.message || brevoErr);
    }
  }

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

  if (!resendKey && !brevoKey && (!gmailUser || !gmailPass)) {
    throw new Error(
      "Konfigurasi email belum lengkap di server (harus mengisi GMAIL_USER & GMAIL_APP_PASSWORD, RESEND_API_KEY, atau BREVO_API_KEY)."
    );
  }

  // 2. Coba Gmail SMTP
  if (gmailUser && gmailPass) {
    try {
      return await sendViaGmail(gmailUser, gmailPass, to, subject, html);
    } catch (gmailErr) {
      console.error("Gagal mengirim via Gmail SMTP, mencoba fallback Resend:", gmailErr);
      if (resendKey) {
        return await sendViaResend(resendKey, to, subject, html);
      }
      throw gmailErr;
    }
  } else if (resendKey) {
    return await sendViaResend(resendKey, to, subject, html);
  }
}

export function buildScheduleReminderHtml({
  scheduleTitle,
  scheduledTimeText,
  durationText,
  notes,
  reminderMinutes,
}: Omit<ScheduleEmailReminderParams, "toEmail">): string {
  const timeDesc = reminderMinutes <= 0
    ? "Jadwal sedang berlangsung sekarang."
    : `${reminderMinutes} menit lagi (${reminderMinutes} minutes from now).`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px 24px; max-width: 600px; margin: 0 auto; border-radius: 20px; border: 1px solid #27272a;">
      <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #ffffff; background: #27272a; padding: 4px 12px; border-radius: 9999px; border: 1px solid #3f3f46;">Schedule Reminder</span>
      </div>
      
      <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 12px 0; letter-spacing: -0.5px;">
        ${escapeHtml(scheduleTitle)}
      </h1>

      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
        <div style="color: #a1a1aa; font-size: 13px; margin-bottom: 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Waktu & Agenda</div>
        <div style="color: #ffffff; font-size: 18px; font-weight: 700; margin-bottom: 4px;">
          ${escapeHtml(scheduledTimeText)}
        </div>
        ${durationText ? `<div style="color: #a1a1aa; font-size: 13px;">Durasi: ${escapeHtml(durationText)}</div>` : ""}
      </div>

      <div style="background-color: #18181b; border-left: 4px solid #ffffff; padding: 14px 18px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
        <p style="color: #e4e4e7; font-size: 14px; margin: 0; font-weight: 500;">
          ⏰ Pengingat: <strong>${timeDesc}</strong>
        </p>
      </div>

      ${
        notes
          ? `
        <div style="margin-bottom: 28px;">
          <div style="color: #a1a1aa; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 6px;">Catatan Tambahan:</div>
          <div style="color: #d4d4d8; font-size: 14px; line-height: 1.6; background: #121215; padding: 14px; border-radius: 10px; border: 1px solid #27272a;">
            ${escapeHtml(notes)}
          </div>
        </div>
      `
          : ""
      }

      <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #27272a;">
        <p style="color: #71717a; font-size: 12px; margin: 0 0 12px 0;">
          Email ini dikirim otomatis oleh asisten <strong>One Mind</strong> untuk agenda pribadi Anda.
        </p>
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
