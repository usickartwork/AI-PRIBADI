/**
 * lib/sandbox.ts
 *
 * Core integration engine for Vercel Sandbox (@vercel/sandbox) in Usick One.
 * Provides microVM lifecycle management, secure file writing, port exposure (5173),
 * process execution, and seamless client-side sandboxed fallback.
 */

import { Sandbox } from "@vercel/sandbox";

export interface SandboxFile {
  path: string;
  content: string;
  language?: string;
}

export interface SandboxSessionState {
  mode: "vercel_sandbox" | "client_sandbox";
  sandboxId?: string;
  previewUrl?: string;
  port: number;
  status: "idle" | "booting" | "writing" | "running" | "error" | "stopped";
  error?: string;
  startedAt: number;
  expiresAt?: number;
  logs: string[];
  files: Record<string, string>;
  isFallback?: boolean;
}

// In-memory active microVM session tracker on server
interface ActiveSandboxEntry {
  sandbox?: any;
  state: SandboxSessionState;
  timer?: NodeJS.Timeout;
}

const activeSandboxes = new Map<string, ActiveSandboxEntry>();

/**
 * Cek apakah kredensial resmi Vercel Sandbox tersedia di environment runtime.
 */
export function isVercelSandboxConfigured(): boolean {
  if (process.env.VERCEL_OIDC_TOKEN) return true;
  if (process.env.VERCEL_TOKEN && (process.env.VERCEL_PROJECT_ID || process.env.VERCEL_TEAM_ID)) {
    return true;
  }
  return false;
}

/**
 * Standarisasi path file (hapus leading slash berlebih).
 */
export function sanitizeFilePath(filePath: string): string {
  return filePath.replace(/^[/\\]+/, "").trim() || "index.html";
}

/**
 * Buat template native lightweight HTTP server untuk port 5173 di microVM.
 * Native Node.js HTTP server boot dalam < 200ms tanpa perlu 'npm install' lama.
 */
function generateNativeStaticServerJs(): string {
  return `const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  let safePath = decodeURIComponent(req.url.split('?')[0]);
  if (safePath === '/' || safePath === '') safePath = '/index.html';

  let filePath = path.join(__dirname, safePath);

  // Fallback to index.html for SPA routing
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found in Sandbox');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Server Error: ' + err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(\`[Usick Sandbox] Server running on http://\${HOST}:\${PORT}\`);
});
`;
}

/**
 * Generate starter files jika proyek belum memiliki file kode.
 */
