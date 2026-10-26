export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  startSandboxForProject,
  stopSandboxForProject,
  getSandboxStateForProject,
  parseAiCodeFiles,
  generateDefaultStarterFiles,
  isVercelSandboxConfigured,
} from "@/lib/sandbox";

/**
 * Helper untuk memanggil AI completions internal guna menghasilkan kode aplikasi dari PRD.
 */
async function generateAppCodeWithAI({
  projectTitle,
  prdOverview,
  features = [],
  tasks = [],
  userFlow = "",
  userPrompt = "",
  currentFiles = {},
  baseUrl,
  userId,
}: {
  projectTitle: string;
  prdOverview: string;
  features?: any[];
  tasks?: any[];
  userFlow?: string;
  userPrompt?: string;
  currentFiles?: Record<string, string>;
  baseUrl: string;
  userId?: string;
}): Promise<Record<string, string>> {
  const featuresText = (features || [])
    .map((f, i) => `${i + 1}. ${f.name || f.title || "Fitur"}: ${f.description || ""}`)
    .join("\n");
  const tasksText = (tasks || [])
    .slice(0, 10)
    .map((t, i) => `${i + 1}. ${t.title}: ${t.description || ""}`)
    .join("\n");

  const existingCode = currentFiles["index.html"]
    ? `\nKODE FILE SAAT INI (index.html):\n\`\`\`html\n${currentFiles["index.html"].slice(0, 4000)}\n\`\`\`\n`
    : "";

  const systemPrompt = `You are a World-Class Principal Frontend Architect and UI/UX Designer (comparable to v0, Lovable, and Bolt engineering teams).
Your task is to generate or update a complete, fully interactive, ultra-modern, production-grade web application based on the user's PRD and instructions.

STRICT DESIGN & ENGINEERING RULES:
1. RENDER THE ACTUAL REAL PRODUCT:
   - Build the true functioning digital product (e.g., modern store, booking app, finance dashboard, SaaS portal, fitness tracker, etc.).
   - NEVER generate project management tools, requirement tables, or documentation unless the product itself IS a project management tool.
2. VISUAL AESTHETICS (ANTI-AI-SLOP):
   - Include Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
   - Include Google Fonts (<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">) with font-family styled font-sans.
   - Generous breathing room, subtle dark/light contrast, polished backdrop-blur cards, elegant pill badges, and refined shadows.
   - Realistic mock data (realistic prices, proper names, high quality Unsplash photos).
3. RICH JAVASCRIPT INTERACTIVITY:
   - All tabs, filters, category selectors, modals, form validations, search inputs, and sliders MUST WORK smoothly in Vanilla JS inside <script> tags at the bottom.
   - Include smooth animations, working notifications/toasts on actions, and state toggles.
4. OUTPUT FORMAT:
   - Output valid single-file HTML inside a single \`\`\`html ... \`\`\` code block.
   - Do NOT include conversational filler text outside the markdown code block.`;

  const instructionPrompt = userPrompt && userPrompt.trim()
    ? `REVISI / PERMINTAAN PENGGUNA:
${userPrompt}

PRODUK DASAR:
Nama: ${projectTitle}
Overview: ${prdOverview}
${existingCode}
Perbarui kode aplikasi agar memenuhi permintaan di atas dengan sempurna!`
    : `Buatkan aplikasi web interaktif lengkap untuk produk berikut:

NAMA PRODUK: ${projectTitle}
DESKRIPSI / OVERVIEW:
${prdOverview}

FITUR-FITUR UTAMA:
${featuresText || "- Fitur inti sesuai PRD"}

ALUR PENGGUNA:
${userFlow || "Standard primary user flow"}

TASK IMPLEMENTASI:
${tasksText || "- Implementasi antarmuka dan interaksi utama"}

Pastikan aplikasi tampil spektakuler, modern, dan seluruh tombol serta navigasi dapat dicoba langsung!`;

  try {
    const chatUrl = `${baseUrl}/api/chat`;
    const res = await fetch(chatUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: instructionPrompt },
        ],
        model: "novita:qwen/qwen3.8-flash",
        max_tokens: 8192,
        taskType: "code",
        userId,
      }),
    });

    if (!res.ok) {
      console.warn("[api/sandbox] AI call returned non-200, fallback to default starter");
      return generateDefaultStarterFiles(projectTitle, prdOverview);
    }

    // Handle SSE streaming response
    if (res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawStream = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            const chunk = parsed.choices?.[0]?.delta?.content || "";
            if (chunk) rawStream += chunk;
          } catch {}
        }
      }

      if (rawStream.trim()) {
        return parseAiCodeFiles(rawStream, projectTitle);
      }
    }
  } catch (err) {
    console.warn("[api/sandbox] Error generating code with AI:", err);
  }

  return generateDefaultStarterFiles(projectTitle, prdOverview);
}

