"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { FaithNavProvider, FaithTabType } from "@/lib/faith/navigationContext";
import FaithChatView from "@/app/components/faith/views/FaithChatView";
import FaithBibleView from "@/app/components/faith/views/FaithBibleView";
import EntranceAnimation from "@/app/components/faith/EntranceAnimation";
import { getStoredUser, setStoredUser, DEFAULT_USER } from "@/lib/faith/session";
import { User, UserRole } from "@/types/database";

interface FaithWorkspaceProps {
  isDark: boolean;
  onClose?: () => void;
  onTogglePanel?: () => void;
  subTabsElement?: React.ReactNode;
}

export function FaithWorkspace({
  isDark,
  onClose,
  onTogglePanel,
}: FaithWorkspaceProps) {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<FaithTabType>("tanya");
  const [user, setUser] = useState<User>(() => getStoredUser());
  const [showIntro, setShowIntro] = useState(false);

  // Otomatis sinkronkan username akun terdaftar dari web OneMind
  useEffect(() => {
    const existing = getStoredUser();

    if (isClerkLoaded && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress || "";
      const username =
        clerkUser.username ||
        (clerkUser.publicMetadata?.username as string) ||
        clerkUser.firstName ||
        (email ? email.split("@")[0] : existing.name || "Anggota OneMind");
      const phone = clerkUser.primaryPhoneNumber?.phoneNumber || existing.phone || "";
      const avatarUrl = clerkUser.imageUrl || existing.avatar_url || null;
      const role = ((clerkUser.publicMetadata?.role as UserRole) || existing.role || "member") as UserRole;
      const token =
        existing.token && existing.token !== "A8X29K"
          ? existing.token
          : `CY${clerkUser.id.replace(/[^0-9]/g, "").slice(-4).padStart(4, "7")}`;

      const syncedUser: User = {
        ...existing,
        id: clerkUser.id,
        token,
        name: username,
        email,
        phone,
        avatar_url: avatarUrl,
        role,
        status: "active",
        community_group: existing.community_group || DEFAULT_USER.community_group,
      };

      setUser(syncedUser);
      setStoredUser(syncedUser);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("faith_hub_auth_changed"));
      }
    } else if (isClerkLoaded && !clerkUser) {
      // Jika mode tamu / belum login Clerk
      const guestUser: User = {
        ...existing,
        id: existing.id || "onemind-user",
        name: existing.name && existing.name !== "Filius Kristanto" ? existing.name : "Tamu OneMind",
        email: existing.email && existing.email !== "filius.kristanto@faithhub.id" ? existing.email : "",
      };
      setUser(guestUser);
      setStoredUser(guestUser);
    }
  }, [clerkUser, isClerkLoaded]);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("faith_hub_intro_seen");
      if (!seen) {
        setShowIntro(true);
      }
    } catch {}

    const handleAuthChange = () => {
      const u = getStoredUser();
      setUser(u);
    };

    window.addEventListener("faith_hub_auth_changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("faith_hub_auth_changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const handleIntroComplete = useCallback(() => {
    try {
      sessionStorage.setItem("faith_hub_intro_seen", "true");
    } catch {}
    setShowIntro(false);
  }, []);

  // Pastikan activeTab hanya antara 'tanya' atau 'bible'
  const currentTab: FaithTabType = activeTab === "bible" ? "bible" : "tanya";

  return (
    <FaithNavProvider
      value={{
        activeTab: currentTab,
        setActiveTab,
        onTogglePanel,
        onClose,
        isDark,
      }}
    >
      <div
        className={`flex flex-col h-full w-full overflow-hidden transition-colors duration-300 relative ${
          isDark ? "bg-[#0B0B0D] text-white" : "bg-[#E5E5E5] text-[#111113]"
        }`}
      >
        {/* Sacred Cross Entrance Splash Animation */}
        {showIntro && user && <EntranceAnimation onComplete={handleIntroComplete} />}

        {/* ─── BODY: FAITH HUB TABS (HANYA CHAT & ALKITAB, TANPA HEADER TAB/X) ─── */}
        <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col items-center justify-center sm:px-4 sm:py-3">
          {/* Tanya Rohani */}
          <div className={`h-full w-full ${currentTab === "tanya" ? "flex flex-col flex-1 min-h-0 items-center justify-center" : "hidden"}`}>
            <FaithChatView />
          </div>

          {/* Alkitab */}
          <div className={`h-full w-full ${currentTab === "bible" ? "flex flex-col flex-1 min-h-0 items-center justify-center" : "hidden"}`}>
            <FaithBibleView />
          </div>
        </div>
      </div>
    </FaithNavProvider>
  );
}