export function generateDefaultStarterFiles(projectTitle: string, prdOverview?: string): Record<string, string> {
  const title = projectTitle || "Usick One Live App";
  const desc = prdOverview || "Aplikasi yang dirancang dan dibangun dari PRD One Mind.";

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
  <!-- Top Navigation -->
  <header class="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 class="text-sm sm:text-base font-bold tracking-tight text-white">${title}</h1>
          <p class="text-[10px] text-zinc-400">Live Vercel Sandbox Prototype</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Sandbox
        </span>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center justify-center text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 mb-6 shadow-xs">
      <span class="text-indigo-400">⚡ Prototype Ready</span>
      <span class="text-zinc-600">•</span>
      <span>Vercel Firecracker MicroVM</span>
    </div>

    <h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl leading-tight mb-4">
      Selamat datang di <span class="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">${title}</span>
    </h2>

    <p class="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed mb-8">
      ${desc}
    </p>

    <!-- Interactive Counter Demo -->
    <div class="w-full max-w-md p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xs shadow-xl text-left">
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Uji Interaksi Cepat</span>
        <span id="counterBadge" class="text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
          Clicks: 0
        </span>
      </div>
      <p class="text-xs text-zinc-300 mb-4">
        Aplikasi ini berjalan secara aman dan terisolasi di Vercel Sandbox. Coba tombol di bawah untuk menguji responsivitas JavaScript:
      </p>
      <div class="flex gap-2">
        <button id="btnClick" class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition active:scale-95 cursor-pointer shadow-md">
          Hitung Aksi (+1)
        </button>
        <button id="btnReset" class="py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition active:scale-95 cursor-pointer">
          Reset
        </button>
      </div>
    </div>
  </main>

  <footer class="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
    Built &amp; Run with Usick One AI App Builder • Isolated Sandbox
  </footer>

  <script>
    let count = 0;
    const badge = document.getElementById('counterBadge');
    const btnClick = document.getElementById('btnClick');
    const btnReset = document.getElementById('btnReset');

    btnClick.addEventListener('click', () => {
      count++;
      badge.textContent = 'Clicks: ' + count;
      badge.classList.add('bg-indigo-600', 'text-white');
      setTimeout(() => {
        badge.classList.remove('bg-indigo-600', 'text-white');
      }, 200);
    });

    btnReset.addEventListener('click', () => {
      count = 0;
      badge.textContent = 'Clicks: 0';
    });
  </script>
</body>
</html>`;

  return {
    "index.html": html,
    "server.js": generateNativeStaticServerJs(),
    "package.json": JSON.stringify(
      {
        name: title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        version: "1.0.0",
        private: true,
        scripts: {
          start: "node server.js",
          dev: "node server.js",
        },
      },
      null,
      2
    ),
  };
}

/**
 * Parse output kode AI dari berbagai format (JSON, markdown code blocks, atau raw text).
 */
export function parseAiCodeFiles(rawText: string, fallbackTitle = "App"): Record<string, string> {
  const files: Record<string, string> = {};

  if (!rawText || !rawText.trim()) {
    return generateDefaultStarterFiles(fallbackTitle);
  }

  // 1. Coba parse JSON format ```json { "index.html": "..." } ```
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (typeof parsed === "object" && parsed !== null) {
        let hasFiles = false;
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "string" && v.trim()) {
            files[sanitizeFilePath(k)] = v;
            hasFiles = true;
          }
        }
        if (hasFiles) return files;
      }
    } catch {}
  }

  // 2. Coba parse format file headers:
  // FILE: path/to/file.ext atau ### path/to/file.ext diikuti ```code```
  const fileRegex = /(?:###|FILE:|---)\s*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)\s*\n```[a-zA-Z0-9_-]*\s*([\s\S]*?)```/gi;
  let match;
  let foundAny = false;
  while ((match = fileRegex.exec(rawText)) !== null) {
    const filename = sanitizeFilePath(match[1]);
    const content = match[2];
    if (filename && content) {
      files[filename] = content;
      foundAny = true;
    }
  }
  if (foundAny) {
    if (!files["server.js"]) files["server.js"] = generateNativeStaticServerJs();
    return files;
  }

  // 3. Coba parse single HTML block
  const htmlMatch = rawText.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1]) {
    files["index.html"] = htmlMatch[1].trim();
    files["server.js"] = generateNativeStaticServerJs();
    return files;
  }

  // 4. Coba deteksi <!DOCTYPE html> langsung
  if (rawText.includes("<!DOCTYPE html>") || rawText.includes("<html")) {
    const docMatch = rawText.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i) || rawText.match(/<html[\s\S]*?<\/html>/i);
    files["index.html"] = (docMatch ? docMatch[0] : rawText).trim();
    files["server.js"] = generateNativeStaticServerJs();
    return files;
  }

  // Fallback: bungkus sebagai HTML
  return generateDefaultStarterFiles(fallbackTitle, rawText.slice(0, 300));
}

/**
 * Jalankan Vercel Sandbox untuk proyek tertentu.
 * Jika Vercel token tidak tersedia, sediakan mode Client Sandbox secara aman.
 */
export async function startSandboxForProject({
  projectId,
  userId,
  projectTitle,
  files,
  timeoutMs = 300_000, // 5 menit
}: {
  projectId: string;
  userId?: string;
  projectTitle: string;
  files?: Record<string, string>;
  timeoutMs?: number;
}): Promise<SandboxSessionState> {
  const sessionKey = `${userId || "anon"}_${projectId}`;

  // Hentikan sandbox lama jika masih aktif
  await stopSandboxForProject(projectId, userId);

  const logs: string[] = [];
  logs.push(`[${new Date().toLocaleTimeString()}] Memulai inisialisasi workspace untuk: ${projectTitle}`);

  // Pastikan ada file yang valid
  let projectFiles = files && Object.keys(files).length > 0
    ? { ...files }
    : generateDefaultStarterFiles(projectTitle);

  // Pastikan server.js dan index.html ada
  if (!projectFiles["server.js"]) {
    projectFiles["server.js"] = generateNativeStaticServerJs();
  }
  if (!projectFiles["index.html"]) {
    projectFiles["index.html"] = generateDefaultStarterFiles(projectTitle)["index.html"];
  }

  const vercelAvailable = isVercelSandboxConfigured();

  // ── JALUR A: VERCEL SANDBOX RESMI (MicroVM) ─────────────────────────────────
  if (vercelAvailable) {
    try {
      logs.push(`[${new Date().toLocaleTimeString()}] Menghubungkan ke Vercel Firecracker MicroVM...`);

      // Buat microVM dengan port 5173 terbuka
      const sandbox = await Sandbox.create({
        ports: [5173],
        timeout: timeoutMs,
        persistent: false,
        resources: { vcpus: 1 },
      });

      logs.push(`[${new Date().toLocaleTimeString()}] MicroVM berhasil di-provision. Status: ${sandbox.status || "created"}`);

      // Tulis file ke filesystem MicroVM
      const writePayload = Object.entries(projectFiles).map(([relPath, content]) => ({
        path: sanitizeFilePath(relPath),
        content: Buffer.from(content, "utf-8"),
      }));

      logs.push(`[${new Date().toLocaleTimeString()}] Menulis ${writePayload.length} file proyek ke sandbox...`);
      await sandbox.writeFiles(writePayload);

      // Jalankan dev server pada background (detached: true)
      logs.push(`[${new Date().toLocaleTimeString()}] Menjalankan server aplikasi (node server.js pada 0.0.0.0:5173)...`);
      await sandbox.runCommand({
        cmd: "node",
        args: ["server.js"],
        detached: true,
      });

      // Dapatkan domain HTTPS publik yang diekspos
      const previewUrl = sandbox.domain(5173);
      logs.push(`[${new Date().toLocaleTimeString()}] Server aktif! Live preview domain: ${previewUrl}`);

      const state: SandboxSessionState = {
        mode: "vercel_sandbox",
        sandboxId: sandbox.name || (sandbox as any).id || "sbx_live",
        previewUrl,
        port: 5173,
        status: "running",
        startedAt: Date.now(),
        expiresAt: Date.now() + timeoutMs,
        logs,
        files: projectFiles,
        isFallback: false,
      };

      // Set auto-stop timer
      const timer = setTimeout(async () => {
        try {
          await sandbox.stop();
          activeSandboxes.delete(sessionKey);
        } catch {}
      }, timeoutMs);

      activeSandboxes.set(sessionKey, { sandbox, state, timer });
      return state;
    } catch (err: any) {
      console.warn("[lib/sandbox] Gagal membuat Vercel Sandbox, fallback ke Client Sandbox:", err);
      logs.push(`[${new Date().toLocaleTimeString()}] Peringatan Vercel MicroVM: ${err.message || String(err)}`);
      logs.push(`[${new Date().toLocaleTimeString()}] Mengaktifkan In-Browser Virtual Sandbox Fallback...`);
    }
  } else {
    logs.push(`[${new Date().toLocaleTimeString()}] Kredensial Vercel OIDC belum terdeteksi.`);
    logs.push(`[${new Date().toLocaleTimeString()}] Menjalankan In-Browser Virtual Sandbox (Fully Interactive & Safe)...`);
  }

  // ── JALUR B: CLIENT VIRTUAL SANDBOX FALLBACK (Zero Crash, Instant) ─────────
  const clientHtml = projectFiles["index.html"] || generateDefaultStarterFiles(projectTitle)["index.html"];

  const state: SandboxSessionState = {
    mode: "client_sandbox",
    sandboxId: "local_virtual_sandbox",
    previewUrl: undefined,
    port: 5173,
    status: "running",
    startedAt: Date.now(),
    expiresAt: Date.now() + timeoutMs,
    logs,
    files: projectFiles,
    isFallback: !vercelAvailable,
  };

  activeSandboxes.set(sessionKey, { state });
  return state;
}

/**
 * Hentikan sandbox aktif untuk proyek tertentu.
 */
export async function stopSandboxForProject(projectId: string, userId?: string): Promise<boolean> {
  const sessionKey = `${userId || "anon"}_${projectId}`;
  const entry = activeSandboxes.get(sessionKey);

  if (entry) {
    if (entry.timer) clearTimeout(entry.timer);
    if (entry.sandbox && typeof entry.sandbox.stop === "function") {
      try {
        await entry.sandbox.stop();
      } catch (err) {
        console.warn("[lib/sandbox] Error stopping sandbox:", err);
      }
    }
    activeSandboxes.delete(sessionKey);
    return true;
  }
  return false;
}

/**
 * Ambil status sandbox proyek saat ini.
 */
export function getSandboxStateForProject(projectId: string, userId?: string): SandboxSessionState | null {
  const sessionKey = `${userId || "anon"}_${projectId}`;
  const entry = activeSandboxes.get(sessionKey);
  return entry ? entry.state : null;
}
