"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { Mic, MicOff, X, Sparkles } from "lucide-react";

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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);
  const statusRef = useRef<"listening" | "thinking" | "speaking" | "idle">("listening");
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestSpeechBufferRef = useRef<string>("");

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Warm up / unlock Web Audio API immediately on user action or modal mount
  const ensureAudioContext = useCallback(async () => {
    try {
      if (typeof window === "undefined") return null;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch (e) {
      console.warn("[audio-context] resume error:", e);
      return null;
    }
  }, []);

  // Stop currently playing speech audio
  const stopCurrentAudio = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch {}
      currentSourceRef.current = null;
    }
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = "";
      } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Fallback instant browser speech synthesis
  const fallbackSpeech = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      stopCurrentAudio();
      setStatus("speaking");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) => v.lang.startsWith("id") || v.lang.toLowerCase().includes("indonesia")
      );
      if (idVoice) {
        utterance.voice = idVoice;
        utterance.lang = idVoice.lang;
      } else {
        utterance.lang = "id-ID";
      }

      utterance.onend = () => {
        setStatus("listening");
        isProcessingRef.current = false;
        latestSpeechBufferRef.current = "";
      };
      utterance.onerror = () => {
        setStatus("listening");
        isProcessingRef.current = false;
        latestSpeechBufferRef.current = "";
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setStatus("listening");
      isProcessingRef.current = false;
      latestSpeechBufferRef.current = "";
    }
  }, [stopCurrentAudio]);

  // High fidelity Web Audio PCM playback (bypasses browser data URI limitations)
  const playAudioData = useCallback(async (base64Data: string, mime: string, fallbackText: string) => {
    stopCurrentAudio();
    setStatus("speaking");

    try {
      // 1. Decode base64 bytes
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 2. Play via Web Audio API (Native 24kHz PCM WAV decoding)
      const ctx = await ensureAudioContext();
      if (ctx) {
        // Clone buffer to avoid detached ArrayBuffer issues
        const bufferCopy = bytes.buffer.slice(0);
        const decodedBuffer = await ctx.decodeAudioData(bufferCopy);

        const source = ctx.createBufferSource();
        source.buffer = decodedBuffer;
        source.connect(ctx.destination);
        currentSourceRef.current = source;

        source.onended = () => {
          currentSourceRef.current = null;
          setStatus("listening");
          isProcessingRef.current = false;
          latestSpeechBufferRef.current = "";
        };

        source.start(0);
        return;
      }
    } catch (webAudioErr) {
      console.warn("[web-audio] decode failed, trying Blob URL:", webAudioErr);
    }

    // 3. Fallback: Blob URL on HTMLAudioElement
    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime || "audio/wav" });
      const blobUrl = URL.createObjectURL(blob);

      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      const player = audioPlayerRef.current;
      player.src = blobUrl;

      player.onended = () => {
        URL.revokeObjectURL(blobUrl);
        setStatus("listening");
        isProcessingRef.current = false;
        latestSpeechBufferRef.current = "";
      };
      player.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        fallbackSpeech(fallbackText);
      };

      await player.play();
    } catch (blobErr) {
      console.warn("[blob-audio] play failed, falling back to speech synthesis:", blobErr);
      fallbackSpeech(fallbackText);
    }
  }, [ensureAudioContext, stopCurrentAudio, fallbackSpeech]);

  // Send query to Gemini voice API with ultra-fast turnaround
  const sendToGeminiVoice = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setStatus("thinking");

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

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

      if (data.audioBase64) {
        await playAudioData(data.audioBase64, data.audioMime || "audio/wav", reply);
      } else {
        fallbackSpeech(reply);
      }
    } catch (err) {
      console.warn("[voice-modal] API error:", err);
      setStatus("listening");
      isProcessingRef.current = false;
      latestSpeechBufferRef.current = "";
    }
  }, [conversationHistory, playAudioData, fallbackSpeech]);

  // Setup Web Speech Recognition with rapid silence debounce
  useEffect(() => {
    if (!isOpen) return;

    // Unlock audio context right when modal mounts
    ensureAudioContext();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = "id-ID";

      recognizer.onresult = (event: any) => {
        if (isProcessingRef.current || statusRef.current === "speaking") return;

        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (!currentText) return;

        latestSpeechBufferRef.current = currentText;
        setTranscript(currentText);

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (finalTranscript.trim() && !isProcessingRef.current) {
          const textToSend = latestSpeechBufferRef.current;
          latestSpeechBufferRef.current = "";
          sendToGeminiVoice(textToSend);
          return;
        }

        silenceTimerRef.current = setTimeout(() => {
          if (
            !isProcessingRef.current &&
            statusRef.current === "listening" &&
            latestSpeechBufferRef.current.trim()
          ) {
            const textToSend = latestSpeechBufferRef.current;
            latestSpeechBufferRef.current = "";
            sendToGeminiVoice(textToSend);
          }
        }, 750);
      };

      recognizer.onerror = (e: any) => {
        if (e.error !== "no-speech") {
          console.warn("[speech-recognition] error:", e.error);
        }
      };

      recognizer.onend = () => {
        if (
          isOpen &&
          isMicActive &&
          !isProcessingRef.current &&
          statusRef.current === "listening"
        ) {
          try {
            recognizer.start();
          } catch {}
        }
      };

      recognitionRef.current = recognizer;

      try {
        if (isMicActive) {
          recognizer.start();
        }
      } catch {}

      return () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        try {
          recognizer.stop();
        } catch {}
      };
    }
  }, [isOpen, isMicActive, sendToGeminiVoice, ensureAudioContext]);

  // Stop audio and cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      stopCurrentAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      isProcessingRef.current = false;
      latestSpeechBufferRef.current = "";
      setTranscript("");
      setAiReply("");
      setStatus("listening");
    }
  }, [isOpen, stopCurrentAudio]);

  const toggleMic = () => {
    ensureAudioContext();
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
    <div
      onClick={ensureAudioContext}
      className="fixed inset-0 z-50 flex flex-col justify-between items-center p-6 sm:p-10 select-none animate-in fade-in-0 duration-300"
    >
      {/* Background with frosted blur and theme-adaptive gradient */}
      <div
        className={`absolute inset-0 transition-colors ${
          isDark
            ? "bg-[#09090b]/98 backdrop-blur-3xl"
            : "bg-[#f8f9fa]/98 backdrop-blur-3xl"
        }`}
      />

      {/* ─── Top Header Bar ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md transition-colors ${
              isDark
                ? "border-zinc-800 bg-zinc-900/80 text-zinc-200"
                : "border-zinc-200/90 bg-white/90 text-zinc-800 shadow-xs"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDark ? "text-zinc-400" : "text-zinc-600"}`} />
            <span className="text-xs font-semibold tracking-wide">
              Voice Assistant · Gemini 3.8 Live
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`h-10 w-10 flex items-center justify-center rounded-full transition cursor-pointer border ${
            isDark
              ? "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
              : "bg-white border-zinc-200/90 text-zinc-600 hover:text-black hover:bg-zinc-100 shadow-xs"
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
            enableVoiceControl={isMicActive}
            voiceSensitivity={1.6}
            isMonochrome={true}
            isDark={isDark}
            isAiSpeaking={status === "speaking"}
            className={`w-full h-full transition-all duration-500 ${
              isDark
                ? "drop-shadow-[0_0_60px_rgba(255,255,255,0.12)]"
                : "drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            }`}
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
                isDark ? "text-zinc-100" : "text-zinc-900"
              }`}
            >
              {status === "listening" && "Mendengarkan Anda..."}
              {status === "thinking" && "Sedang berpikir..."}
              {status === "speaking" && "One Mind sedang berbicara..."}
              {status === "idle" && "Mikrofon Dijeda"}
            </span>
          </div>

          {/* Subtitle / Transcription Snippet */}
          <div className="min-h-[44px] flex items-center justify-center max-w-lg px-4">
            {transcript && status !== "speaking" ? (
              <p className={`text-xs sm:text-sm italic ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                "{transcript}"
              </p>
            ) : aiReply && status === "speaking" ? (
              <p className={`text-xs sm:text-sm font-medium line-clamp-2 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
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

      {/* ─── Bottom Action Controls: Large Icon Buttons ─────────────────── */}
      <div className="relative z-10 w-full max-w-sm flex items-center justify-center gap-6 sm:gap-8 pb-4 sm:pb-6">
        {/* Mic Toggle Button (Only Icon, Large) */}
        <button
          type="button"
          onClick={toggleMic}
          className={`h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer shadow-xl hover:scale-105 active:scale-95 ${
            isMicActive
              ? isDark
                ? "bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700 shadow-zinc-950/40"
                : "bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-zinc-300/40"
              : isDark
                ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                : "bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
          }`}
          title={isMicActive ? "Matikan Mikrofon (Mute)" : "Nyalakan Mikrofon"}
          aria-label={isMicActive ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicActive ? (
            <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
          ) : (
            <MicOff className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
          )}
        </button>

        {/* End Session Button (Only Icon X, Large) */}
        <button
          type="button"
          onClick={onClose}
          className={`h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer shadow-xl hover:scale-105 active:scale-95 ${
            isDark
              ? "bg-zinc-800/90 hover:bg-red-600 hover:text-white text-zinc-300 border border-zinc-700 shadow-zinc-950/40"
              : "bg-white hover:bg-red-600 hover:text-white text-zinc-700 border border-zinc-200 shadow-zinc-300/40"
          }`}
          title="Akhiri Percakapan Suara"
          aria-label="Tutup Percakapan Suara"
        >
          <X className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
      </div>
    </div>
  );
}
