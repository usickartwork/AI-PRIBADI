// ─── Shared Multi-Key Spotify Server Token Utility with Auto-Fallback ────────
// Mendukung multi API key Spotify (Key Utama + Key Cadangan / Backup)
// Secara otomatis mendeteksi status 429 (QUOTA_EXCEEDED) dan beralih ke key cadangan.

interface SpotifyKeyConfig {
  id: string;
  secret: string;
  name: string;
}

interface CachedToken {
  access_token: string;
  expires_at: number;
}

// In-memory token cache keyed by client ID
const tokenCache = new Map<string, CachedToken>();

// In-memory rate-limit trackers keyed by client ID (timestamp until cooldown expires)
const rateLimitMap = new Map<string, number>();

export function getKeyPairs(): SpotifyKeyConfig[] {
  const keys: SpotifyKeyConfig[] = [];

  // Key 1: Utama
  const id1 = process.env.SPOTIFY_CLIENT_ID?.trim();
  const sec1 = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (id1 && sec1) {
    keys.push({ id: id1, secret: sec1, name: "Primary (Key 1)" });
  }

  // Key 2: Cadangan (Mendukung SPOTIFY_CLIENT_ID_BACKUP atau SPOTIFY_CLIENT_ID_2)
  const id2 = (process.env.SPOTIFY_CLIENT_ID_BACKUP || process.env.SPOTIFY_CLIENT_ID_2)?.trim();
  const sec2 = (process.env.SPOTIFY_CLIENT_SECRET_BACKUP || process.env.SPOTIFY_CLIENT_SECRET_2)?.trim();
  if (id2 && sec2) {
    keys.push({ id: id2, secret: sec2, name: "Backup (Key 2)" });
  }

  // Key 3: Cadangan ke-3 (opsional jika pengguna mendaftarkan lebih banyak)
  const id3 = process.env.SPOTIFY_CLIENT_ID_3?.trim();
  const sec3 = process.env.SPOTIFY_CLIENT_SECRET_3?.trim();
  if (id3 && sec3) {
    keys.push({ id: id3, secret: sec3, name: "Backup (Key 3)" });
  }

  return keys;
}

/**
 * Tandai suatu Client ID sebagai terkena rate limit (429) selama retryAfterSeconds
 */
export function markSpotifyKeyRateLimited(clientId: string, retryAfterSeconds: number = 3600) {
  const cooldownMs = Math.max(retryAfterSeconds, 60) * 1000;
  const until = Date.now() + cooldownMs;
  rateLimitMap.set(clientId, until);
  console.warn(
    `[spotifyServer] Key ${clientId.slice(0, 6)}... ditandai RATE LIMITED selama ${retryAfterSeconds} detik (sampai ${new Date(
      until
    ).toLocaleTimeString()})`
  );
}

/**
 * Mengambil token Spotify beserta info Client ID yang sedang aktif.
 * Mengabaikan key yang sedang terkena rate limit, dan otomatis mengambil key berikutnya.
 */
export async function getSpotifyTokenWithMetadata(excludeClientId?: string): Promise<{
  token: string;
  clientId: string;
  keyName: string;
} | null> {
  const keyPairs = getKeyPairs();
  if (keyPairs.length === 0) return null;

  const now = Date.now();

  // Filter key yang tidak dalam masa cooldown dan bukan yang di-exclude
  const validKeys = keyPairs.filter((k) => {
    if (excludeClientId && k.id === excludeClientId) return false;
    const limitedUntil = rateLimitMap.get(k.id) || 0;
    return limitedUntil <= now;
  });

  // Jika semua key tertandai limit, coba tetap gunakan semua key (siapa tahu cooldown sudah selesai di server Spotify)
  const keysToTry = validKeys.length > 0 ? validKeys : keyPairs;

  for (const key of keysToTry) {
    const cached = tokenCache.get(key.id);
    if (cached && now < cached.expires_at - 60_000) {
      return { token: cached.access_token, clientId: key.id, keyName: key.name };
    }

    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${key.id}:${key.secret}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!res.ok) {
        console.error(`[spotifyServer] Gagal mengambil token untuk ${key.name}:`, res.status);
        continue;
      }

      const json = await res.json();
      tokenCache.set(key.id, {
        access_token: json.access_token,
        expires_at: now + (json.expires_in || 3600) * 1000,
      });

      return {
        token: json.access_token,
        clientId: key.id,
        keyName: key.name,
      };
    } catch (err) {
      console.error(`[spotifyServer] Error fetching token untuk ${key.name}:`, err);
    }
  }

  return null;
}

/**
 * Fungsi standar yang kompatibel dengan seluruh kode yang sudah ada
 */
export async function getSpotifyToken(): Promise<string | null> {
  const meta = await getSpotifyTokenWithMetadata();
  return meta ? meta.token : null;
}