// ── GET: Ambil status sandbox proyek ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    let clerkUserId: string | null = null;
    try {
      const a = await auth();
      clerkUserId = a.userId;
    } catch {}

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId")?.trim();
    const userId = clerkUserId || searchParams.get("userId")?.trim();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId wajib disertakan." },
        { status: 400 }
      );
    }

    const state = getSandboxStateForProject(projectId, userId || undefined);
    return NextResponse.json({
      success: true,
      sandbox: state,
      isVercelConfigured: isVercelSandboxConfigured(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Gagal mengambil status sandbox." },
      { status: 500 }
    );
  }
}

// ── POST: Kelola siklus hidup sandbox (build, run, stop, iterate) ───────────────
export async function POST(req: NextRequest) {
  try {
    let clerkUserId: string | null = null;
    try {
      const a = await auth();
      clerkUserId = a.userId;
    } catch {}

    const body = await req.json();
    const {
      action = "build",
      projectId,
      projectTitle = "Usick App",
      prdOverview = "",
      features = [],
      tasks = [],
      userFlow = "",
      userPrompt = "",
      files: inputFiles,
      timeoutMs = 300_000,
    } = body;

    const userId = clerkUserId || body.userId;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId wajib disertakan." },
        { status: 400 }
      );
    }

    // 1. ACTION: STOP
    if (action === "stop") {
      const stopped = await stopSandboxForProject(projectId, userId);
      return NextResponse.json({
        success: true,
        stopped,
        message: "Sandbox berhasil dihentikan.",
      });
    }

    // 2. ACTION: STATUS
    if (action === "status") {
      const state = getSandboxStateForProject(projectId, userId);
      return NextResponse.json({
        success: true,
        sandbox: state,
      });
    }

    // 3. ACTION: BUILD / RUN / ITERATE
    let targetFiles: Record<string, string> = inputFiles || {};

    // Jika belum ada file atau user meminta revisi/generate baru dengan AI
    const needsAiGeneration =
      !inputFiles ||
      Object.keys(inputFiles).length === 0 ||
      (userPrompt && userPrompt.trim().length > 0);

    if (needsAiGeneration) {
      const origin = req.nextUrl.origin || "http://localhost:3000";
      targetFiles = await generateAppCodeWithAI({
        projectTitle,
        prdOverview,
        features,
        tasks,
        userFlow,
        userPrompt,
        currentFiles: targetFiles,
        baseUrl: origin,
        userId,
      });
    }

    // Jalankan sandbox
    const sandboxSession = await startSandboxForProject({
      projectId,
      userId,
      projectTitle,
      files: targetFiles,
      timeoutMs,
    });

    return NextResponse.json({
      success: true,
      sandbox: sandboxSession,
      isVercelConfigured: isVercelSandboxConfigured(),
    });
  } catch (err: any) {
    console.error("POST /api/sandbox error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memproses sandbox." },
      { status: 500 }
    );
  }
}
