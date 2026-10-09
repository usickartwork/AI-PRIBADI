"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { Mic, MicOff, X } from "lucide-react";

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

  // Refs to guarantee stable callbacks and continuous full-duplex listening
  const isOpenRef = useRef(isOpen);
  const isMicActiveRef = useRef(isMicActive);
  const statusRef = useRef(status);
  const conversationHistoryRef = useRef(conversationHistory);
  const isProcessingRef = useRef(false);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedSpeechRef = useRef<string>("");

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

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

  // Stop currently playing speech audio immediately (used for interruption / menyela)
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

  // Safe restart of speech recognizer
  const safeStartRecognition = useCallback(() => {
    if (!isOpenRef.current || !isMicActiveRef.current || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (e: any) {
      // If already active or starting, ignore
    }
  }, []);

  // When AI finishes speaking naturally
  const handleSpeechFinished = useCallback(() => {
    currentSourceRef.current = null;
    setStatus("listening");
    isProcessingRef.current = false;
    accumulatedSpeechRef.current = "";
    setTranscript("");

    setTimeout(() => {
      safeStartRecognition();
    }, 100);
  }, [safeStartRecognition]);

  // Fallback browser speech synthesis with max volume
  const fallbackSpeech = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      stopCurrentAudio();
      setStatus("speaking");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) => v.lang.startsWith("id") || v.lang.toLowerCase().includes("indonesia")
      );
      if (idVoice) {
        utterance.voice = idVoice;
        utterance.lang = idVoice.lang;
      }

      utterance.onend = () => {
        handleSpeechFinished();
      };
      utterance.onerror = () => {
        handleSpeechFinished();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      handleSpeechFinished();
    }
  }, [stopCurrentAudio, handleSpeechFinished]);

  // High fidelity Web Audio playback (handles WAV & MP3) with volume booster & limiter
  const playAudioData = useCallback(async (base64Data: string, mime: string, fallbackText: string) => {
    stopCurrentAudio();
    setStatus("speaking");

    // NOTICE: We do NOT abort recognizer here!
    // The mic stays listening so the user can interrupt (menyela) anytime!

    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const ctx = await ensureAudioContext();
      if (ctx) {
        const bufferCopy = bytes.buffer.slice(0);
        const decodedBuffer = await ctx.decodeAudioData(bufferCopy);

        const source = ctx.createBufferSource();
        source.buffer = decodedBuffer;

        // Boost volume (2.4x amplification)
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(2.4, ctx.currentTime);

        // Dynamics compressor prevents distortion and ensures full sound
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-12, ctx.currentTime);
        compressor.knee.setValueAtTime(20, ctx.currentTime);
        compressor.ratio.setValueAtTime(8, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(compressor);
        compressor.connect(ctx.destination);
        currentSourceRef.current = source;

        source.onended = () => {
          // Only trigger if this source wasn't interrupted
          if (currentSourceRef.current === source) {
            handleSpeechFinished();
          }
        };

        source.start(0);
        return;
      }
    } catch (webAudioErr) {
      console.warn("[web-audio] decode failed, trying Blob URL:", webAudioErr);
    }

    // Fallback: Blob URL on HTMLAudioElement
    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime || "audio/mpeg" });
      const blobUrl = URL.createObjectURL(blob);

      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      const player = audioPlayerRef.current;
      player.volume = 1.0;
      player.src = blobUrl;

      player.onended = () => {
        URL.revokeObjectURL(blobUrl);
        handleSpeechFinished();
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
  }, [ensureAudioContext, stopCurrentAudio, fallbackSpeech, handleSpeechFinished]);

  // Send query to voice API with turnaround
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
          history: conversationHistoryRef.current,
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
      handleSpeechFinished();
    }
  }, [playAudioData, fallbackSpeech, handleSpeechFinished]);

  // Continuous Full-Duplex SpeechRecognition with instant Barge-in (Menyela)
  useEffect(() => {
    if (!isOpen) return;

    ensureAudioContext();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Browser tidak mendukung SpeechRecognition");
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = "id-ID";

    recognizer.onresult = (event: any) => {
      // Don't capture when waiting for AI server response (thinking)
      if (isProcessingRef.current) return;

      let finalChunk = "";
      let interimChunk = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const trans = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalChunk += trans;
        } else {
          interimChunk += trans;
        }
      }

      const spokenChunk = (finalChunk || interimChunk).trim();
      if (!spokenChunk) return;

      // ─── INSTANT BARGE-IN (MENYELA): If AI is speaking and user speaks, cut off AI speech immediately! ───
      if (statusRef.current === "speaking") {
        console.log("[voice-assistant] User interrupted! Cutting off AI audio immediately.");
        stopCurrentAudio();
        setStatus("listening");
        isProcessingRef.current = false;
        accumulatedSpeechRef.current = "";
      }

      if (finalChunk.trim()) {
        accumulatedSpeechRef.current = (accumulatedSpeechRef.current + " " + finalChunk).trim();
      }

      const currentFullText = (accumulatedSpeechRef.current + " " + interimChunk).trim();
      if (!currentFullText) return;

      setTranscript(currentFullText);

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Rapid silence debounce (750ms): when user finishes talking, send the question
      silenceTimerRef.current = setTimeout(() => {
        if (
          !isProcessingRef.current &&
          statusRef.current === "listening" &&
          currentFullText.trim()
        ) {
          const textToSend = currentFullText.trim();
          accumulatedSpeechRef.current = "";
          sendToGeminiVoice(textToSend);
        }
      }, 750);
    };

    recognizer.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        console.warn("[speech-recognition] error:", e.error);
      }
      if (isOpenRef.current && isMicActiveRef.current && e.error !== "not-allowed") {
        setTimeout(() => {
          if (isOpenRef.current && isMicActiveRef.current && !isProcessingRef.current) {
            safeStartRecognition();
          }
        }, 150);
      }
    };

    recognizer.onend = () => {
      // Auto-restart recognizer to maintain continuous conversational listening
      if (
        isOpenRef.current &&
        isMicActiveRef.current &&
        !isProcessingRef.current
      ) {
        setTimeout(() => {
          if (
            isOpenRef.current &&
            isMicActiveRef.current &&
            !isProcessingRef.current
          ) {
            safeStartRecognition();
          }
        }, 80);
      }
    };

    recognitionRef.current = recognizer;

    try {
      if (isMicActiveRef.current) {
        recognizer.start();
      }
    } catch {}

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      try {
        recognizer.abort();
      } catch {}
      recognitionRef.current = null;
    };
  }, [isOpen, sendToGeminiVoice, ensureAudioContext, stopCurrentAudio, safeStartRecognition]);

  // Stop audio and cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      stopCurrentAudio();
      isProcessingRef.current = false;
      accumulatedSpeechRef.current = "";
      setTranscript("");
      setAiReply("");
      setStatus("listening");
    }
  }, [isOpen, stopCurrentAudio]);

  const toggleMic = () => {
    ensureAudioContext();
    if (isMicActive) {
      setIsMicActive(false);
      isMicActiveRef.current = false;
      setStatus("idle");
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      try {
        recognitionRef.current?.abort();
      } catch {}
    } else {
      setIsMicActive(true);
      isMicActiveRef.current = true;
      setStatus("listening");
      setTimeout(() => {
        safeStartRecognition();
      }, 50);
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

      {/* ─── Top Header Bar: Voice Assistant One Mind (without icon) ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`px-4 py-1.5 rounded-full border backdrop-blur-md transition-colors ${
              isDark
                ? "border-zinc-800 bg-zinc-900/80 text-zinc-200"
                : "border-zinc-200/90 bg-white/90 text-zinc-800 shadow-xs"
            }`}
          >
            <span className="text-xs font-semibold tracking-wide">
              Voice Assistant One Mind
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
        {/* Orb Container (decoupled from mic stream to eliminate contention) */}
        <div className="w-72 h-72 sm:w-96 sm:h-96 relative flex items-center justify-center">
          <VoicePoweredOrb
            enableVoiceControl={false}
            isUserSpeaking={Boolean(transcript && status === "listening")}
            isAiSpeaking={status === "speaking"}
            isMonochrome={true}
            isDark={isDark}
            className={`w-full h-full transition-all duration-500 ${
              isDark
                ? "drop-shadow-[0_0_60px_rgba(255,255,255,0.12)]"
                : "drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            }`}
          />
        </div>

        {/* Dynamic Status Indicator (Pure Monochrome Theme Colors - No Green/Amber/Blue) */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                isDark ? "bg-white" : "bg-black"
              } ${
                status === "listening"
                  ? "animate-pulse"
                  : status === "thinking"
                  ? "animate-ping opacity-75"
                  : status === "speaking"
                  ? "animate-bounce"
                  : "opacity-30"
              }`}
            />
            <span
              className={`text-sm sm:text-base font-semibold tracking-tight ${
                isDark ? "text-zinc-100" : "text-zinc-900"
              }`}
            >
              {status === "listening" && "Mendengarkan Anda..."}
              {status === "thinking" && "Sedang berpikir..."}
              {status === "speaking" && "One Mind sedang berbicara... (Bisa Anda sela)"}
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
                Bicara kapan saja — Anda bisa menyela saat asisten sedang menjelaskan.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Action Controls: Large Icon Buttons (Pure Monochrome Theme) ─────────────────── */}
      <div className="relative z-10 w-full max-w-sm flex items-center justify-center gap-6 sm:gap-8 pb-4 sm:pb-6">
        {/* Mic Toggle Button (Only Icon, Large, Pure Theme Monochrome) */}
        <button
          type="button"
          onClick={toggleMic}
          className={`h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer shadow-xl hover:scale-105 active:scale-95 ${
            isMicActive
              ? isDark
                ? "bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700 shadow-zinc-950/40"
                : "bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-zinc-300/40"
              : isDark
                ? "bg-zinc-900 text-zinc-500 border border-zinc-800 shadow-zinc-950/40"
                : "bg-zinc-100 text-zinc-400 border border-zinc-200 shadow-zinc-300/40"
          }`}
          title={isMicActive ? "Matikan Mikrofon" : "Nyalakan Mikrofon"}
          aria-label={isMicActive ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicActive ? (
            <Mic className={`w-7 h-7 sm:w-8 sm:h-8 ${isDark ? "text-white" : "text-zinc-900"}`} />
          ) : (
            <MicOff className={`w-7 h-7 sm:w-8 sm:h-8 ${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
          )}
        </button>

        {/* End Session Button (Only Icon X, Large, Pure Theme Monochrome) */}
        <button
          type="button"
          onClick={onClose}
          className={`h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer shadow-xl hover:scale-105 active:scale-95 ${
            isDark
              ? "bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 shadow-zinc-950/40"
              : "bg-white hover:bg-zinc-100 text-zinc-700 hover:text-black border border-zinc-200 shadow-zinc-300/40"
          }`}
          title="Akhiri Percakapan Suara"
          aria-label="Tutup Percakapan Suara"
        >
          <X className={`w-7 h-7 sm:w-8 sm:h-8 ${isDark ? "text-zinc-200" : "text-zinc-800"}`} />
        </button>
      </div>
    </div>
  );
}
