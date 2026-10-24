import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state") || "primary";

  if (error || !code) {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:30px;background:#111;color:#fff;">
      <h2 style="color:#ef4444;">Gagal Mengotorisasi Spotify</h2>
      <p>${error || "Kode otorisasi tidak ditemukan."}</p>
      <a href="/" style="color:#10b981;">Kembali</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const redirectUri = `${origin}/api/music/setup/callback`;

  // Daftar kandidat pasangan ID & Secret
  const primaryPair = {
    id: process.env.SPOTIFY_CLIENT_ID?.trim(),
    secret: process.env.SPOTIFY_CLIENT_SECRET?.trim(),
    envVarName: "SPOTIFY_REFRESH_TOKEN",
    label: "Key Utama (Primary)",
  };

  const backupPair = {
    id: (process.env.SPOTIFY_CLIENT_ID_BACKUP || process.env.SPOTIFY_CLIENT_ID_2)?.trim(),
    secret: (process.env.SPOTIFY_CLIENT_SECRET_BACKUP || process.env.SPOTIFY_CLIENT_SECRET_2)?.trim(),
    envVarName: "SPOTIFY_REFRESH_TOKEN_BACKUP",
    label: "Key Cadangan (Backup)",
  };

  const candidates =
    state === "backup"
      ? [backupPair, primaryPair].filter((p): p is typeof primaryPair & { id: string; secret: string } => !!p.id && !!p.secret)
      : [primaryPair, backupPair].filter((p): p is typeof primaryPair & { id: string; secret: string } => !!p.id && !!p.secret);

  if (candidates.length === 0) {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:30px;background:#111;color:#fff;">
      <h2 style="color:#ef4444;">Credentials Belum Lengkap</h2>
      <p>SPOTIFY_CLIENT_ID atau SPOTIFY_CLIENT_SECRET tidak ditemukan di environment server.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  let matchedPair = candidates[0];
  let refreshToken: string | null = null;
  let lastErrorData: any = null;

  for (const pair of candidates) {
    try {
      const creds = Buffer.from(`${pair.id}:${pair.secret}`).toString("base64");
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${creds}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });

      const data = await tokenRes.json();
      if (data.refresh_token) {
        refreshToken = data.refresh_token;
        matchedPair = pair;
        break;
      } else {
        lastErrorData = data;
      }
    } catch (e) {
      lastErrorData = e;
    }
  }

  if (!refreshToken) {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:30px;background:#111;color:#fff;">
      <h2 style="color:#ef4444;">Gagal Mengambil Refresh Token</h2>
      <pre style="background:#222;padding:15px;border-radius:8px;">${JSON.stringify(lastErrorData, null, 2)}</pre>
      <a href="/" style="color:#10b981;">Kembali</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Otomatis simpan ke .env.local jika file ada di local environment
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");
      const targetVar = matchedPair.envVarName;
      if (envContent.includes(`${targetVar}=`)) {
        envContent = envContent.replace(new RegExp(`${targetVar}=.*`), `${targetVar}=${refreshToken}`);
      } else {
        envContent += `\n${targetVar}=${refreshToken}\n`;
      }
      fs.writeFileSync(envPath, envContent);
    }
  } catch (e) {
    console.warn("Gagal menulis otomatis ke .env.local:", e);
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Spotify Token Berhasil Dihubungkan</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0c0e; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { max-width: 560px; width: 100%; background: #16161d; border: 1px solid #27272a; border-radius: 28px; padding: 36px; box-shadow: 0 24px 48px rgba(0,0,0,0.6); }
    h1 { font-size: 22px; margin: 0 0 10px; color: #10b981; display: flex; align-items: center; gap: 8px; }
    p { font-size: 13px; color: #a1a1aa; line-height: 1.6; margin: 0 0 16px; }
    .alert { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #6ee7b7; }
    .token-box { background: #000; border: 1px solid #3f3f46; border-radius: 14px; padding: 14px; font-family: monospace; font-size: 12px; color: #34d399; word-break: break-all; margin-bottom: 24px; user-select: all; }
    .btn { display: inline-block; background: #10b981; color: #000; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 14px; font-size: 13px; cursor: pointer; transition: 0.2s; }
    .btn:hover { background: #34d399; transform: scale(1.02); }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎉 Berhasil Terhubung! (${matchedPair.label})</h1>
    <div class="alert">
      <strong>Otorisasi Spotify Sukses!</strong> Token ini terhubung dengan Client ID: <code>${matchedPair.id.slice(0, 8)}...</code>
    </div>
    <p>Jika Anda mendeploy ke <strong>Vercel</strong>, tambahkan / update variabel ini di <em>Vercel Dashboard > Settings > Environment Variables</em>:</p>
    <p><strong>Key:</strong> <code>${matchedPair.envVarName}</code> (atau <code>SPOTIFY_REFRESH_TOKEN</code>)</p>
    <p><strong>Value:</strong></p>
    <div class="token-box">${refreshToken}</div>
    <a href="/" class="btn">Kembali ke Usick One</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
