"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const MeshDriftBackground = dynamic(
  () => import("@/components/ui/mesh-drift-background").then((m) => m.MeshDriftBackground),
  { ssr: false }
);
import {
  Room,
  RoomEvent,
  Track,
  ParticipantEvent,
  createLocalAudioTrack,
  type LocalAudioTrack,
  type LocalVideoTrack,
  type RemoteTrack,
  type RemoteAudioTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from "livekit-client";
import { createPortal } from "react-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  SwitchCamera,
  ShieldCheck,
  AlertCircle,
  Maximize2,
  Minimize2,
  ChevronDown,
  GripVertical,
} from "lucide-react";

export type CallStatus =
  | "memanggil"
  | "menghubungkan"
  | "tersambung"
  | "ditolak"
  | "dibatalkan"
  | "tidak_terjawab"
  | "gagal"
  | "berakhir";

export interface CallPublicUser {
  id: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
}

interface LiveKitCallModalProps {
  isDark: boolean;
  isOpen: boolean;
  callType: "audio" | "video";
  mode: "outgoing" | "incoming" | "connected";
  peerUser: CallPublicUser;
  callStatus: CallStatus;
  statusMessage?: string | null;
  livekitUrl?: string | null;
  livekitToken?: string | null;
  roomName?: string | null;
  preAcquiredAudioTrack?: LocalAudioTrack | null;
  onAcceptCall?: (preAcquiredTrack?: LocalAudioTrack | null) => void;
  onRejectCall?: () => void;
  onEndCall?: (reason?: string) => void;
  onConnected?: () => void;
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${String(hrs).padStart(2, "0")}:${String(remMins).padStart(2, "0")}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/* ─── Web Audio Tone Synthesizer ─────────────────────────────────────────── */
class TonePlayer {
  private ctx: AudioContext | null = null;
  private interval: NodeJS.Timeout | null = null;

  startOutgoingRing() {
    this.stop();
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx || this.ctx.state === "closed") {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      const playTone = () => {
        if (!this.ctx || this.ctx.state === "closed") return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      };
      playTone();
      this.interval = setInterval(playTone, 3000);
    } catch {}
  }

  startIncomingRing() {
    this.stop();
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx || this.ctx.state === "closed") {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      const playChime = () => {
        if (!this.ctx || this.ctx.state === "closed") return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = now + idx * 0.15;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.06, start);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start);
          osc.stop(start + 0.35);
        });
      };
      playChime();
      this.interval = setInterval(playChime, 2400);
    } catch {}
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.ctx) {
      try {
        if (this.ctx.state !== "closed") {
          this.ctx.close().catch(() => {});
        }
      } catch {}
      this.ctx = null;
    }
  }
}

