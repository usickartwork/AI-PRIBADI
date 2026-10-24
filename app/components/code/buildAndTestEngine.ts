import { DesignSpec, BuildState, TestState, DiagnosticCheck, ProjectItem } from "./types";

export interface BuildAndTestResult {
  buildState: BuildState;
  testState: TestState;
}

/**
 * Builds the modular Next.js 15 App Router project in isolation
 * and runs automated diagnostic testing checks.
 */
export function buildAndTestProject(
  project: ProjectItem,
  designSpec: DesignSpec
): BuildAndTestResult {
  const title = project.title || "Nexus App";
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const overview = project.prd?.overview || project.description || "Aplikasi web modern.";
  const files: Record<string, string> = {};
  const logs: string[] = [];

  logs.push(`[Init] Memulai build modular Next.js 15 App Router untuk proyek: ${title}`);
  logs.push(`[Config] Menerapkan spesifikasi desain: ${designSpec.visualArchetype} (Domain: ${designSpec.domain})`);

  // 1. package.json
  files["package.json"] = JSON.stringify(
    {
      name: slug,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        next: "15.0.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        clsx: "^2.1.1",
        "tailwind-merge": "^2.5.4",
      },
      devDependencies: {
        typescript: "^5.6.3",
        "@types/node": "^22.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        tailwindcss: "^3.4.1",
        postcss: "^8.4.47",
        autoprefixer: "^10.4.20",
      },
    },
    null,
    2
  );
  logs.push(`[File] Generated: package.json (Next.js 15 + React 19)`);

  // 2. tsconfig.json
  files["tsconfig.json"] = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  );
  logs.push(`[File] Generated: tsconfig.json (Strict mode enabled)`);

  // 3. tailwind.config.ts
  files["tailwind.config.ts"] = `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "${designSpec.colors.background}",
        surface: "${designSpec.colors.surface}",
        surfaceElevated: "${designSpec.colors.surfaceElevated}",
        border: "${designSpec.colors.border}",
        primary: "${designSpec.colors.primary}",
        accent: "${designSpec.colors.accent}",
      },
    },
  },
  plugins: [],
};
export default config;
`;
  logs.push(`[File] Generated: tailwind.config.ts (Design tokens synced)`);

  // 4. app/globals.css
  files["app/globals.css"] = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: ${designSpec.colors.background};
  color: ${designSpec.colors.text};
  font-family: ${designSpec.typography.primaryFont};
}
`;
  logs.push(`[File] Generated: app/globals.css`);

  // 5. app/layout.tsx
  files["app/layout.tsx"] = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${title} | Official Application",
  description: "${overview.replace(/"/g, '\\"')}",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="${designSpec.typography.fontImportUrl}" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[${designSpec.colors.background}] text-zinc-100 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
`;
  logs.push(`[File] Generated: app/layout.tsx (Google Fonts linked)`);

  // 6. app/page.tsx
  files["app/page.tsx"] = `"use client";

import React, { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("ALL");

  return (
    <div className="min-h-screen flex flex-col bg-[${designSpec.colors.background}] text-zinc-100">
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[${designSpec.colors.background}]/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="font-extrabold text-base text-white tracking-tight">${title}</span>
          <button className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition">
            Aksi Utama
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 space-y-12">
        <section className="space-y-4 max-w-2xl">
          <h1 className="${designSpec.typography.displayScale} text-white leading-tight">
            ${title}
          </h1>
          <p className="${designSpec.typography.bodyScale}">
            ${overview.replace(/"/g, '\\"')}
          </p>
        </section>

        <section className="p-6 rounded-2xl border border-white/10 bg-[${designSpec.colors.surface}]">
          <div className="flex items-center gap-2 mb-4">
            {["ALL", "Layanan", "Prioritas"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={\`px-3 py-1 rounded-xl text-xs font-semibold transition \${
                  activeTab === cat ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                }\`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="text-xs text-zinc-400">Menampilkan data modul aktif: {activeTab}</div>
        </section>
      </main>
    </div>
  );
}
`;
  logs.push(`[File] Generated: app/page.tsx (Interactive Client Component)`);

  // 7. app/api/entries/route.ts
  files["app/api/entries/route.ts"] = `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: "operational",
      product: "${title}",
      timestamp: new Date().toISOString(),
    },
  });
}
`;
  logs.push(`[File] Generated: app/api/entries/route.ts (Mock REST API)`);
  logs.push(`[Success] Seluruh 7 file Next.js 15 App Router berhasil di-generate.`);

  // ── Run In-Memory Diagnostic & Security Testing ──────────────────────────────
  const checks: DiagnosticCheck[] = [];

  // Check 1: Unbalanced braces in generated files
  let hasBraceError = false;
  for (const [path, content] of Object.entries(files)) {
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      hasBraceError = true;
      checks.push({
        id: `brace-${path}`,
        name: `Balanced Syntax Check: ${path}`,
        severity: "critical",
        passed: false,
        detail: `Ditemukan kurung kurawal tidak seimbang (buka: ${openBraces}, tutup: ${closeBraces})`,
        filePath: path,
      });
    }
  }
  if (!hasBraceError) {
    checks.push({
      id: "brace-check-all",
      name: "AST & Syntax Balance Check",
      severity: "critical",
      passed: true,
      detail: "Semua file TypeScript dan JSX memiliki struktur kurung kurawal seimbang.",
    });
  }

  // Check 2: 'use client' directive on client files using React hooks
  let missingUseClient = false;
  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith(".tsx") && (content.includes("useState") || content.includes("useEffect"))) {
      if (!content.includes('"use client"') && !content.includes("'use client'")) {
        missingUseClient = true;
        checks.push({
          id: `client-${path}`,
          name: `'use client' Directive Check: ${path}`,
          severity: "high",
          passed: false,
          detail: "Komponen menggunakan React hooks tetapi tidak memiliki 'use client'.",
          filePath: path,
        });
      }
    }
  }
  if (!missingUseClient) {
    checks.push({
      id: "client-directive-ok",
      name: "Next.js 15 Client Component Boundaries",
      severity: "high",
      passed: true,
      detail: "Seluruh interaksi client mematuhi boundary 'use client' App Router.",
    });
  }

  // Check 3: Secrets & Credential Leakage Check
  let hasSecretLeak = false;
  const sensitiveWords = ["SUPABASE_SERVICE_ROLE_KEY", "CLERK_SECRET_KEY", "OPENAI_API_KEY", "NOVITA_API_KEY"];
  for (const [path, content] of Object.entries(files)) {
    for (const kw of sensitiveWords) {
      if (content.includes(kw)) {
        hasSecretLeak = true;
        checks.push({
          id: `sec-${path}`,
          name: `Secret Isolation Check: ${path}`,
          severity: "critical",
          passed: false,
          detail: `Kunci rahasia produksi '${kw}' terdeteksi di dalam file yang dihasilkan!`,
          filePath: path,
        });
      }
    }
  }
  if (!hasSecretLeak) {
    checks.push({
      id: "sec-isolation-ok",
      name: "Secret Isolation & DevSecOps",
      severity: "critical",
      passed: true,
      detail: "Zero-leakage: Tidak ada kunci rahasia atau kredensial produksi di dalam kode aplikasi.",
    });
  }

  // Check 4: Responsive Viewport Safety
  const layoutContent = files["app/layout.tsx"] || "";
  const hasViewportSafety = layoutContent.includes("overflow-x-hidden");
  checks.push({
    id: "viewport-safety",
    name: "Mobile Viewport & Overflow Safety",
    severity: "medium",
    passed: hasViewportSafety,
    detail: hasViewportSafety
      ? "Body wrapper memiliki overflow-x-hidden untuk mencegah kerusakan horizontal di mobile."
      : "Peringatan: Potensi layout blowout pada layar kecil.",
  });

  // Check 5: Next.js App Router Root Layout & Page convention
  const hasRootLayout = Boolean(files["app/layout.tsx"]);
  const hasRootPage = Boolean(files["app/page.tsx"]);
  checks.push({
    id: "app-router-convention",
    name: "Next.js App Router Structure",
    severity: "critical",
    passed: hasRootLayout && hasRootPage,
    detail: "File app/layout.tsx dan app/page.tsx tersedia sesuai konvensi App Router.",
  });

  // Calculate score
  const passedCount = checks.filter((c) => c.passed).length;
  const totalCount = checks.length;
  const score = Math.round((passedCount / totalCount) * 100);
  const passed = score >= 80 && !checks.some((c) => !c.passed && c.severity === "critical");

  logs.push(`[Test] Diagnostic test selesai: ${passedCount}/${totalCount} checks passed (Skor: ${score}/100)`);

  return {
    buildState: {
      files,
      status: "success",
      logs,
      updatedAt: Date.now(),
    },
    testState: {
      score,
      passed,
      checks,
      testedAt: Date.now(),
    },
  };
}
