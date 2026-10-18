"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

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

  // Pastikan preview kamera lokal dan video remote terpasang jika status berubah
  useEffect(() => {
    if (callType === "video") {
      attachLocalCameraTrack();
      attachRemoteVideoTrack();
    }
  }, [callType, callStatus, isCameraOff, attachLocalCameraTrack, attachRemoteVideoTrack]);

  const attachedAudiosRef = useRef<HTMLMediaElement[]>([]);
  const isSpeakerOnRef = useRef(isSpeakerOn);
  isSpeakerOnRef.current = isSpeakerOn;
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
      audioCaptureDefaults: {
        echoCancellation: true,
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in-0 duration-200 select-none overflow-hidden"
    >
      {/* Main Call Device Frame Container (Smartphone Shell Sesuai Referensi Desain) */}
      <div
        className={`relative w-full h-full sm:h-[90vh] sm:max-h-[820px] sm:max-w-[410px] sm:rounded-[44px] border shadow-[0_30px_90px_rgba(0,0,0,0.8)] flex flex-col justify-between overflow-hidden select-none transition-all ${
          callType === "video" || isDark
            ? "bg-[#0c0c10] border-white/20 text-white shadow-black/90"
            : "bg-[#f8f9fc] border-black/10 text-zinc-900 shadow-xl"
        }`}
      >
        {/* Subtle Smartphone Speaker Notch / Dynamic Pill at Top (Desktop view shell) */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center justify-center pointer-events-none">
          <div className="w-24 h-4 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center gap-1.5 px-3">
            <span className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700" />
            <span className="w-8 h-1 rounded-full bg-zinc-800" />
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            1. VIDEO CALL VIEW (Persis Seperti Mockup Tengah Gambar 1)
           ═════════════════════════════════════════════════════════════════════ */}
        {callType === "video" && (
          <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
            {/* Remote Video Stream Lawan Bicara (Full Bleed Background) */}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#181822] via-[#0f0f15] to-[#08080a] text-center p-6 z-0">
                <div className="relative mb-2">
                  {(callStatus === "memanggil" || callStatus === "menghubungkan") && (
                    <>
                      <div className="absolute -inset-4 rounded-full border border-white/25 animate-ping opacity-30" />
                      <div className="absolute -inset-8 rounded-full border border-white/10 animate-pulse" />
                    </>
                  )}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-white/25 bg-zinc-900 flex items-center justify-center text-3xl font-bold shadow-2xl overflow-hidden">
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
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{peerUser.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 font-medium">
                    {callStatus === "memanggil"
                      ? mode === "incoming"
                        ? "Panggilan video masuk..."
                        : "Memanggil..."
                      : callStatus === "menghubungkan"
                      ? "Menghubungkan..."
                      : "Kamera lawan bicara dinonaktifkan"}
                  </p>
                </div>
              </div>
            )}

            {/* Floating Picture-in-Picture Preview Kamera Sendiri (Sesuai Gambar 1) */}
            <div className="absolute top-5 right-5 z-20 w-28 h-38 sm:w-32 sm:h-44 rounded-[22px] overflow-hidden border-2 border-white/35 shadow-[0_15px_35px_rgba(0,0,0,0.6)] bg-zinc-950/90 backdrop-blur-md">
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
              {/* Tombol Expand / Flip di Sudut PiP (Sesuai icon di sudut PiP Gambar 1) */}
              {hasMultipleCameras && !isCameraOff && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleSwitchCamera();
                  }}
                  title="Ganti Kamera Depan / Belakang"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-90 cursor-pointer shadow-md"
                >
                  <Maximize2 size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            2. TOP BAR (Sesuai Gambar 1: Nama & Durasi Bersih di Kiri Atas)
           ═════════════════════════════════════════════════════════════════════ */}
        <header className="relative z-10 flex items-start justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
          {callType === "video" ? (
            /* Video Call Header: Nama Besar & Durasi Subteks (Persis Gambar 1: Sara, 5:23 minutes) */
            <div className="flex flex-col">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                {peerUser.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {callStatus === "tersambung"
                    ? `${formatDuration(duration)} minutes`
                    : displayStatus}
                </span>
              </div>
            </div>
          ) : (
            /* Voice Call Top Bar: Kategori "Voice Call" di Tengah (Sesuai Gambar 2 & 3) */
            <div className="flex flex-col items-center w-full">
              <span
                className={`text-[11px] font-semibold uppercase tracking-widest ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                Voice Call
              </span>
            </div>
          )}
        </header>

        {/* Banner Pemutaran Audio Tertahan Autoplay Browser */}
        {audioPlaybackBlocked && (
          <div className="relative z-30 px-4 pt-1 pb-2 flex justify-center animate-in fade-in-0 duration-200">
            <button
              type="button"
              onClick={handleUnlockAudio}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl text-white font-medium text-xs flex items-center gap-2 shadow-2xl cursor-pointer transition-all active:scale-95"
            >
              <Volume2 size={14} className="text-white shrink-0 animate-pulse" />
              <span>Ketuk untuk mengaktifkan suara</span>
            </button>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            3. CENTER BODY (Khusus Voice Call - Persis Seperti Gambar 2 & 3)
           ═════════════════════════════════════════════════════════════════════ */}
        {callType === "audio" && (
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-4">
            {/* Ambient Radial Glow Halus di Belakang Avatar */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
                isDark ? "bg-white/[0.04]" : "bg-black/[0.03]"
              }`}
            />

            {/* Nama Kontak Besar & Bersih (Sesuai Gambar 3: Lord Justin) */}
            <h2
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 drop-shadow-sm ${
                isDark ? "text-white" : "text-zinc-900"
              }`}
            >
              {peerUser.name}
            </h2>

            {/* Live Duration Pill Badge (Sesuai Gambar 3: 10:03:42) */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono tracking-wider shadow-sm mb-6 ${
                isDark
                  ? "bg-white/10 border border-white/15 text-white"
                  : "bg-black/5 border border-black/10 text-zinc-800"
              }`}
            >
              {callStatus === "tersambung" && (
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              )}
              <span className="tabular-nums">
                {callStatus === "tersambung" ? formatDuration(duration) : displayStatus}
              </span>
            </div>

            {/* Avatar Lingkaran Besar dengan Ring Border Elegan (Sesuai Gambar 2 & 3) */}
            <div className="relative mb-2">
              {(callStatus === "memanggil" || callStatus === "menghubungkan") && (
                <>
                  <div
                    className={`absolute -inset-4 rounded-full border animate-ping opacity-30 ${
                      isDark ? "border-white/25" : "border-black/20"
                    }`}
                  />
                  <div
                    className={`absolute -inset-8 rounded-full border animate-pulse ${
                      isDark ? "border-white/15" : "border-black/10"
                    }`}
                  />
                </>
              )}
              <div
                className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full ring-4 border-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center text-4xl font-bold overflow-hidden ${
                  isDark
                    ? "ring-white/10 border-white/30 bg-zinc-900 text-white"
                    : "ring-black/5 border-black/10 bg-zinc-100 text-zinc-900"
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

            {/* Alert / Warning Pill (Sesuai Gambar 3: "You are muted, please unmute to talk") */}
            {isMicMuted && (
              <div
                className={`mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs shadow-sm animate-in fade-in-0 ${
                  isDark
                    ? "bg-white/10 border border-white/15 text-zinc-300"
                    : "bg-black/5 border border-black/10 text-zinc-700"
                }`}
              >
                <AlertCircle size={13} className="shrink-0" />
                <span>You are muted, please unmute to talk</span>
              </div>
            )}

            {/* Device Error Notification */}
            {deviceError && (
              <div
                className={`mt-4 flex items-center gap-2 max-w-xs px-3.5 py-2 rounded-2xl border text-xs backdrop-blur-md ${
                  isDark
                    ? "border-white/15 bg-black/60 text-zinc-300"
                    : "border-black/10 bg-white/80 text-zinc-800"
                }`}
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{deviceError}</span>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            4. BOTTOM CONTROLS DOCK (Sesuai Gambar 1, 2, & 3)
           ═════════════════════════════════════════════════════════════════════ */}
        <footer className="relative z-10 p-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] flex flex-col items-center">
          {/* ─────────────────────────────────────────────────────────────
              Mode A: Panggilan Masuk (Incoming Card Sesuai Gambar 1 Kiri & Gambar 2 Kanan)
             ───────────────────────────────────────────────────────────── */}
          {mode === "incoming" && callStatus === "memanggil" ? (
            <div className="relative w-full max-w-[340px] mx-auto pt-12 pb-6 px-6 rounded-[38px] backdrop-blur-3xl bg-black/70 border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.85)] flex flex-col items-center text-center">
              {/* Avatar Floating Overlapping Batas Atas Kartu (Persis Gambar 1 Kiri) */}
              <div className="absolute -top-11 left-1/2 -translate-x-1/2">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full border border-white/30 animate-ping opacity-40" />
                  <div className="w-22 h-22 rounded-full border-2 border-white/40 shadow-2xl overflow-hidden bg-zinc-900 text-white flex items-center justify-center text-2xl font-bold">
                    {peerUser.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={peerUser.avatarUrl} alt={peerUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(peerUser.name || "?").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Kontak Penelepon */}
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-0.5">
                {peerUser.name}
              </h3>
              <p className="text-xs text-zinc-400 mb-6 font-medium">
                {callType === "video" ? "Panggilan Video Masuk..." : "Panggilan Suara Masuk..."}
              </p>

              {/* Baris Tombol Tolak & Terima (Sesuai Tema Web: Neutral Zinc & Solid White) */}
              <div className="flex items-center justify-center gap-10 w-full">
                {/* Tombol Tolak (Frosted Neutral) */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onRejectCall}
                    title="Tolak Panggilan"
                    className="w-15 h-15 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                  >
                    <PhoneOff size={24} />
                  </button>
                  <span className="text-xs font-medium text-zinc-400">Tolak</span>
                </div>

                {/* Tombol Terima (Solid High-Contrast White) */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      let preTrack: LocalAudioTrack | null = null;
                      try {
                        preTrack = await createLocalAudioTrack({ echoCancellation: true });
                        preAcquiredAudioTrackRef.current = preTrack;
                      } catch (err) {
                        console.warn("[livekit] pre-acquire audio track error:", err);
                      }
                      await handleUnlockAudio();
                      onAcceptCall?.(preTrack);
                    }}
                    title="Terima Panggilan"
                    className="w-15 h-15 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-[0_10px_30px_rgba(255,255,255,0.25)] active:scale-95 transition-all cursor-pointer font-bold"
                  >
                    {callType === "video" ? <Video size={26} /> : <Phone size={24} />}
                  </button>
                  <span className="text-xs font-bold text-white">Terima</span>
                </div>
              </div>

              {/* Drag Handle Bar di Bawah */}
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mt-5" />
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
                Mode B: Panggilan Aktif / Berlangsung
                (Floating Frosted Glass Dock Persis Gambar 1 Tengah & Gambar 3)
               ───────────────────────────────────────────────────────────── */
            <div
              className={`w-full max-w-[350px] mx-auto p-5 rounded-[36px] backdrop-blur-3xl border shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)] flex flex-col items-center gap-4 transition-all ${
                callType === "video" || isDark
                  ? "bg-white/[0.14] border-white/30 text-white"
                  : "bg-white/85 border-black/10 text-zinc-900 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.12)]"
              }`}
            >
              {/* Center Top: Tombol Akhiri Panggilan Utama (Sesuai Gambar 1 & 3) */}
              <button
                type="button"
                onClick={() => onEndCall?.("Panggilan diakhiri oleh pengguna.")}
                title="Akhiri Panggilan"
                className={`w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-[0_10px_25px_rgba(0,0,0,0.3)] cursor-pointer ${
                  callType === "video" || isDark
                    ? "bg-white text-zinc-950 hover:bg-zinc-100"
                    : "bg-zinc-950 text-white hover:bg-black shadow-[0_10px_25px_rgba(0,0,0,0.2)]"
                }`}
              >
                <PhoneOff size={22} />
              </button>

              {/* Bottom Row: Tombol Kontrol Bulat Berlatar Putih/Frosted (Sesuai Gambar 1) */}
              <div className="flex items-center justify-center gap-3.5 sm:gap-4 w-full">
                {/* 1. Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  title={isMicMuted ? "Nyalakan Mikrofon" : "Matikan Mikrofon"}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 ${
                    isMicMuted
                      ? "bg-zinc-900 text-white border border-zinc-700"
                      : "bg-white text-zinc-900 hover:bg-zinc-100 border border-white/40"
                  }`}
                >
                  {isMicMuted ? <MicOff size={19} /> : <Mic size={19} />}
                </button>

                {/* 2. Video Toggle Button (Khusus Video Call) */}
                {callType === "video" && (
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    title={isCameraOff ? "Nyalakan Kamera" : "Matikan Kamera"}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 ${
                      isCameraOff
                        ? "bg-zinc-900 text-white border border-zinc-700"
                        : "bg-white text-zinc-900 hover:bg-zinc-100 border border-white/40"
                    }`}
                  >
                    {isCameraOff ? <VideoOff size={19} /> : <Video size={19} />}
                  </button>
                )}

                {/* 3. Speaker Output Button */}
                <button
                  type="button"
                  onClick={handleToggleSpeaker}
                  title={isSpeakerOn ? "Matikan Speaker" : "Nyalakan Speaker"}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 ${
                    !isSpeakerOn
                      ? "bg-zinc-900 text-white border border-zinc-700"
                      : "bg-white text-zinc-900 hover:bg-zinc-100 border border-white/40"
                  }`}
                >
                  {isSpeakerOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
                </button>

                {/* 4. Switch Camera Button (Khusus Video Call) */}
                {callType === "video" && hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    title="Ganti Kamera Depan / Belakang"
                    className="w-12 h-12 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 border border-white/40 flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <SwitchCamera size={19} />
                  </button>
                )}
              </div>

              {/* Drag Handle Bar di Dasar Dock (Sesuai Gambar 1 & 3) */}
              <div
                className={`w-10 h-1 rounded-full mx-auto mt-0.5 ${
                  callType === "video" || isDark ? "bg-white/40" : "bg-black/20"
                }`}
              />
            </div>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
