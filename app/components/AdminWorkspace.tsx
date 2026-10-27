"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Users,
  Activity,
  Cpu,
  AlertTriangle,
  RotateCw,
  Search,
  CheckCircle2,
  XCircle,
  Database,
  ArrowLeft,
  Server,
  Sparkles,
  Layers,
  HelpCircle,
  Clock,
} from "lucide-react";

interface AdminWorkspaceProps {
  isDark?: boolean;
  onClose: () => void;
  onTogglePanel?: () => void;
}

type AdminTab = "overview" | "users" | "ai" | "performance" | "alerts";

interface AdminStatsResponse {
  admin: {
    email: string;
    username: string;
  };
  overview: {
    totalUsers: number;
    proSubscribers: number;
    freeUsers: number;
    totalAiRequests: number;
    totalTokensOverall: number;
    services: {
      database: {
        status: "online" | "offline";
        latencyMs: number | null;
      };
      auth: {
        status: "online" | "degraded";
        latencyMs: number | null;
      };
    };
    alertsCount: number;
  };
  users: {
    total: number;
    list: Array<{
      id: string;
      email: string;
      isEmailVerified: boolean;
      username: string;
      fullName: string;
      plan: string;
      status: string;
      createdAt: string | null;
      lastSignInAt: string | null;
    }>;
  };
  aiUsage: {
    totalRequests: number;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    models: Array<{
      modelId: string;
      requests: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    }>;
    taskTypes: Array<{ type: string; count: number }>;
    recentTransactions: Array<{
      id: string;
      userId: string;
      creditType: string;
      amount: number;
      transactionType: string;
      modelId: string;
      taskType: string;
      tokens: number;
      createdAt: string;
    }>;
    avgLatency: number | null;
    avgLatencyNote: string;
    estimatedCost: number | null;
    estimatedCostNote: string;
  };
  performance: {
    environment: string;
    databaseLatencyMs: number | null;
    clerkLatencyMs: number | null;
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
    };
    serverCpuUsage: number | null;
    serverCpuNote: string;
    bandwidthIo: number | null;
    bandwidthIoNote: string;
  };
  alerts: {
    list: Array<{
      id: string;
      level: "normal" | "info" | "warning";
      title: string;
      message: string;
      timestamp: string;
    }>;
  };
}

