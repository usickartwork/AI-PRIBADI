"use client";

import React, { useState } from "react";
import { SiteHeader } from "@/components/ui/site-header";
import { HomeInteractiveChat } from "@/components/ui/home-interactive-chat";
import { MeshDriftBackground } from "@/components/ui/mesh-drift-background";
import { CreatorBadge } from "@/components/ui/creator-badge";
import { AuthModal } from "@/app/components/AuthModal";

export default function UsickOnePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const openAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#09090b] text-white selection:bg-white/20 antialiased font-sans flex flex-col justify-between">
      {/* ─── Mesh Drift WebGL Background ─── */}
      <MeshDriftBackground isDark={true} />

      {/* Ambient overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-black/25" aria-hidden="true" />

      {/* ─── HEADER WITH BACK BUTTON, BRAND LOGO, NAV TABS, LOGIN ─── */}
      <SiteHeader
        showBack={true}
        backHref="/"
        activeItem="usick-one"
        onGetStarted={openAuth}
        className="relative z-20 border-b border-white/[0.08] bg-black/60 backdrop-blur-xl"
      />

      {/* ─── MAIN CONTENT: LIVE INTERACTIVE CHAT USICK ONE SAJA ─── */}
      <main className="relative z-10 w-full flex-1 max-w-4xl mx-auto px-3 sm:px-6 pt-6 sm:pt-10 pb-16 flex flex-col justify-center">
        <HomeInteractiveChat
          isDark={true}
          onGetStarted={(targetMode) => {
            openAuth(targetMode || "signup");
          }}
        />
      </main>

      {/* ─── FLOATING CREATOR ATTRIBUTION BADGE ─── */}
      <CreatorBadge alwaysVisible={true} />

      {/* Auth Modal for Signin / Signup */}
      <AuthModal
        isOpen={showAuthModal}
        isDark={true}
        initialMode={authMode}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
