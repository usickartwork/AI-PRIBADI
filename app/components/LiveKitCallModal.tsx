"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from "livekit-client";
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
  onAcceptCall?: () => void;
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
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
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
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
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
  onAcceptCall,
  onRejectCall,
  onEndCall,
  onConnected,
}: LiveKitCallModalProps) {
  const [duration, setDuration] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const attachedAudiosRef = useRef<HTMLMediaElement[]>([]);
  const isSpeakerOnRef = useRef(isSpeakerOn);
  isSpeakerOnRef.current = isSpeakerOn;
  const tonePlayerRef = useRef<TonePlayer | null>(null);

  // Inisialisasi tone player ref
  if (!tonePlayerRef.current) {
    tonePlayerRef.current = new TonePlayer();
  }

  // Buka blokir audio secara otomatis saat pengguna berinteraksi / mengetuk layar
  const handleUnlockAudio = useCallback(() => {
    if (roomRef.current) {
      roomRef.current
        .startAudio()
        .then(() => {
          setAudioPlaybackBlocked(false);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = () => {
      if (roomRef.current && !roomRef.current.canPlaybackAudio) {
        roomRef.current
          .startAudio()
          .then(() => {
            setAudioPlaybackBlocked(false);
          })
          .catch(() => {});
      }
    };
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

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
  useEffect(() => {
    if (!isOpen || !livekitUrl || !livekitToken || (callStatus !== "tersambung" && callStatus !== "menghubungkan")) {
      return;
    }

    let isMounted = true;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    roomRef.current = room;

    const attachAudioTrack = (track: RemoteTrack) => {
      if (track.attachedElements.length > 0) {
        track.attachedElements.forEach((el) => {
          el.muted = !isSpeakerOnRef.current;
          el.play().catch(() => {});
        });
        return;
      }
      const el = track.attach();
      el.style.position = "fixed";
      el.style.top = "-9999px";
      el.style.left = "-9999px";
      el.style.width = "1px";
      el.style.height = "1px";
      el.style.opacity = "0.01";
      el.style.pointerEvents = "none";
      el.setAttribute("autoplay", "true");
      el.setAttribute("playsinline", "true");
      el.muted = !isSpeakerOnRef.current;
      if (!el.parentElement) {
        document.body.appendChild(el);
      }
      if (!attachedAudiosRef.current.includes(el)) {
        attachedAudiosRef.current.push(el);
      }
      el.play().catch((err) => {
        console.warn("[livekit] audio play blocked by autoplay policy:", err);
        if (isMounted) {
          setAudioPlaybackBlocked(true);
        }
      });
    };

    const detachAudioTrack = (track: RemoteTrack) => {
      const elements = track.detach();
      elements.forEach((el) => {
        try {
          el.pause();
          el.remove();
        } catch {}
        attachedAudiosRef.current = attachedAudiosRef.current.filter((e) => e !== el);
      });
    };

    async function connectLiveKit() {
      try {
        setDeviceError(null);

        // Pantau status pemutaran audio browser (Autoplay Policy)
        room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
          if (!isMounted) return;
          setAudioPlaybackBlocked(!room.canPlaybackAudio);
        });

        // Pasang event listener track remote
        room.on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, _pub: RemoteTrackPublication, _participant: RemoteParticipant) => {
            if (!isMounted) return;
            if (track.kind === Track.Kind.Audio) {
              attachAudioTrack(track);
            } else if (track.kind === Track.Kind.Video) {
              setRemoteHasVideo(true);
              if (remoteVideoRef.current) {
                track.attach(remoteVideoRef.current);
              }
            }
          }
        );

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
              el.remove();
            } catch {}
          });
          attachedAudiosRef.current = [];
          onEndCall?.("Koneksi terputus dari room.");
        });

        // Hubungkan ke LiveKit Cloud
        await room.connect(livekitUrl!, livekitToken!);
        if (isMounted) {
          onConnected?.();
        }

        // Buka blokir audio segera setelah koneksi tersambung
        if (!room.canPlaybackAudio) {
          room.startAudio().then(() => {
            if (isMounted) setAudioPlaybackBlocked(false);
          }).catch(() => {
            if (isMounted) setAudioPlaybackBlocked(true);
          });
        } else {
          if (isMounted) setAudioPlaybackBlocked(false);
        }

        // Cek dan pasang track audio/video dari partisipan yang sudah terhubung di room
        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((pub) => {
            if (pub.isSubscribed && pub.track) {
              if (pub.track.kind === Track.Kind.Audio) {
                attachAudioTrack(pub.track as RemoteTrack);
              } else if (pub.track.kind === Track.Kind.Video) {
                setRemoteHasVideo(true);
                if (remoteVideoRef.current) {
                  pub.track.attach(remoteVideoRef.current);
                }
              }
            }
          });
        });

        // Aktifkan mikrofon
        try {
          await room.localParticipant.setMicrophoneEnabled(true, {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          });
          setIsMicMuted(false);
        } catch (micErr: any) {
          console.warn("[livekit] mic error:", micErr);
          const isDenied = micErr?.name === "NotAllowedError" || micErr?.name === "PermissionDeniedError";
          setDeviceError(isDenied ? "Izin mikrofon belum diberikan pada browser ini." : "Mikrofon tidak dapat diakses.");
        }

        // Aktifkan kamera jika ini adalah Video Call
        if (callType === "video") {
          try {
            await room.localParticipant.setCameraEnabled(true);
            setIsCameraOff(false);

            // Pasang local video track ke preview kamera sendiri
            const camTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
            if (camTrack && localVideoRef.current) {
              camTrack.attach(localVideoRef.current);
            }
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
          el.remove();
        } catch {}
      });
      attachedAudiosRef.current = [];
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
  }, [isOpen, livekitUrl, livekitToken, callStatus, callType, onEndCall, onConnected]);

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
        // Pasang kembali track jika kamera dinyalakan
        setTimeout(() => {
          const camTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
          if (camTrack && localVideoRef.current) {
            camTrack.attach(localVideoRef.current);
          }
        }, 100);
      }
    } catch {}
  }, [isCameraOff, callType]);

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
        }
      }
    } catch {}
  }, [cameraFacing, callType]);

  // Toggle Speaker (Audio Output)
  const handleToggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      attachedAudiosRef.current.forEach((el) => {
        el.muted = !next;
      });
      return next;
    });
  }, []);

  if (!isOpen) return null;

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

  const isCallActive = callStatus === "tersambung" || callStatus === "menghubungkan";
  const displayStatus = statusMessage || statusLabels[callStatus] || "Memanggil...";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panggilan Langsung"
      onClick={handleUnlockAudio}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in-0 duration-200 select-none overflow-hidden"
    >
      {/* Audio Remote Fallback Element (Off-screen, tidak display: none agar tidak tertahan browser) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Main Call Container */}
      <div
        className={`relative w-full h-full sm:h-[90vh] sm:max-h-[820px] sm:max-w-xl sm:rounded-3xl border shadow-2xl flex flex-col justify-between overflow-hidden ${
          isDark
            ? "bg-[#101014] border-zinc-800 text-white"
            : "bg-[#fafafc] border-zinc-200 text-zinc-900"
        }`}
      >
        {/* ─── VIDEO CANVAS (Untuk Video Call) ─── */}
        {callType === "video" && isCallActive && (
          <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
            {/* Remote Video Stream Lawan Bicara */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                remoteHasVideo ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Fallback jika lawan bicara mematikan kamera */}
            {!remoteHasVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 text-center p-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center text-3xl font-bold shadow-xl">
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
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">{peerUser.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1">Kamera lawan bicara sedang dinonaktifkan</p>
                </div>
              </div>
            )}

            {/* Floating Picture-in-Picture Preview Kamera Sendiri */}
            <div className="absolute top-4 right-4 z-20 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-900">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraFacing === "user" ? "-scale-x-100" : ""} ${
                  isCameraOff ? "hidden" : "block"
                }`}
              />
              {isCameraOff && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 p-2 text-center">
                  <VideoOff size={20} className="mb-1" />
                  <span className="text-[10px] font-medium">Kamera Mati</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TOP BAR (Header Informasi Panggilan) ─── */}
        <header className="relative z-10 flex items-center justify-between px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md bg-black/40 border-white/10 text-zinc-200 shadow-sm">
            <ShieldCheck size={14} className="text-zinc-300" />
            <span className="text-[11px] font-mono tracking-tight">
              {callType === "video" ? "Video Call Encrypted" : "Audio Call Encrypted"}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold backdrop-blur-md bg-black/40 border-white/10 text-white shadow-sm">
            {callStatus === "tersambung" ? formatDuration(duration) : displayStatus}
          </div>
        </header>

        {/* Banner Pemutaran Audio Tertahan Autoplay Browser */}
        {audioPlaybackBlocked && (
          <div className="relative z-30 px-4 pt-1 pb-2 flex justify-center animate-in fade-in-0 duration-200">
            <button
              type="button"
              onClick={handleUnlockAudio}
              className="px-4 py-2 rounded-2xl bg-white text-black font-semibold text-xs flex items-center gap-2 shadow-2xl cursor-pointer hover:bg-zinc-200 transition-all border border-black/10 active:scale-95"
            >
              <Volume2 size={15} className="text-black shrink-0 animate-pulse" />
              <span>Suara tertahan oleh browser. Klik di sini untuk mengaktifkan suara</span>
            </button>
          </div>
        )}

        {/* ─── CENTER BODY (Khusus Audio Call atau Saat Masih Berdering) ─── */}
        {(callType === "audio" || !isCallActive) && (
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-8">
            {/* Animated Avatar Circle */}
            <div className="relative mb-6">
              {(callStatus === "memanggil" || callStatus === "menghubungkan") && (
                <>
                  <div className="absolute -inset-4 rounded-full border border-zinc-500/30 animate-ping opacity-60" />
                  <div className="absolute -inset-8 rounded-full border border-zinc-500/20 animate-pulse" />
                </>
              )}
              <div
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl border-2 overflow-hidden ${
                  isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-200 border-zinc-300 text-black"
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

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{peerUser.name}</h2>
            {peerUser.username && (
              <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                @{peerUser.username}
              </p>
            )}

            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isDark
                    ? "bg-zinc-900/80 border-zinc-800 text-zinc-300"
                    : "bg-zinc-100 border-zinc-200 text-zinc-800"
                }`}
              >
                {callStatus === "memanggil" && <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />}
                {displayStatus}
              </span>
            </div>

            {deviceError && (
              <div className="mt-4 flex items-center gap-2 max-w-sm px-3.5 py-2 rounded-xl border border-zinc-700 bg-black/60 text-zinc-300 text-xs">
                <AlertCircle size={14} className="shrink-0 text-zinc-400" />
                <span>{deviceError}</span>
              </div>
            )}
          </div>
        )}

        {/* ─── BOTTOM CONTROLS (Panggilan Masuk vs Panggilan Berlangsung) ─── */}
        <footer className="relative z-10 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col items-center">
          {/* Mode 1: Panggilan Masuk (Incoming Call Dialog) */}
          {mode === "incoming" && callStatus === "memanggil" ? (
            <div className="flex items-center justify-center gap-8 w-full max-w-xs">
              {/* Tombol Tolak */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={onRejectCall}
                  title="Tolak Panggilan"
                  className="w-16 h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center shadow-xl transition-transform active:scale-95 cursor-pointer"
                >
                  <PhoneOff size={26} />
                </button>
                <span className="text-xs font-semibold text-zinc-400">Tolak</span>
              </div>

              {/* Tombol Terima */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={onAcceptCall}
                  title="Terima Panggilan"
                  className="w-16 h-16 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-xl transition-transform active:scale-95 cursor-pointer"
                >
                  {callType === "video" ? <Video size={28} /> : <Phone size={26} />}
                </button>
                <span className="text-xs font-semibold text-zinc-200">Terima</span>
              </div>
            </div>
          ) : (
            /* Mode 2: Panggilan Sedang Aktif atau Outgoing */
            <div className="flex items-center justify-center gap-3 sm:gap-4 p-2 rounded-full border shadow-2xl backdrop-blur-2xl bg-black/60 border-white/15 text-white">
              {/* Tombol Mute / Unmute Mikrofon */}
              <button
                type="button"
                onClick={handleToggleMic}
                title={isMicMuted ? "Nyalakan Mikrofon" : "Matikan Mikrofon"}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer border ${
                  isMicMuted
                    ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                    : "bg-white/10 hover:bg-white/20 border-white/10 text-white"
                }`}
              >
                {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Tombol Toggle Kamera (Khusus Video Call) */}
              {callType === "video" && (
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  title={isCameraOff ? "Nyalakan Kamera" : "Matikan Kamera"}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer border ${
                    isCameraOff
                      ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                      : "bg-white/10 hover:bg-white/20 border-white/10 text-white"
                  }`}
                >
                  {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}

              {/* Tombol Ganti Kamera Depan/Belakang (Khusus Video Call jika didukung) */}
              {callType === "video" && hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  title="Ganti Kamera Depan / Belakang"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer border bg-white/10 hover:bg-white/20 border-white/10 text-white"
                >
                  <SwitchCamera size={20} />
                </button>
              )}

              {/* Tombol Speaker Output (Khusus Audio Call) */}
              {callType === "audio" && (
                <button
                  type="button"
                  onClick={handleToggleSpeaker}
                  title={isSpeakerOn ? "Matikan Speaker" : "Nyalakan Speaker"}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer border ${
                    !isSpeakerOn
                      ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                      : "bg-white/10 hover:bg-white/20 border-white/10 text-white"
                  }`}
                >
                  {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              )}

              {/* Tombol Akhiri / Batalkan Panggilan */}
              <button
                type="button"
                onClick={() => onEndCall?.("Panggilan diakhiri oleh pengguna.")}
                title="Akhiri Panggilan"
                className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ml-1"
              >
                <PhoneOff size={20} />
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