export function AdminWorkspace({ isDark = true, onClose }: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdminStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/stats", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Gagal memuat data admin`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("[AdminWorkspace] Error fetching stats:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat panel admin.";
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  // Styling helper tokens
  const bgCard = isDark
    ? "bg-zinc-900/60 border border-white/10"
    : "bg-white/80 border border-black/10";
  const textTitle = isDark ? "text-white" : "text-black";
  const textSub = isDark ? "text-zinc-400" : "text-zinc-600";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-400";
  const tableHeaderBg = isDark ? "bg-zinc-900/90 text-zinc-400" : "bg-zinc-100 text-zinc-600";
  const tableRowHover = isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]";
  const tableBorder = isDark ? "border-white/5" : "border-black/5";

  // Filtered users for Users tab
  const filteredUsers = (data?.users.list || []).filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className={`h-full w-full flex flex-col overflow-hidden select-text ${
        isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      {/* ─── TOP BAR ──────────────────────────────────────────────────────── */}
      <header
        className={`px-4 sm:px-6 py-3.5 border-b shrink-0 flex items-center justify-between gap-3 ${
          isDark ? "bg-zinc-950/80 border-white/10" : "bg-white/80 border-black/10"
        } backdrop-blur-md`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
              isDark
                ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                : "hover:bg-zinc-100 text-zinc-600 hover:text-black"
            }`}
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                isDark ? "bg-white/10 text-white" : "bg-black/10 text-black"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={`text-base font-semibold truncate ${textTitle}`}>Admin Panel</h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isDark
                      ? "bg-zinc-800/80 text-zinc-300 border-zinc-700"
                      : "bg-zinc-200/80 text-zinc-700 border-zinc-300"
                  }`}
                >
                  Usick One
                </span>
              </div>
              <p className={`text-xs truncate ${textSub}`}>
                {data?.admin.email ? `Login: ${data.admin.email}` : "Memeriksa identitas..."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchAdminStats(true)}
            disabled={loading || isRefreshing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              isDark
                ? "border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                : "border-black/10 hover:bg-zinc-100 text-zinc-700 hover:text-black"
            } disabled:opacity-50`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </header>

      {/* ─── TAB NAVIGATION BAR ───────────────────────────────────────────── */}
      <nav
        className={`px-4 sm:px-6 border-b shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar ${
          isDark ? "bg-zinc-950/40 border-white/5" : "bg-zinc-100/60 border-black/5"
        }`}
      >
        {(
          [
            { id: "overview", label: "Overview", icon: Layers },
            { id: "users", label: "Users", icon: Users },
            { id: "ai", label: "AI Usage", icon: Sparkles },
            { id: "performance", label: "Performance", icon: Cpu },
            { id: "alerts", label: "Alerts", icon: AlertTriangle },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? isDark
                    ? "border-white text-white font-semibold"
                    : "border-black text-black font-semibold"
                  : isDark
                  ? "border-transparent text-zinc-400 hover:text-zinc-200"
                  : "border-transparent text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ─── MAIN CONTENT VIEW ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RotateCw className={`w-6 h-6 animate-spin ${textSub}`} />
            <p className={`text-xs ${textSub}`}>Memuat metrik sistem...</p>
          </div>
        ) : error ? (
          <div
            className={`max-w-xl mx-auto my-8 p-5 rounded-2xl border text-center ${
              isDark ? "bg-red-950/20 border-red-900/50" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center bg-red-500/10 text-red-500">
              <XCircle className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-semibold mb-1 ${textTitle}`}>Akses Ditolak atau Terjadi Galat</h3>
            <p className={`text-xs mb-4 ${textSub}`}>{error}</p>
            <button
              type="button"
              onClick={() => fetchAdminStats()}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : data ? (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* ─── TAB 1: OVERVIEW ────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* 4 Core Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className={`p-4 rounded-2xl ${bgCard}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${textSub}`}>Total Pengguna</span>
                      <Users className={`w-4 h-4 ${textMuted}`} />
                    </div>
                    <div className={`text-2xl font-bold ${textTitle}`}>
                      {data.overview.totalUsers.toLocaleString("id-ID")}
                    </div>
                    <div className={`text-[11px] mt-1 ${textMuted}`}>
                      {data.overview.proSubscribers} Pro · {data.overview.freeUsers} Free
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl ${bgCard}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${textSub}`}>Pelanggan Pro</span>
                      <Sparkles className={`w-4 h-4 ${textMuted}`} />
                    </div>
                    <div className={`text-2xl font-bold ${textTitle}`}>
                      {data.overview.proSubscribers.toLocaleString("id-ID")}
                    </div>
                    <div className={`text-[11px] mt-1 ${textMuted}`}>Langganan berbayar aktif</div>
                  </div>

                  <div className={`p-4 rounded-2xl ${bgCard}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${textSub}`}>Total Request AI</span>
                      <Activity className={`w-4 h-4 ${textMuted}`} />
                    </div>
                    <div className={`text-2xl font-bold ${textTitle}`}>
                      {data.overview.totalAiRequests.toLocaleString("id-ID")}
                    </div>
                    <div className={`text-[11px] mt-1 ${textMuted}`}>Riwayat transaksi konsumsi</div>
                  </div>

                  <div className={`p-4 rounded-2xl ${bgCard}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${textSub}`}>Total Token AI</span>
                      <Cpu className={`w-4 h-4 ${textMuted}`} />
                    </div>
                    <div className={`text-2xl font-bold ${textTitle}`}>
                      {data.overview.totalTokensOverall.toLocaleString("id-ID")}
                    </div>
                    <div className={`text-[11px] mt-1 ${textMuted}`}>Input + output token diproses</div>
                  </div>
                </div>

                {/* Service Health Snapshot */}
                <div className={`p-5 rounded-2xl ${bgCard} space-y-4`}>
                  <h3 className={`text-sm font-semibold ${textTitle}`}>Status Layanan Inti</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        isDark ? "border-white/5 bg-zinc-950/40" : "border-black/5 bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-4 h-4 text-zinc-400" />
                        <div>
                          <div className={`text-xs font-medium ${textTitle}`}>Supabase Database</div>
                          <div className={`text-[11px] ${textMuted}`}>
                            Latensi kueri: {data.overview.services.database.latencyMs ?? "—"} ms
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          data.overview.services.database.status === "online"
                            ? isDark
                              ? "bg-emerald-950/50 text-emerald-400 border-emerald-800"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-950/50 text-red-400 border-red-800"
                        }`}
                      >
                        {data.overview.services.database.status.toUpperCase()}
                      </span>
                    </div>

                    <div
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        isDark ? "border-white/5 bg-zinc-950/40" : "border-black/5 bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Server className="w-4 h-4 text-zinc-400" />
                        <div>
                          <div className={`text-xs font-medium ${textTitle}`}>Clerk Auth SDK</div>
                          <div className={`text-[11px] ${textMuted}`}>
                            Latensi API: {data.overview.services.auth.latencyMs ?? "—"} ms
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          data.overview.services.auth.status === "online"
                            ? isDark
                              ? "bg-emerald-950/50 text-emerald-400 border-emerald-800"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-950/50 text-amber-400 border-amber-800"
                        }`}
                      >
                        {data.overview.services.auth.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Alert Card */}
                <div className={`p-5 rounded-2xl ${bgCard} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        data.overview.alertsCount > 0 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    />
                    <div>
                      <div className={`text-xs font-semibold ${textTitle}`}>
                        {data.overview.alertsCount > 0
                          ? `${data.overview.alertsCount} Peringatan Sistem Membutuhkan Perhatian`
                          : "Semua Sistem Berjalan Normal"}
                      </div>
                      <div className={`text-[11px] ${textSub}`}>
                        Klik tab Alerts untuk meninjau status terperinci.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("alerts")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      isDark
                        ? "border-white/10 hover:bg-zinc-800 text-zinc-200"
                        : "border-black/10 hover:bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    Buka Alerts
                  </button>
                </div>
              </div>
            )}

            {/* ─── TAB 2: USERS ───────────────────────────────────────────── */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className={`text-sm font-semibold ${textTitle}`}>Daftar Pengguna Terdaftar</h3>
                    <p className={`text-xs ${textSub}`}>
                      Total {data.users.total} akun terdata di sistem autentikasi Clerk (menampilkan {filteredUsers.length} pengguna).
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search
                      className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`}
                    />
                    <input
                      type="text"
                      placeholder="Cari email / username..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border outline-none transition ${
                        isDark
                          ? "bg-zinc-900/80 border-white/10 text-white focus:border-white/30"
                          : "bg-white border-black/10 text-black focus:border-black/30"
                      }`}
                    />
                  </div>
                </div>

                {/* Table */}
                <div className={`rounded-2xl border overflow-hidden ${bgCard}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className={tableHeaderBg}>
                        <tr>
                          <th className="px-4 py-3 font-semibold">Pengguna</th>
                          <th className="px-4 py-3 font-semibold">Email & Verifikasi</th>
                          <th className="px-4 py-3 font-semibold">Paket</th>
                          <th className="px-4 py-3 font-semibold">Bergabung</th>
                          <th className="px-4 py-3 font-semibold">Terakhir Aktif</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className={`px-4 py-8 text-center ${textMuted}`}>
                              Tidak ada pengguna yang cocok dengan pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className={`transition ${tableRowHover}`}>
                              <td className="px-4 py-3">
                                <div className={`font-medium ${textTitle}`}>{u.fullName}</div>
                                <div className={`text-[11px] ${textMuted}`}>@{u.username}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span className={`truncate max-w-[200px] ${textTitle}`}>
                                    {u.email}
                                  </span>
                                  {u.isEmailVerified ? (
                                    <span title="Email Terverifikasi" className="inline-flex shrink-0">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    </span>
                                  ) : (
                                    <span title="Email Belum Terverifikasi" className="inline-flex shrink-0">
                                      <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${
                                    u.plan === "pro"
                                      ? isDark
                                        ? "bg-zinc-800 text-white border-zinc-700"
                                        : "bg-black text-white border-black"
                                      : isDark
                                      ? "bg-zinc-900 text-zinc-400 border-zinc-800"
                                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                                  }`}
                                >
                                  {u.plan}
                                </span>
                              </td>
                              <td className={`px-4 py-3 ${textSub}`}>
                                {u.createdAt
                                  ? new Date(u.createdAt).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </td>
                              <td className={`px-4 py-3 ${textSub}`}>
                                {u.lastSignInAt
                                  ? new Date(u.lastSignInAt).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 3: AI USAGE ────────────────────────────────────────── */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className={`p-4 rounded-2xl ${bgCard}`}>
                    <div className={`text-xs font-medium mb-1 ${textSub}`}>Total AI Request</div>
                    <div className={`text-2xl font-bold ${textTitle}`}>
                      {data.aiUsage.totalRequests.toLocaleString("id-ID")}
                    </div>
                    <div className={`text-[11px] mt-1 ${textMuted}`}>Permintaan sukses tercatat</div>
                  </div>

                  <div className={`p-4 rounded-2xl ${bgCard}`}>
                    <div className={`text-xs font-medium mb-1 ${textSub}`}>Input Tokens</div>
                    <div className={`text-2xl font-bold ${textTitle}`}>
                      {data.aiUsage.inputTokens.toLocaleString("id-ID")}
                    </div>
                    <div className={`text-[11px] mt-1 ${textMuted}`}>Prompt & riwayat obrolan</div>
                  </div>

                  <div className={`p-4 rounded-2xl ${bgCard}`}>
                    <div className={`text-xs font-medium mb-1 ${textSub}`}>Output Tokens</div>
                    <div className={`text-2xl font-bold ${textTitle}`}>
                      {data.aiUsage.outputTokens.toLocaleString("id-ID")}
                    </div>
                    <div className={`text-[11px] mt-1 ${textMuted}`}>Respons hasil AI</div>
                  </div>
                </div>

                {/* Model Breakdown */}
                <div className={`p-5 rounded-2xl ${bgCard} space-y-3`}>
                  <h3 className={`text-sm font-semibold ${textTitle}`}>Penggunaan per Model AI</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className={tableHeaderBg}>
                        <tr>
                          <th className="px-4 py-2.5 font-semibold">Model ID</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Permintaan</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Input Tokens</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Output Tokens</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Total Tokens</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.aiUsage.models.length === 0 ? (
                          <tr>
                            <td colSpan={5} className={`px-4 py-6 text-center ${textMuted}`}>
                              Belum ada catatan transaksi model AI.
                            </td>
                          </tr>
                        ) : (
                          data.aiUsage.models.map((m) => (
                            <tr key={m.modelId} className={`transition ${tableRowHover}`}>
                              <td className={`px-4 py-2.5 font-medium ${textTitle}`}>{m.modelId}</td>
                              <td className={`px-4 py-2.5 text-right ${textSub}`}>
                                {m.requests.toLocaleString("id-ID")}
                              </td>
                              <td className={`px-4 py-2.5 text-right ${textSub}`}>
                                {m.inputTokens.toLocaleString("id-ID")}
                              </td>
                              <td className={`px-4 py-2.5 text-right ${textSub}`}>
                                {m.outputTokens.toLocaleString("id-ID")}
                              </td>
                              <td className={`px-4 py-2.5 text-right font-semibold ${textTitle}`}>
                                {m.totalTokens.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent AI Transactions Audit */}
                <div className={`p-5 rounded-2xl ${bgCard} space-y-3`}>
                  <h3 className={`text-sm font-semibold ${textTitle}`}>
                    20 Transaksi Kredit AI Terakhir
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className={tableHeaderBg}>
                        <tr>
                          <th className="px-4 py-2.5 font-semibold">Waktu</th>
                          <th className="px-4 py-2.5 font-semibold">Tipe Tugas</th>
                          <th className="px-4 py-2.5 font-semibold">Model</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Tokens</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Kredit Dipotong</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.aiUsage.recentTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className={`px-4 py-6 text-center ${textMuted}`}>
                              Belum ada transaksi AI tercatat.
                            </td>
                          </tr>
                        ) : (
                          data.aiUsage.recentTransactions.map((tx) => (
                            <tr key={tx.id} className={`transition ${tableRowHover}`}>
                              <td className={`px-4 py-2.5 ${textSub}`}>
                                {new Date(tx.createdAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </td>
                              <td className={`px-4 py-2.5 font-medium ${textTitle}`}>
                                <span className="uppercase text-[10px] tracking-wider font-bold">
                                  {tx.taskType}
                                </span>
                              </td>
                              <td className={`px-4 py-2.5 truncate max-w-[200px] ${textSub}`}>
                                {tx.modelId}
                              </td>
                              <td className={`px-4 py-2.5 text-right ${textSub}`}>
                                {tx.tokens.toLocaleString("id-ID")}
                              </td>
                              <td className={`px-4 py-2.5 text-right font-medium text-amber-400`}>
                                {tx.amount}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Honest Disclaimers for uncollected metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className={`p-4 rounded-xl border ${
                      isDark ? "border-white/5 bg-zinc-950/40" : "border-black/5 bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                      <span className={`text-xs font-semibold ${textTitle}`}>Average Latency</span>
                    </div>
                    <p className={`text-[11px] ${textMuted}`}>{data.aiUsage.avgLatencyNote}</p>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${
                      isDark ? "border-white/5 bg-zinc-950/40" : "border-black/5 bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                      <span className={`text-xs font-semibold ${textTitle}`}>
                        Estimated Billing Cost
                      </span>
                    </div>
                    <p className={`text-[11px] ${textMuted}`}>{data.aiUsage.estimatedCostNote}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 4: PERFORMANCE ─────────────────────────────────────── */}
            {activeTab === "performance" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className={`p-4 rounded-2xl ${bgCard}`}>
                    <div className={`text-xs font-medium mb-1 ${textSub}`}>Database Ping</div>
                    <div className={`text-2xl font-bold ${textTitle}`}>
                      {data.performance.databaseLatencyMs ?? "—"}{" "}
                      <span className="text-sm font-normal">ms</span>
                    </div>
                    <div className={`text-[11px] mt-1 ${textMuted}`}>Waktu respons kueri Supabase</div>
                  </div>

                  <div className={`p-4 rounded-2xl ${bgCard}`}>
                    <div className={`text-xs font-medium mb-1 ${textSub}`}>Clerk Auth Ping</div>
                    <div className={`text-2xl font-bold ${textTitle}`}>
                      {data.performance.clerkLatencyMs ?? "—"}{" "}
                      <span className="text-sm font-normal">ms</span>
                    </div>
                    <div className={`text-[11px] mt-1 ${textMuted}`}>Waktu respons backend SDK</div>
                  </div>

                  <div className={`p-4 rounded-2xl ${bgCard}`}>
                    <div className={`text-xs font-medium mb-1 ${textSub}`}>Node Heap Used</div>
                    <div className={`text-2xl font-bold ${textTitle}`}>
                      {data.performance.memory.heapUsedMB}{" "}
                      <span className="text-sm font-normal">MB</span>
                    </div>
                    <div className={`text-[11px] mt-1 ${textMuted}`}>
                      Dari {data.performance.memory.heapTotalMB} MB total alokasi
                    </div>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl ${bgCard} space-y-3`}>
                  <h3 className={`text-sm font-semibold ${textTitle}`}>Informasi Lingkungan Server</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? "border-white/5 bg-zinc-950/40" : "border-black/5 bg-zinc-50"
                      }`}
                    >
                      <span className={textMuted}>Environment</span>
                      <div className={`font-semibold mt-0.5 ${textTitle}`}>
                        {data.performance.environment}
                      </div>
                    </div>
                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? "border-white/5 bg-zinc-950/40" : "border-black/5 bg-zinc-50"
                      }`}
                    >
                      <span className={textMuted}>Framework</span>
                      <div className={`font-semibold mt-0.5 ${textTitle}`}>Next.js 16.3.4</div>
                    </div>
                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? "border-white/5 bg-zinc-950/40" : "border-black/5 bg-zinc-50"
                      }`}
                    >
                      <span className={textMuted}>Runtime</span>
                      <div className={`font-semibold mt-0.5 ${textTitle}`}>Node.js</div>
                    </div>
                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? "border-white/5 bg-zinc-950/40" : "border-black/5 bg-zinc-50"
                      }`}
                    >
                      <span className={textMuted}>Resident Memory (RSS)</span>
                      <div className={`font-semibold mt-0.5 ${textTitle}`}>
                        {data.performance.memory.rssMB} MB
                      </div>
                    </div>
                  </div>
                </div>

                {/* Honest Disclaimers for Container CPU & Bandwidth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className={`p-4 rounded-xl border ${
                      isDark ? "border-white/5 bg-zinc-950/40" : "border-black/5 bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                      <span className={`text-xs font-semibold ${textTitle}`}>
                        Container CPU Usage
                      </span>
                    </div>
                    <p className={`text-[11px] ${textMuted}`}>{data.performance.serverCpuNote}</p>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${
                      isDark ? "border-white/5 bg-zinc-950/40" : "border-black/5 bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                      <span className={`text-xs font-semibold ${textTitle}`}>
                        Network Bandwidth & I/O
                      </span>
                    </div>
                    <p className={`text-[11px] ${textMuted}`}>{data.performance.bandwidthIoNote}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 5: ALERTS ──────────────────────────────────────────── */}
            {activeTab === "alerts" && (
              <div className="space-y-4">
                <div>
                  <h3 className={`text-sm font-semibold ${textTitle}`}>Audit & Peringatan Sistem</h3>
                  <p className={`text-xs ${textSub}`}>
                    Daftar log audit status kesehatan koneksi dan keamanan operasional.
                  </p>
                </div>

                <div className="space-y-3">
                  {data.alerts.list.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                        item.level === "warning"
                          ? isDark
                            ? "bg-amber-950/20 border-amber-900/50"
                            : "bg-amber-50 border-amber-200"
                          : item.level === "info"
                          ? isDark
                            ? "bg-blue-950/20 border-blue-900/50"
                            : "bg-blue-50 border-blue-200"
                          : isDark
                          ? "bg-zinc-900/60 border-white/10"
                          : "bg-white/80 border-black/10"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {item.level === "warning" ? (
                          <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
                        ) : item.level === "info" ? (
                          <Activity className="w-4.5 h-4.5 text-blue-400" />
                        ) : (
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className={`text-xs font-semibold ${textTitle}`}>{item.title}</h4>
                          <span className={`text-[10px] shrink-0 ${textMuted}`}>
                            {new Date(item.timestamp).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${textSub}`}>{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
