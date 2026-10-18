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
  Minimize2,
  ChevronDown,
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

  /* ─────────────────────────────────────────────────────────────────────────
     1. MODE MINIMIZED (Floating Mini PiP / Call Pill Widget)
     Memungkinkan pengguna bebas bernavigasi ke tab Chat, Faith, Music, Notes, dll.
     ───────────────────────────────────────────────────────────────────────── */
  if (isMinimized) {
    return createPortal(
      <div
        className="fixed bottom-6 right-6 z-[9999] select-none animate-in fade-in-0 slide-in-from-bottom-4 duration-200"
        onClick={() => {
          if (audioPlaybackBlocked) void handleUnlockAudio();
        }}
      >
        {callType === "video" ? (
          /* Mini Video PiP Widget */
          <div
            onClick={() => setIsMinimized(false)}
            className="group relative w-44 h-28 sm:w-52 sm:h-32 rounded-2xl overflow-hidden border border-black/10 dark:border-white/20 shadow-2xl bg-zinc-950 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <video
              ref={setMiniRemoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteHasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white font-bold text-lg">
                {peerUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={peerUser.avatarUrl} alt={peerUser.name} className="w-10 h-10 rounded-full object-cover" />
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
                className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-white pointer-events-auto transition-transform hover:scale-110 active:scale-95"
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
                  className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-transform active:scale-90"
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
                  className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-transform active:scale-90 shadow-md font-bold"
                >
                  <PhoneOff size={12} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Mini Audio Call Pill Widget */
          <div
            onClick={() => setIsMinimized(false)}
            className={`group flex items-center gap-3 pl-3 pr-4 py-2 rounded-full border shadow-2xl backdrop-blur-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all ${
              isDark
                ? "bg-zinc-900/90 hover:bg-zinc-800/90 border-white/15 text-white shadow-black/60"
                : "bg-white/90 hover:bg-white/95 border-black/10 text-zinc-900 shadow-zinc-900/15"
            }`}
          >
            {/* Avatar dengan pulsating ring */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-black/10 dark:border-white/20 bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                {peerUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={peerUser.avatarUrl} alt={peerUser.name} className="w-full h-full object-cover" />
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
            <div className="flex flex-col text-left min-w-[70px]">
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
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
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
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
              }`}
            >
              <PhoneOff size={12} />
            </button>

            {/* Tombol Perbesar / Maximize */}
            <div className="pl-1 border-l border-current/15 opacity-60 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={13} />
            </div>
          </div>
        )}
      </div>,
      document.body
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     2. FULL CALL VIEW (Bersih, Selaras Tema Tab Chat, Transparan ke Background App)
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
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-6 backdrop-blur-2xl animate-in fade-in-0 duration-200 select-none overflow-hidden ${
        callType === "video"
          ? "bg-black/60 dark:bg-black/75 text-white"
          : isDark
            ? "bg-[#121215]/85 text-white"
            : "bg-[#fafafc]/85 text-zinc-900"
      }`}
    >
      {/* Main Call Container (Clean glassmorphic card selaras dengan tab Chat) */}
      <div
        className={`relative w-full h-full sm:h-[88vh] sm:max-h-[820px] sm:max-w-md sm:rounded-3xl border shadow-2xl flex flex-col justify-between overflow-hidden select-none transition-all ${
          callType === "video"
            ? "bg-zinc-950/80 border-white/15 text-white shadow-2xl"
            : isDark
              ? "bg-zinc-900/40 border-white/10 text-white shadow-black/40 backdrop-blur-xl"
              : "bg-white/70 border-black/10 text-zinc-900 shadow-zinc-900/10 backdrop-blur-xl"
        }`}
      >
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
                <div className="relative mb-2">
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

            {/* Floating Picture-in-Picture Preview Kamera Sendiri */}
            <div className="absolute top-18 right-5 z-20 w-28 h-38 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-950/80 backdrop-blur-md">
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

        {/* ─── TOP BAR (Header Bersih dengan Tombol Minimize) ─── */}
        <header className="relative z-10 flex items-center justify-between px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] bg-transparent">
          {/* Tombol Minimize di kiri atas (Sesuai liquid glass circle tombol chat/menu) */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            title="Minimize ke latar belakang (Buka tab lain)"
            className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
              callType === "video" || isDark
                ? "bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 text-zinc-200 hover:text-white shadow-black/40"
                : "bg-white/70 hover:bg-white/90 border border-black/10 text-zinc-800 hover:text-black shadow-zinc-900/10"
            }`}
          >
            <ChevronDown size={20} />
          </button>

          {/* Header Tengah */}
          <div className="flex flex-col items-center text-center">
            {callType === "video" ? (
              <>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-md">
                  {peerUser.name}
                </h2>
                <span className="text-xs font-mono text-white/80 drop-shadow-sm">
                  {callStatus === "tersambung" ? formatDuration(duration) : displayStatus}
                </span>
              </>
            ) : (
              <>
                <span
                  className={`text-[11px] font-mono uppercase tracking-widest font-semibold ${
                    isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  Voice Call
                </span>
                <span className="text-xs font-mono font-medium opacity-70">
                  {callStatus === "tersambung" ? formatDuration(duration) : displayStatus}
                </span>
              </>
            )}
          </div>

          {/* Sisi Kanan: Switch Camera jika video call, atau spacer simetris */}
          <div className="w-10 h-10 flex items-center justify-center">
            {callType === "video" && hasMultipleCameras && !isCameraOff ? (
              <button
                type="button"
                onClick={handleSwitchCamera}
                title="Ganti Kamera Depan / Belakang"
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <SwitchCamera size={18} />
              </button>
            ) : (
              <div className="w-10 h-10 pointer-events-none" />
            )}
          </div>
        </header>

        {/* Banner Pemutaran Audio Tertahan Autoplay Browser */}
        {audioPlaybackBlocked && (
          <div className="relative z-30 px-4 pt-1 pb-2 flex justify-center animate-in fade-in-0 duration-200">
            <button
              type="button"
              onClick={handleUnlockAudio}
              className={`px-4 py-2 rounded-full border backdrop-blur-xl font-medium text-xs flex items-center gap-2 shadow-2xl cursor-pointer transition-all active:scale-95 ${
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
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-4">
            {/* Avatar Lingkaran Besar dengan Ring Border Halus */}
            <div className="relative mb-3">
              {(callStatus === "memanggil" || callStatus === "menghubungkan") && (
                <>
                  <div
                    className={`absolute -inset-4 rounded-full border animate-ping opacity-30 ${
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

            {/* Nama Kontak */}
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 drop-shadow-sm">
              {peerUser.name}
            </h2>
            {peerUser.username && (
              <p className={`text-xs mb-4 font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                @{peerUser.username}
              </p>
            )}

            {/* Live Duration Pill Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono tracking-wider shadow-sm ${
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

            {/* Alert saat Mikrofon Dibisukan */}
            {isMicMuted && (
              <div
                className={`mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs shadow-sm animate-in fade-in-0 ${
                  isDark
                    ? "bg-white/5 border border-white/10 text-zinc-300"
                    : "bg-black/5 border border-black/10 text-zinc-700"
                }`}
              >
                <MicOff size={13} className="shrink-0" />
                <span>Mikrofon Anda sedang dinonaktifkan</span>
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

        {/* ─── BOTTOM CONTROLS (Floating Frosted Glass Dock) ─── */}
        <footer className="relative z-10 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col items-center">
          {/* Mode 1: Panggilan Masuk */}
          {mode === "incoming" && callStatus === "memanggil" ? (
            <div
              className={`w-full max-w-sm mx-auto p-5 rounded-3xl backdrop-blur-2xl border shadow-xl flex items-center justify-around gap-6 ${
                callType === "video" || isDark
                  ? "bg-zinc-900/80 border-white/15 text-white shadow-black/50"
                  : "bg-white/80 border-black/10 text-zinc-900 shadow-zinc-900/10"
              }`}
            >
              {/* Tombol Tolak */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={onRejectCall}
                  title="Tolak Panggilan"
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer backdrop-blur-md ${
                    callType === "video" || isDark
                      ? "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                      : "bg-black/5 hover:bg-black/10 border border-black/10 text-zinc-800"
                  }`}
                >
                  <PhoneOff size={22} />
                </button>
                <span className="text-xs font-medium opacity-70">Tolak</span>
              </div>

              {/* Tombol Terima */}
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
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer font-bold ${
                    callType === "video" || isDark
                      ? "bg-white hover:bg-zinc-200 text-black shadow-white/20"
                      : "bg-black hover:bg-zinc-800 text-white shadow-black/20"
                  }`}
                >
                  {callType === "video" ? <Video size={24} /> : <Phone size={22} />}
                </button>
                <span className="text-xs font-semibold">Terima</span>
              </div>
            </div>
          ) : (
            /* Mode 2: Panggilan Aktif / Berlangsung */
            <div
              className={`w-full max-w-[340px] mx-auto p-4 sm:p-5 rounded-3xl backdrop-blur-2xl border shadow-xl flex flex-col items-center gap-3.5 transition-all ${
                callType === "video" || isDark
                  ? "bg-zinc-900/80 border-white/15 text-white shadow-black/50"
                  : "bg-white/80 border-black/10 text-zinc-900 shadow-zinc-900/10"
              }`}
            >
              {/* Center Top: Tombol Akhiri Panggilan Utama */}
              <button
                type="button"
                onClick={() => onEndCall?.("Panggilan diakhiri oleh pengguna.")}
                title="Akhiri Panggilan"
                className={`w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-xl cursor-pointer ${
                  callType === "video" || isDark
                    ? "bg-white text-black hover:bg-zinc-200 shadow-white/20"
                    : "bg-black text-white hover:bg-zinc-800 shadow-black/20"
                }`}
              >
                <PhoneOff size={22} />
              </button>

              {/* Baris Tombol Kontrol */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 w-full">
                {/* 1. Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  title={isMicMuted ? "Nyalakan Mikrofon" : "Matikan Mikrofon"}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border ${
                    isMicMuted
                      ? isDark
                        ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                        : "bg-zinc-200 border-zinc-300 text-zinc-600"
                      : isDark
                        ? "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-900"
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border ${
                      isCameraOff
                        ? isDark
                          ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                          : "bg-zinc-200 border-zinc-300 text-zinc-600"
                        : isDark
                          ? "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                          : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-900"
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
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border ${
                    !isSpeakerOn
                      ? isDark
                        ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                        : "bg-zinc-200 border-zinc-300 text-zinc-600"
                      : isDark
                        ? "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-900"
                  }`}
                >
                  {isSpeakerOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
                </button>

                {/* 4. Switch Camera Button (Khusus Video Call jika didukung) */}
                {callType === "video" && hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    title="Ganti Kamera Depan / Belakang"
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border ${
                      isDark
                        ? "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                        : "bg-black/5 hover:bg-black/10 border-black/10 text-zinc-900"
                    }`}
                  >
                    <SwitchCamera size={19} />
                  </button>
                )}
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
