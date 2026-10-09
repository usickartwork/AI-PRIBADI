"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { Mic, MicOff, X, Volume2, Sparkles } from "lucide-react";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function VoiceAssistantModal({
  isOpen,
  onClose,
  isDark,
}: VoiceAssistantModalProps) {
  const [isMicActive, setIsMicActive] = useState(true);
  const [status, setStatus] = useState<"listening" | "thinking" | "speaking" | "idle">("listening");
  const [transcript, setTranscript] = useState<string>("");
  const [aiReply, setAiReply] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);

  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);

  // Send query to Gemini voice API
  const sendToGeminiVoice = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setStatus("thinking");

    try {
      const res = await fetch("/api/voice/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userPrompt,
          history: conversationHistory,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal mendapatkan respons suara");
      }

      const data = await res.json();
      const reply = data.text || "Saya mendengarkan Anda.";
      setAiReply(reply);
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: userPrompt },
        { role: "assistant", content: reply },
      ]);

      // Play audio response
      if (data.audioBase64) {
        setStatus("speaking");
        const audioSrc = `data:${data.audioMime || "audio/wav"};base64,${data.audioBase64}`;
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        audioPlayerRef.current.src = audioSrc;
        audioPlayerRef.current.onended = () => {
          setStatus("listening");
          isProcessingRef.current = false;
        };
        audioPlayerRef.current.onerror = () => {
          fallbackSpeech(reply);
        };
        await audioPlayerRef.current.play();
      } else {
        fallbackSpeech(reply);
      }
    } catch (err) {
      console.warn("[voice-modal] API error:", err);
      setStatus("listening");
      isProcessingRef.current = false;
    }
  }, [conversationHistory]);

  // Fallback speech synthesis
  const fallbackSpeech = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setStatus("speaking");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;
      utterance.onend = () => {
        setStatus("listening");
        isProcessingRef.current = false;
      };
      utterance.onerror = () => {
        setStatus("listening");
        isProcessingRef.current = false;
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setStatus("listening");
      isProcessingRef.current = false;
    }
  };

  // Setup Web Speech Recognition
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = "id-ID";

      recognizer.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          setTranscript(currentText);
        }

        if (finalTranscript.trim() && !isProcessingRef.current) {
          sendToGeminiVoice(finalTranscript.trim());
        }
      };

      recognizer.onerror = (e: any) => {
        if (e.error !== "no-speech") {
          console.warn("[speech-recognition] error:", e.error);
        }
      };

      recognitionRef.current = recognizer;

      try {
        if (isMicActive) {
          recognizer.start();
        }
      } catch {}

      return () => {
        try {
          recognizer.stop();
        } catch {}
      };
    }
  }, [isOpen, isMicActive, sendToGeminiVoice]);

  // Stop audio on close or toggle
  useEffect(() => {
    if (!isOpen) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      isProcessingRef.current = false;
      setTranscript("");
      setAiReply("");
    }
  }, [isOpen]);

  const toggleMic = () => {
    if (isMicActive) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsMicActive(false);
      setStatus("idle");
    } else {
      try {
        recognitionRef.current?.start();
      } catch {}
      setIsMicActive(true);
      setStatus("listening");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between items-center p-6 sm:p-10 select-none animate-in fade-in-0 duration-300">
      {/* Background with frosted blur and mesh gradient */}
      <div
        className={`absolute inset-0 transition-colors ${
          isDark
            ? "bg-[#09090b]/95 backdrop-blur-2xl"
            : "bg-[#fcfcfd]/95 backdrop-blur-2xl"
        }`}
      />

      {/* ─── Top Header Bar ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 dark:border-white/10 bg-white/5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span className={`text-xs font-semibold tracking-wide ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
              Voice Assistant · Gemini 3.8 Live
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`h-10 w-10 flex items-center justify-center rounded-full transition cursor-pointer border ${
            isDark
              ? "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              : "bg-white border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-100 shadow-xs"
          }`}
          title="Tutup Voice Mode"
          aria-label="Tutup Voice Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Center Hero: Voice Powered Orb ──────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto w-full max-w-2xl text-center px-4">
        {/* Orb Container */}
        <div className="w-72 h-72 sm:w-96 sm:h-96 relative flex items-center justify-center">
          <VoicePoweredOrb
            enableVoiceControl={isMicActive && status !== "speaking"}
            voiceSensitivity={1.6}
            isMonochrome={true}
            className="w-full h-full drop-shadow-[0_0_50px_rgba(255,255,255,0.15)]"
          />
        </div>

        {/* Dynamic Status Indicator */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status === "listening"
                  ? "bg-emerald-500 animate-pulse"
                  : status === "thinking"
                  ? "bg-amber-400 animate-ping"
                  : status === "speaking"
                  ? "bg-blue-500 animate-bounce"
                  : "bg-zinc-500"
              }`}
            />
            <span
              className={`text-sm sm:text-base font-semibold tracking-tight ${
                isDark ? "text-zinc-200" : "text-zinc-800"
              }`}
            >
              {status === "listening" && "Mendengarkan Anda..."}
              {status === "thinking" && "Sedang berpikir..."}
              {status === "speaking" && "Gemini sedang berbicara..."}
              {status === "idle" && "Mikrofon Dijeda"}
            </span>
          </div>

          {/* Subtitle / Transcription Snippet */}
          <div className="min-h-[44px] flex items-center justify-center max-w-lg px-4">
            {transcript && status !== "speaking" ? (
              <p className={`text-xs sm:text-sm italic ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                "{transcript}"
              </p>
            ) : aiReply && status === "speaking" ? (
              <p className={`text-xs sm:text-sm font-medium line-clamp-2 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                "{aiReply}"
              </p>
            ) : (
              <p className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                Katakan sesuatu seperti "Halo, apa kabar?" atau ajukan pertanyaan apapun.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Controls Bar ─────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-sm flex items-center justify-center gap-4">
        {/* Mic Toggle Button */}
        <button
          type="button"
          onClick={toggleMic}
          className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-semibold transition shadow-lg cursor-pointer ${
            isMicActive
              ? isDark
                ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300"
              : "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
          }`}
          title={isMicActive ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicActive ? (
            <>
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Mikrofon Aktif</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-red-400" />
              <span>Mikrofon Mati</span>
            </>
          )}
        </button>

        {/* End Session Button */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer bg-red-600 hover:bg-red-500 text-white shadow-lg"
          title="Akhiri sesi suara"
        >
          <X className="w-4 h-4" />
          <span>Selesai</span>
        </button>
      </div>
    </div>
  );
}
