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

// Helper pengiriman email via Gmail SMTP (Nodemailer)
async function sendViaGmail(user: string, pass: string, toEmail: string, subject: string, html: string) {
  const cleanUser = user.replace(/^["']|["']$/g, "").trim();
  const cleanPass = pass.replace(/^["']|["']$/g, "").replace(/\s+/g, "").trim();

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

    return await transporter.sendMail({
      from: `"Usick AI" <${cleanUser}>`,
      to: toEmail,
      subject,
      html,
    });
  } catch (err465: any) {
    console.warn("[Email] Gmail port 465 gagal, mencoba fallback port 587 STARTTLS...", err465?.message || err465);

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

    return await transporter587.sendMail({
      from: `"Usick AI" <${cleanUser}>`,
      to: toEmail,
      subject,
      html,
    });
  }
}

// Helper pengiriman email via Resend
async function sendViaResend(apiKey: string, toEmail: string, subject: string, html: string) {
  const sender = process.env.RESEND_FROM_EMAIL?.trim() || "Usick AI Schedule <onboarding@resend.dev>";
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
    throw new Error(data.message || data.error || "Gagal mengirim email via Resend.");
  }
  return data;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (!resendKey && (!gmailUser || !gmailPass)) {
    throw new Error(
      "Konfigurasi email belum lengkap di server (harus mengisi GMAIL_USER & GMAIL_APP_PASSWORD atau RESEND_API_KEY)."
    );
  }

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
          Email ini dikirim otomatis oleh asisten <strong>Usick AI Schedule</strong> untuk agenda pribadi Anda.
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