let sharedAudioContext: AudioContext | null = null;

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === "suspended") {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

export default function LiveKitCallModal({
  isDark,
  isOpen,
  callType,
  mode,
  peerUser,
  callStatus,
  statusMessage,
  livekitUrl,
  livekitToken,
  preAcquiredAudioTrack,
  onAcceptCall,
  onRejectCall,
  onEndCall,
  onConnected,
}: LiveKitCallModalProps) {
  const [mounted, setMounted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Floating Minimized Widget Drag & Move State
  const [minimizedPos, setMinimizedPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== "undefined") {
      const widgetWidth = 280;
      const widgetHeight = 60;
      return {
        x: Math.max(16, window.innerWidth - widgetWidth - 24),
        y: Math.max(16, window.innerHeight - widgetHeight - 32),
      };
    }
    return { x: 24, y: 120 };
  });

  const dragInfoRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  const widgetRef = useRef<HTMLDivElement | null>(null);

  // Batasi posisi widget agar tetap di dalam layar saat ukuran jendela browser berubah
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      const el = widgetRef.current;
      const width = el?.offsetWidth || 280;
      const height = el?.offsetHeight || 60;
      const maxX = Math.max(12, window.innerWidth - width - 12);
      const maxY = Math.max(12, window.innerHeight - height - 12);
      setMinimizedPos((prev) => ({
        x: Math.min(Math.max(12, prev.x), maxX),
        y: Math.min(Math.max(12, prev.y), maxY),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const target = e.target as HTMLElement;
    // Jangan drag jika yang ditekan adalah tombol
    if (target.closest("button")) return;

    // Cegah text selection & default image drag
    e.preventDefault();

    const el = widgetRef.current;
    if (!el) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = minimizedPos.x;
    const initialY = minimizedPos.y;

    dragInfoRef.current = {
      isDragging: true,
      startX,
      startY,
      initialX,
      initialY,
      hasMoved: false,
    };

    let currentX = initialX;
    let currentY = initialY;

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!dragInfoRef.current.isDragging) return;

      const deltaX = moveEvt.clientX - dragInfoRef.current.startX;
      const deltaY = moveEvt.clientY - dragInfoRef.current.startY;

      if (!dragInfoRef.current.hasMoved && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
        dragInfoRef.current.hasMoved = true;
      }

      if (dragInfoRef.current.hasMoved) {
        const width = el.offsetWidth || 280;
        const height = el.offsetHeight || 60;
        const maxX = Math.max(8, window.innerWidth - width - 8);
        const maxY = Math.max(8, window.innerHeight - height - 8);

        currentX = Math.min(Math.max(8, dragInfoRef.current.initialX + deltaX), maxX);
        currentY = Math.min(Math.max(8, dragInfoRef.current.initialY + deltaY), maxY);

        // Update transform langsung di DOM untuk performa 60fps/120fps tanpa render lag
        el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (!dragInfoRef.current.isDragging) return;
      dragInfoRef.current.isDragging = false;

      if (dragInfoRef.current.hasMoved) {
        // Simpan posisi koordinat akhir
        setMinimizedPos({ x: currentX, y: currentY });
      } else {
        // Ketukan murni: perbesar modal panggilan
        if (audioPlaybackBlocked) void handleUnlockAudio();
        setIsMinimized(false);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const miniRemoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const attachLocalCameraTrack = useCallback(() => {
    const el = localVideoRef.current;
    const room = roomRef.current;
    if (!el || !room) return;
    const camPub =
      room.localParticipant.getTrackPublication(Track.Source.Camera) ||
      Array.from(room.localParticipant.videoTrackPublications.values())[0];
    const camTrack = (camPub?.videoTrack || camPub?.track) as LocalVideoTrack | undefined;
    if (camTrack && !isCameraOff) {
      try {
        camTrack.attach(el);
        el.play().catch(() => {});
      } catch (err) {
        console.warn("[livekit] attach local camera err:", err);
      }
    }
  }, [isCameraOff]);

  const setLocalVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      localVideoRef.current = node;
      if (node) {
        attachLocalCameraTrack();
      }
    },
    [attachLocalCameraTrack]
  );

  const attachRemoteVideoTrack = useCallback(() => {
    const el = remoteVideoRef.current;
    const room = roomRef.current;
    if (!el || !room) return;
    room.remoteParticipants.forEach((p) => {
      p.trackPublications.forEach((pub) => {
        if (pub.isSubscribed && pub.track && pub.track.kind === Track.Kind.Video) {
          setRemoteHasVideo(true);
          try {
            pub.track.attach(el);
            el.play().catch(() => {});
          } catch (err) {
            console.warn("[livekit] attach remote video err:", err);
          }
        }
      });
    });
  }, []);

  const setRemoteVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      remoteVideoRef.current = node;
      if (node) {
        attachRemoteVideoTrack();
      }
    },
    [attachRemoteVideoTrack]
  );

  const setMiniRemoteVideoRef = useCallback((node: HTMLVideoElement | null) => {
    miniRemoteVideoRef.current = node;
    if (node) {
      const room = roomRef.current;
      if (!room) return;
      room.remoteParticipants.forEach((p) => {
        p.trackPublications.forEach((pub) => {
          if (pub.isSubscribed && pub.track && pub.track.kind === Track.Kind.Video) {
            try {
              pub.track.attach(node);
              node.play().catch(() => {});
            } catch (err) {
              console.warn("[livekit] attach mini remote video err:", err);
            }
          }
        });
      });
    }
  }, []);

  // Pastikan preview kamera lokal dan video remote terpasang jika status berubah
  useEffect(() => {
    if (callType === "video") {
      attachLocalCameraTrack();
      attachRemoteVideoTrack();
    }
  }, [callType, callStatus, isCameraOff, attachLocalCameraTrack, attachRemoteVideoTrack]);

  // Pasang ulang video stream saat modal di-maximize kembali
  useEffect(() => {
    if (!isMinimized && callType === "video") {
      const timer = setTimeout(() => {
        attachLocalCameraTrack();
        attachRemoteVideoTrack();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isMinimized, callType, attachLocalCameraTrack, attachRemoteVideoTrack]);

  const attachedAudiosRef = useRef<HTMLMediaElement[]>([]);
  const isSpeakerOnRef = useRef(isSpeakerOn);
  isSpeakerOnRef.current = isSpeakerOn;
  const isMicMutedRef = useRef(isMicMuted);
  isMicMutedRef.current = isMicMuted;
  const tonePlayerRef = useRef<TonePlayer | null>(null);
  const isUnlockingRef = useRef(false);
  const preAcquiredAudioTrackRef = useRef<LocalAudioTrack | null>(preAcquiredAudioTrack || null);
  if (preAcquiredAudioTrack && !preAcquiredAudioTrackRef.current) {
    preAcquiredAudioTrackRef.current = preAcquiredAudioTrack;
  }

  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;
  const onEndCallRef = useRef(onEndCall);
  onEndCallRef.current = onEndCall;

  // Inisialisasi tone player ref
  if (!tonePlayerRef.current) {
    tonePlayerRef.current = new TonePlayer();
  }

  // Buka blokir audio secara aman dengan proteksi race condition / debounce
  const handleUnlockAudio = useCallback(async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isUnlockingRef.current) return;
    isUnlockingRef.current = true;

    try {
      // 1. Resume Web Audio AudioContext jika browser menangguhkannya
      const ctx = getOrCreateAudioContext();
      if (ctx && ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }

      // 2. Mainkan elemen audio remote
      attachedAudiosRef.current.forEach((el) => {
        el.muted = !isSpeakerOnRef.current;
        el.play().catch(() => {});
      });

      // 3. Sinkronkan dengan LiveKit Room startAudio
      if (roomRef.current) {
        try {
          await roomRef.current.startAudio();
        } catch (startErr) {
          console.warn("[livekit] startAudio warning:", startErr);
        }
      }

      // 4. Segera hapus status blocked pada UI
      setAudioPlaybackBlocked(false);
    } catch (err) {
      console.warn("[livekit] handleUnlockAudio err:", err);
      setAudioPlaybackBlocked(false);
    } finally {
      setTimeout(() => {
        isUnlockingRef.current = false;
      }, 300);
    }
  }, []);

  // Cek apakah perangkat memiliki lebih dari 1 kamera (depan & belakang)
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  // Bunyikan nada panggilan berdasarkan status
  useEffect(() => {
    const tone = tonePlayerRef.current;
    if (!tone) return;

    if (isOpen) {
      if (mode === "outgoing" && callStatus === "memanggil") {
        tone.startOutgoingRing();
      } else if (mode === "incoming" && callStatus === "memanggil") {
        tone.startIncomingRing();
      } else {
        tone.stop();
      }
    } else {
      tone.stop();
    }

    return () => {
      tone.stop();
    };
  }, [isOpen, mode, callStatus]);

  // Penghitung durasi panggilan saat tersambung
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isOpen && callStatus === "tersambung") {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else if (callStatus !== "tersambung") {
      setDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, callStatus]);

  // Inisialisasi dan koneksi ke LiveKit Room saat token dan URL tersedia
  const isTerminal =
    callStatus === "ditolak" ||
    callStatus === "dibatalkan" ||
    callStatus === "berakhir" ||
    callStatus === "gagal" ||
    callStatus === "tidak_terjawab";

  useEffect(() => {
    if (!isOpen || !livekitUrl || !livekitToken || isTerminal) {
      return;
    }

    let isMounted = true;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      disconnectOnPageLeave: false,
      stopLocalTrackOnUnpublish: false,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    roomRef.current = room;

    const attachAudioTrack = (track: RemoteTrack) => {
      track.attachedElements.forEach((el) => {
        el.muted = !isSpeakerOnRef.current;
        el.volume = isSpeakerOnRef.current ? 1.0 : 0;
        el.play().catch(() => {});
      });

      const el = track.attach();
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "0";
      el.style.width = "1px";
      el.style.height = "1px";
      el.style.opacity = "0.01";
      el.style.pointerEvents = "none";
      el.setAttribute("autoplay", "true");
      el.setAttribute("playsinline", "true");
      el.muted = !isSpeakerOnRef.current;
      el.volume = isSpeakerOnRef.current ? 1.0 : 0;
      if (!el.parentElement) {
        document.body.appendChild(el);
      }
      if (!attachedAudiosRef.current.includes(el)) {
        attachedAudiosRef.current.push(el);
      }

      el.play()
        .then(() => {
          if (isMounted) {
            setAudioPlaybackBlocked(false);
          }
        })
        .catch((playErr) => {
          console.warn("[livekit] audio play blocked by autoplay:", playErr);
          if (isMounted) {
            setAudioPlaybackBlocked(!room.canPlaybackAudio);
          }
        });
    };

    const detachAudioTrack = (track: RemoteTrack) => {
      const elements = track.detach();
      elements.forEach((el) => {
        try {
          el.pause();
          el.srcObject = null;
          el.remove();
        } catch {}
      });
      attachedAudiosRef.current = attachedAudiosRef.current.filter((el) => !elements.includes(el));
    };

    async function connectLiveKit() {
      try {
        setDeviceError(null);

        // Pantau status pemutaran audio browser (Autoplay Policy)
        room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
          if (!isMounted) return;
          setAudioPlaybackBlocked(!room.canPlaybackAudio);
        });

        // Pasang event listener ketika partisipan lain bergabung
        room.on(RoomEvent.ParticipantConnected, () => {
          if (!isMounted) return;
          onConnectedRef.current?.();
        });

        // Pasang event listener track remote
        room.on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, _pub: RemoteTrackPublication, _participant: RemoteParticipant) => {
            if (!isMounted) return;
            onConnectedRef.current?.();
            if (track.kind === Track.Kind.Audio) {
              attachAudioTrack(track);
              room.startAudio().catch(() => {});
              if (isMounted) {
                setAudioPlaybackBlocked(!room.canPlaybackAudio);
              }
            } else if (track.kind === Track.Kind.Video) {
              setRemoteHasVideo(true);
              if (remoteVideoRef.current) {
                track.attach(remoteVideoRef.current);
                remoteVideoRef.current.play().catch(() => {});
              }
            }
          }
        );

        // Pasang listener jika track lokal berhasil dipublish (termasuk kamera)
        room.localParticipant.on(ParticipantEvent.LocalTrackPublished, (pub) => {
          if (!isMounted) return;
          if (pub.track?.kind === Track.Kind.Video) {
            attachLocalCameraTrack();
          }
        });

        room.on(
          RoomEvent.TrackUnsubscribed,
          (track: RemoteTrack) => {
            if (!isMounted) return;
            if (track.kind === Track.Kind.Audio) {
              detachAudioTrack(track);
            } else if (track.kind === Track.Kind.Video) {
              setRemoteHasVideo(false);
              track.detach();
            }
          }
        );

        room.on(RoomEvent.Disconnected, () => {
          if (!isMounted) return;
          attachedAudiosRef.current.forEach((el) => {
            try {
              el.pause();
              el.srcObject = null;
              el.remove();
            } catch {}
          });
          attachedAudiosRef.current = [];
          onEndCallRef.current?.("Koneksi terputus dari room.");
        });

        // Hubungkan ke LiveKit Cloud
        await room.connect(livekitUrl!, livekitToken!);
        if (isMounted) {
          if (room.remoteParticipants.size > 0 || mode === "connected") {
            onConnectedRef.current?.();
          }
          if (room.canPlaybackAudio) {
            setAudioPlaybackBlocked(false);
          }
        }

        // Cek dan pasang track audio/video dari partisipan yang sudah terhubung di room
        room.remoteParticipants.forEach((participant) => {
          if (isMounted) {
            onConnectedRef.current?.();
          }
          participant.trackPublications.forEach((pub) => {
            if (pub.isSubscribed && pub.track) {
              if (pub.track.kind === Track.Kind.Audio) {
                attachAudioTrack(pub.track as RemoteTrack);
              } else if (pub.track.kind === Track.Kind.Video) {
                setRemoteHasVideo(true);
                if (remoteVideoRef.current) {
                  pub.track.attach(remoteVideoRef.current);
                  remoteVideoRef.current.play().catch(() => {});
                }
              }
            }
          });
        });
        room.startAudio().catch(() => {});

        // Aktifkan mikrofon
        async function enableMicFallback() {
          try {
            await room.localParticipant.setMicrophoneEnabled(true, {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            });
            setIsMicMuted(false);
          } catch (micErr: any) {
            console.warn("[livekit] primary mic options failed, trying plain setMicrophoneEnabled(true):", micErr);
            try {
              await room.localParticipant.setMicrophoneEnabled(true);
              setIsMicMuted(false);
            } catch (fallbackErr: any) {
              console.error("[livekit] mic fallback failed:", fallbackErr);
              const isDenied = fallbackErr?.name === "NotAllowedError" || fallbackErr?.name === "PermissionDeniedError";
              setDeviceError(isDenied ? "Izin mikrofon belum diberikan pada browser ini." : "Mikrofon tidak dapat diakses.");
            }
          }
        }

        const trackToPublish = preAcquiredAudioTrack || preAcquiredAudioTrackRef.current;
        if (
          trackToPublish &&
          trackToPublish.mediaStreamTrack &&
          trackToPublish.mediaStreamTrack.readyState === "live"
        ) {
          try {
            await room.localParticipant.publishTrack(trackToPublish);
            setIsMicMuted(false);
          } catch (pubErr) {
            console.warn("[livekit] publish pre-acquired track failed, falling back to setMicrophoneEnabled:", pubErr);
            await enableMicFallback();
          }
        } else {
          await enableMicFallback();
        }

        // Aktifkan kamera jika ini adalah Video Call
        if (callType === "video") {
          try {
            await room.localParticipant.setCameraEnabled(true);
            setIsCameraOff(false);
            attachLocalCameraTrack();
          } catch (camErr: any) {
            console.warn("[livekit] camera error:", camErr);
            setDeviceError("Izin kamera tidak diizinkan atau kamera tidak tersedia.");
          }
        }
      } catch (connErr: any) {
        console.error("[livekit] connection error:", connErr);
        if (isMounted) {
          setDeviceError(connErr?.message || "Gagal menyambung ke server panggilan.");
        }
      }
    }

    connectLiveKit();

    return () => {
      isMounted = false;
      attachedAudiosRef.current.forEach((el) => {
        try {
          el.pause();
          el.srcObject = null;
          el.remove();
        } catch {}
      });
      attachedAudiosRef.current = [];
      if (preAcquiredAudioTrack) {
        try {
          preAcquiredAudioTrack.stop();
        } catch {}
      }
      if (preAcquiredAudioTrackRef.current) {
        try {
          preAcquiredAudioTrackRef.current.stop();
          preAcquiredAudioTrackRef.current = null;
        } catch {}
      }
      try {
        room.localParticipant?.trackPublications.forEach((pub) => {
          if (pub.track) {
            pub.track.stop();
            pub.track.detach();
          }
        });
        room.disconnect();
      } catch {}
      roomRef.current = null;
    };
  }, [isOpen, livekitUrl, livekitToken, isTerminal, callType]);

  // Toggle Mute Mikrofon
  const handleToggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      const nextMuted = !isMicMuted;
      await room.localParticipant.setMicrophoneEnabled(!nextMuted);
      setIsMicMuted(nextMuted);
    } catch {}
  }, [isMicMuted]);

  // Toggle Kamera Hidup/Mati
  const handleToggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room || callType !== "video") return;
    try {
      const nextOff = !isCameraOff;
      await room.localParticipant.setCameraEnabled(!nextOff);
      setIsCameraOff(nextOff);

      if (!nextOff) {
        setTimeout(() => {
          attachLocalCameraTrack();
        }, 100);
      }
    } catch {}
  }, [isCameraOff, callType, attachLocalCameraTrack]);

  // Ganti Kamera Depan/Belakang
  const handleSwitchCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room || callType !== "video") return;
    try {
      const nextFacing = cameraFacing === "user" ? "environment" : "user";
      setCameraFacing(nextFacing);

      // Dapatkan daftar video input
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      if (videoDevices.length > 1) {
        const currentTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
        const currentDeviceId = currentTrack?.mediaStreamTrack.getSettings().deviceId;
        const nextDevice = videoDevices.find((d) => d.deviceId !== currentDeviceId) || videoDevices[0];
        if (nextDevice) {
          await room.switchActiveDevice("videoinput", nextDevice.deviceId);
          setTimeout(() => {
            attachLocalCameraTrack();
          }, 150);
        }
      }
    } catch {}
  }, [cameraFacing, callType, attachLocalCameraTrack]);

  // Toggle Speaker (Audio Output)
  const handleToggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      if (roomRef.current) {
        roomRef.current.remoteParticipants.forEach((p) => {
          p.audioTrackPublications.forEach((pub) => {
            if (pub.track) {
              (pub.track as RemoteAudioTrack).setVolume(next ? 1.0 : 0);
            }
          });
        });
      }
      attachedAudiosRef.current.forEach((el) => {
        el.muted = !next;
      });
      return next;
    });
  }, []);

  // ─── 1. Screen Wake Lock: Jaga layar HP tidak otomatis sleep/mati saat panggilan tersambung ───
  useEffect(() => {
    if (!isOpen || callStatus !== "tersambung") return;
    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      if (
        typeof navigator !== "undefined" &&
        "wakeLock" in navigator &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
        } catch {}
      }
    };

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (wakeLockSentinel) {
        try {
          wakeLockSentinel.release();
        } catch {}
      }
    };
  }, [isOpen, callStatus]);

  // ─── 2. Media Session API: Daftarkan ke OS agar proses audio/VoIP diprioritaskan di background ───
  useEffect(() => {
    if (
      !isOpen ||
      callStatus !== "tersambung" ||
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator)
    ) {
      return;
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Panggilan dengan ${peerUser.name || "Teman"}`,
        artist: "Usick One",
        album: callType === "video" ? "Video Call" : "Voice Call",
        artwork: peerUser.avatarUrl
          ? [{ src: peerUser.avatarUrl, sizes: "192x192", type: "image/jpeg" }]
          : [],
      });
      navigator.mediaSession.playbackState = "playing";

      try {
        navigator.mediaSession.setActionHandler("hangup" as any, () => {
          onEndCallRef.current?.("Panggilan diakhiri dari media session.");
        });
      } catch {}

      try {
        navigator.mediaSession.setActionHandler("togglemicrophone" as any, () => {
          void handleToggleMic();
        });
      } catch {}
    } catch {}

    return () => {
      try {
        navigator.mediaSession.playbackState = "none";
        try {
          navigator.mediaSession.setActionHandler("hangup" as any, null);
        } catch {}
        try {
          navigator.mediaSession.setActionHandler("togglemicrophone" as any, null);
        } catch {}
      } catch {}
    };
  }, [isOpen, callStatus, peerUser.name, peerUser.avatarUrl, callType, handleToggleMic]);

  // ─── 3. Auto-Recovery: Otomatis pulihkan mic dan audio saat user kembali ke web / fokus kembali ───
  useEffect(() => {
    if (!isOpen || callStatus !== "tersambung") return;

    const handleVisibilityRecovery = async () => {
      const room = roomRef.current;
      if (!room || typeof document === "undefined" || document.visibilityState !== "visible") return;

      // Jika mikrofon tidak sengaja di-mute oleh user di UI, pastikan hardware track hidup
      if (!isMicMutedRef.current) {
        try {
          const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
          const track = micPub?.track;
          if (track) {
            if (track.isMuted) {
              await track.unmute();
            }
            if (
              track.mediaStreamTrack &&
              (track.mediaStreamTrack.muted || track.mediaStreamTrack.readyState !== "live")
            ) {
              await room.localParticipant.setMicrophoneEnabled(true, {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              });
            }
          } else {
            await room.localParticipant.setMicrophoneEnabled(true, {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            });
          }
        } catch (err) {
          console.warn("[livekit] auto-recover mic failed:", err);
        }
      }

      // Pastikan audio remote (speaker) langsung berbunyi kembali
      attachedAudiosRef.current.forEach((el) => {
        el.muted = !isSpeakerOnRef.current;
        el.play().catch(() => {});
      });
      room.startAudio().catch(() => {});
    };

    document.addEventListener("visibilitychange", handleVisibilityRecovery);
    window.addEventListener("focus", handleVisibilityRecovery);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityRecovery);
      window.removeEventListener("focus", handleVisibilityRecovery);
    };
  }, [isOpen, callStatus]);

  // Label Status Panggilan
  const statusLabels: Record<CallStatus, string> = {
    memanggil: mode === "incoming" ? "Panggilan Masuk..." : "Memanggil...",
    menghubungkan: "Menghubungkan...",
    tersambung: formatDuration(duration),
    ditolak: "Panggilan Ditolak",
    dibatalkan: "Panggilan Dibatalkan",
    tidak_terjawab: "Tidak Terjawab",
    gagal: "Panggilan Gagal",
    berakhir: "Panggilan Berakhir",
  };

  const displayStatus = statusMessage || statusLabels[callStatus] || "Memanggil...";

  if (!isOpen || !mounted) return null;

  /* ─────────────────────────────────────────────────────────────────────────
     1. MODE MINIMIZED (Floating Draggable Mini PiP / Call Pill Widget)
     Memungkinkan pengguna bebas bernavigasi ke tab Chat, Faith, Music, Notes, dll.
     Widget dapat digeser/dipindahkan ke posisi mana saja di layar secara fleksibel.
     ───────────────────────────────────────────────────────────────────────── */
  if (isMinimized) {
    return createPortal(
      <div
        ref={widgetRef}
        onPointerDown={handlePointerDown}
        style={{
          transform: `translate3d(${minimizedPos.x}px, ${minimizedPos.y}px, 0)`,
          touchAction: "none",
        }}
        className="fixed top-0 left-0 z-[9999] select-none touch-none cursor-grab active:cursor-grabbing"
      >
        {callType === "video" ? (
          /* Mini Video PiP Widget (Bisa digeser ke mana saja) */
          <div
            style={{ touchAction: "none" }}
            className="group relative w-44 h-28 sm:w-52 sm:h-32 rounded-2xl overflow-hidden border border-black/10 dark:border-white/20 shadow-2xl bg-zinc-950 backdrop-blur-md transition-shadow hover:shadow-black/50"
          >
            <video
              ref={setMiniRemoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover pointer-events-none"
            />
            {!remoteHasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white font-bold text-lg pointer-events-none">
                {peerUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    draggable={false}
                    src={peerUser.avatarUrl}
                    alt={peerUser.name}
                    className="w-10 h-10 rounded-full object-cover pointer-events-none"
                  />
                ) : (
                  <span>{(peerUser.name || "?").charAt(0).toUpperCase()}</span>
                )}
              </div>
            )}

            {/* Header Overlay inside mini PiP */}
            <div className="absolute top-2 inset-x-2 flex items-center justify-between text-white drop-shadow-md pointer-events-none">
              <span className="text-[11px] font-semibold truncate max-w-[100px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md">
                {peerUser.name}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(false);
                }}
                title="Perbesar Panggilan"
                className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-white pointer-events-auto transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              >
                <Maximize2 size={12} />
              </button>
            </div>

            {/* Bottom Bar Overlay inside mini PiP */}
            <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white">
                {callStatus === "tersambung" ? formatDuration(duration) : displayStatus}
              </span>
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleToggleMic();
                  }}
                  title={isMicMuted ? "Unmute" : "Mute"}
                  className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-transform active:scale-90 cursor-pointer"
                >
                  {isMicMuted ? <MicOff size={12} /> : <Mic size={12} />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEndCall?.("Panggilan diakhiri oleh pengguna.");
                  }}
                  title="Akhiri Panggilan"
                  className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-transform active:scale-90 shadow-md font-bold cursor-pointer"
                >
                  <PhoneOff size={12} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Mini Audio Call Pill Widget (Bisa digeser ke mana saja) */
          <div
            style={{ touchAction: "none" }}
            className={`group flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-full border shadow-2xl backdrop-blur-2xl transition-colors ${
              isDark
                ? "bg-zinc-900/90 hover:bg-zinc-800/90 border-white/15 text-white shadow-black/60"
                : "bg-white/90 hover:bg-white/95 border-black/10 text-zinc-900 shadow-zinc-900/15"
            }`}
          >
            {/* Grip handle visual indicator */}
            <div className="opacity-30 group-hover:opacity-75 transition-opacity -mr-1 pointer-events-none">
              <GripVertical size={14} />
            </div>

            {/* Avatar dengan pulsating ring */}
            <div className="relative shrink-0 pointer-events-none">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-black/10 dark:border-white/20 bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                {peerUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    draggable={false}
                    src={peerUser.avatarUrl}
                    alt={peerUser.name}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <span>{(peerUser.name || "?").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                  isDark ? "bg-white border-zinc-900" : "bg-black border-white"
                } animate-pulse`}
              />
            </div>

            {/* Nama & Durasi Live */}
            <div className="flex flex-col text-left min-w-[70px] pointer-events-none">
              <span className="text-xs font-semibold max-w-[120px] truncate leading-tight">
                {peerUser.name}
              </span>
              <span className="text-[10px] font-mono opacity-70 leading-tight">
                {callStatus === "tersambung" ? formatDuration(duration) : displayStatus}
              </span>
            </div>

            {/* Tombol Mute Cepat */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleToggleMic();
              }}
              title={isMicMuted ? "Nyalakan Mikrofon" : "Matikan Mikrofon"}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isMicMuted
                  ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  : isDark
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-black/5 hover:bg-black/10 text-zinc-800"
              }`}
            >
              {isMicMuted ? <MicOff size={13} /> : <Mic size={13} />}
            </button>

            {/* Tombol Akhiri Cepat */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEndCall?.("Panggilan diakhiri oleh pengguna.");
              }}
              title="Akhiri Panggilan"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
              }`}
            >
              <PhoneOff size={12} />
            </button>

            {/* Tombol Perbesar / Maximize */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              title="Perbesar Panggilan"
              className="pl-1 border-l border-current/15 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        )}
      </div>,
      document.body
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     2. FULL CALL VIEW (Bersih, Selaras Tema Tab Chat, Background Mesh, Tanpa Garis Kotak Frame)
     ───────────────────────────────────────────────────────────────────────── */
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panggilan Langsung"
      onClick={() => {
        if (audioPlaybackBlocked) {
          void handleUnlockAudio();
        }
      }}
      className={`fixed inset-0 z-[9999] flex flex-col justify-between select-none overflow-hidden animate-in fade-in-0 duration-200 ${
        callType === "video"
          ? "bg-black text-white"
          : isDark
            ? "bg-[#121215] text-white"
            : "bg-[#fafafc] text-zinc-900"
      }`}
    >
      {/* ─── Background Mesh Drift Shader (100% Identik dengan background tab Chat) ─── */}
      {callType === "audio" && (
        <MeshDriftBackground isDark={isDark} />
      )}

      {/* ─── VIDEO CANVAS (Khusus Video Call) ─── */}
      {callType === "video" && (
        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
          {/* Remote Video Stream Lawan Bicara */}
          <video
            ref={setRemoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              remoteHasVideo ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Fallback jika lawan bicara belum menyalakan kamera / belum tersambung */}
          {!remoteHasVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 text-center p-6 z-0">
              <div className="relative mb-3">
                {(callStatus === "memanggil" || callStatus === "menghubungkan") && (
                  <>
                    <div className="absolute -inset-4 rounded-full border border-white/20 animate-ping opacity-30" />
                    <div className="absolute -inset-8 rounded-full border border-white/10 animate-pulse" />
                  </>
                )}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-white/20 bg-zinc-900 flex items-center justify-center text-3xl font-bold shadow-2xl overflow-hidden">
                  {peerUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={peerUser.avatarUrl}
                      alt={peerUser.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{(peerUser.name || "?").charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center">
                {/* Status tulisan di atas username tanpa blok */}
                <p className="text-xs font-mono text-zinc-400 mb-1.5 font-medium">
                  {callStatus === "memanggil"
                    ? mode === "incoming"
                      ? "Panggilan video masuk..."
                      : "Memanggil..."
                    : callStatus === "menghubungkan"
                    ? "Menghubungkan..."
                    : "Kamera lawan bicara dinonaktifkan"}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{peerUser.name}</h3>
              </div>
            </div>
          )}

          {/* Floating Picture-in-Picture Preview Kamera Sendiri */}
          <div className="absolute top-20 right-5 z-20 w-28 h-38 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-950/80 backdrop-blur-md">
            <video
              ref={setLocalVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraFacing === "user" ? "-scale-x-100" : ""} ${
                isCameraOff ? "hidden" : "block"
              }`}
            />
            {isCameraOff && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 p-2 text-center">
                <VideoOff size={18} className="mb-1 text-zinc-400" />
                <span className="text-[10px] font-medium tracking-tight">Kamera Mati</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area (Borderless, No Card, No Stroke Outline) */}
      <div className="relative z-10 flex flex-col justify-between h-full w-full max-w-lg mx-auto pointer-events-auto">
        {/* ─── TOP BAR (Header Bersih dengan Tombol Minimize) ─── */}
        <header className="flex items-center justify-between px-6 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] bg-transparent">
          {/* Tombol Minimize di kiri atas (Sesuai liquid glass circle tombol chat/menu) */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            title="Minimize panggilan (Buka tab lain)"
            className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
              callType === "video" || isDark
                ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
            }`}
          >
            <ChevronDown size={22} />
          </button>

          {/* Sisi Kanan: Switch Camera jika video call */}
          <div className="w-11 h-11 flex items-center justify-center">
            {callType === "video" && hasMultipleCameras && !isCameraOff ? (
              <button
                type="button"
                onClick={handleSwitchCamera}
                title="Ganti Kamera Depan / Belakang"
                className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <SwitchCamera size={19} />
              </button>
            ) : (
              <div className="w-11 h-11 pointer-events-none" />
            )}
          </div>
        </header>

        {/* Banner Pemutaran Audio Tertahan Autoplay Browser */}
        {audioPlaybackBlocked && (
          <div className="px-4 pt-1 pb-2 flex justify-center animate-in fade-in-0 duration-200">
            <button
              type="button"
              onClick={handleUnlockAudio}
              className={`px-4 py-2 rounded-full border backdrop-blur-xl font-medium text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  : "bg-black/5 hover:bg-black/10 border-black/15 text-zinc-900"
              }`}
            >
              <Volume2 size={14} className="shrink-0 animate-pulse" />
              <span>Ketuk untuk mengaktifkan suara</span>
            </button>
          </div>
        )}

        {/* ─── CENTER BODY (Khusus Voice Call - Bersih & Selaras Tema) ─── */}
        {callType === "audio" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-4">
            {/* Avatar Lingkaran Besar dengan Ring Border Halus */}
            <div className="relative mb-6">
              {(callStatus === "memanggil" || callStatus === "menghubungkan") && (
                <>
                  <div
                    className={`absolute -inset-4 rounded-full border animate-ping opacity-25 ${
                      isDark ? "border-white/20" : "border-black/15"
                    }`}
                  />
                  <div
                    className={`absolute -inset-8 rounded-full border animate-pulse ${
                      isDark ? "border-white/10" : "border-black/10"
                    }`}
                  />
                </>
              )}
              <div
                className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 shadow-2xl flex items-center justify-center text-4xl font-bold overflow-hidden ${
                  isDark
                    ? "border-white/20 bg-zinc-800 text-white"
                    : "border-black/10 bg-zinc-100 text-zinc-900"
                }`}
              >
                {peerUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={peerUser.avatarUrl} alt={peerUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{(peerUser.name || "?").charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Status di ATAS username, CUMA tulisan saja tanpa ada blok di belakangnya */}
            <p
              className={`text-sm sm:text-base font-mono tracking-wide font-medium mb-1.5 ${
                callStatus === "tersambung"
                  ? isDark
                    ? "text-zinc-300"
                    : "text-zinc-600"
                  : isDark
                    ? "text-zinc-400"
                    : "text-zinc-500"
              }`}
            >
              {callStatus === "tersambung" ? formatDuration(duration) : displayStatus}
            </p>

            {/* Nama Kontak */}
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
              {peerUser.name}
            </h2>
            {peerUser.username && (
              <p className={`text-xs mt-1 font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                @{peerUser.username}
              </p>
            )}

            {/* Alert saat Mikrofon Dibisukan (Teks Bersih) */}
            {isMicMuted && (
              <p
                className={`mt-4 inline-flex items-center gap-1.5 text-xs font-medium ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                <MicOff size={13} className="shrink-0" />
                <span>Mikrofon Anda sedang dinonaktifkan</span>
              </p>
            )}

            {/* Device Error Notification */}
            {deviceError && (
              <p
                className={`mt-4 inline-flex items-center gap-1.5 text-xs font-medium ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{deviceError}</span>
              </p>
            )}
          </div>
        )}

        {/* ─── BOTTOM CONTROLS (Tombol sejajar tanpa background persegi panjang) ─── */}
        <footer className="p-6 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))] flex items-center justify-center">
          {mode === "incoming" && callStatus === "memanggil" ? (
            /* Mode 1: Panggilan Masuk - Tolak & Terima Sejajar */
            <div className="flex items-center justify-center gap-10 sm:gap-14">
              {/* Tombol Tolak */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={onRejectCall}
                  title="Tolak Panggilan"
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg ${
                    callType === "video" || isDark
                      ? "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                      : "bg-black/5 hover:bg-black/10 border border-black/10 text-zinc-800"
                  }`}
                >
                  <PhoneOff size={24} />
                </button>
                <span className="text-xs font-medium opacity-70">Tolak</span>
              </div>

              {/* Tombol Terima */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    let preTrack: LocalAudioTrack | null = null;
                    try {
                      preTrack = await createLocalAudioTrack({
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                      });
                      preAcquiredAudioTrackRef.current = preTrack;
                    } catch (err) {
                      console.warn("[livekit] pre-acquire audio track error:", err);
                    }
                    await handleUnlockAudio();
                    onAcceptCall?.(preTrack);
                  }}
                  title="Terima Panggilan"
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xl font-bold ${
                    callType === "video" || isDark
                      ? "bg-white hover:bg-zinc-200 text-black shadow-white/20"
                      : "bg-black hover:bg-zinc-800 text-white shadow-black/20"
                  }`}
                >
                  {callType === "video" ? <Video size={24} /> : <Phone size={24} />}
                </button>
                <span className="text-xs font-semibold">Terima</span>
              </div>
            </div>
          ) : (
            /* Mode 2: Panggilan Berlangsung - 3 Tombol SEJAJAR tanpa persegi panjang dock */
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              {/* 1. Tombol Mikrofon */}
              <button
                type="button"
                onClick={handleToggleMic}
                title={isMicMuted ? "Nyalakan Mikrofon" : "Matikan Mikrofon"}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md border ${
                  isMicMuted
                    ? isDark
                      ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                      : "bg-zinc-200 border-zinc-300 text-zinc-600"
                    : isDark
                      ? "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                      : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-900"
                }`}
              >
                {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {/* 2. Tombol Akhiri Panggilan Utama */}
              <button
                type="button"
                onClick={() => onEndCall?.("Panggilan diakhiri oleh pengguna.")}
                title="Akhiri Panggilan"
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xl ${
                  callType === "video" || isDark
                    ? "bg-white text-black hover:bg-zinc-200 shadow-white/20"
                    : "bg-black text-white hover:bg-zinc-800 shadow-black/20"
                }`}
              >
                <PhoneOff size={24} />
              </button>

              {/* 3. Tombol Speaker (Voice Call) / Kamera (Video Call) */}
              {callType === "video" ? (
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  title={isCameraOff ? "Nyalakan Kamera" : "Matikan Kamera"}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md border ${
                    isCameraOff
                      ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                      : "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                  }`}
                >
                  {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleSpeaker}
                  title={isSpeakerOn ? "Matikan Speaker" : "Nyalakan Speaker"}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md border ${
                    !isSpeakerOn
                      ? isDark
                        ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                        : "bg-zinc-200 border-zinc-300 text-zinc-600"
                      : isDark
                        ? "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-900"
                  }`}
                >
                  {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
                </button>
              )}
            </div>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
