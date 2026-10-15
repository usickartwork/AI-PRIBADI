'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/faith/Header';
import Navigation from '@/app/components/faith/Navigation';
import { getStoredUser, setStoredUser, clearStoredUser, DEFAULT_USER } from '@/lib/faith/session';
import { User } from '@/types/database';
import { 
  User as UserIcon, 
  Phone, 
  Mail, 
  Users, 
  Clock, 
  MapPin, 
  LogOut, 
  Edit3, 
  Check 
} from 'lucide-react';

export default function ProfileCGPage() {
  const router = useRouter();
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    try {
      sessionStorage.setItem('faith_hub_intro_seen', 'true');
    } catch {}
    const current = getStoredUser();
    setUser(current);
    setNameInput(current.name || '');
    setPhoneInput(current.phone || '');
    setEmailInput(current.email || '');
  }, []);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const updated: User = { 
      ...user, 
      name: nameInput.trim(),
      phone: phoneInput.trim(),
      email: emailInput.trim(),
    };

    setUser(updated);
    setStoredUser(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function handleLogout() {
    setIsLoggingOut(true);
    setStoredUser(DEFAULT_USER);
    setUser(DEFAULT_USER);
    setNameInput(DEFAULT_USER.name || '');
    setPhoneInput(DEFAULT_USER.phone || '');
    setEmailInput(DEFAULT_USER.email || '');
    setTimeout(() => {
      setIsLoggingOut(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 400);
  }

  return (
    <div className="h-full w-full bg-transparent flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full max-w-4xl h-full bg-white dark:bg-[#121215] rounded-none sm:rounded-[36px] sm:border border-[#EAEAEB] dark:border-[#222226] sm:shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:sm:shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative">
        <Header user={user} />

        <main className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-6 py-4 space-y-4">
          {/* Header Title & Status */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center font-bold shadow-xs">
                <UserIcon size={14} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111113] dark:text-white tracking-tight">Profil Komunitas CG</h2>
                <p className="text-[10px] text-[#8E8E93] dark:text-[#A1A1AA] font-medium">Informasi Anggota &amp; Komunitas</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-[#F2F2F4] dark:bg-[#1C1C20] text-[#111113] dark:text-white border border-[#DCDCE0] dark:border-[#2C2C32]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#111113] dark:bg-white" />
              Terverifikasi
            </span>
          </div>

          {/* Section: Data Pribadi Anggota (Kotak Hitam Elegan) */}
          <section className="bg-[#111113] text-white rounded-[26px] p-5 shadow-md border border-[#232327] space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#232327]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Data Pribadi Anggota
              </h4>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90">
                  <Check size={12} />
                  <span>Tersimpan</span>
                </span>
              )}
            </div>

            {!isEditing ? (
              <div className="divide-y divide-[#232327] text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/60">
                    <UserIcon size={13} />
                    <span>Nama Lengkap</span>
                  </div>
                  <span className="font-semibold text-white">{user.name}</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/60">
                    <Phone size={13} />
                    <span>Nomor Telepon</span>
                  </div>
                  <span className="font-semibold text-white">
                    {user.phone || '-'}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail size={13} />
                    <span>Email yang Didaftarkan</span>
                  </div>
                  <span className="font-semibold text-white font-mono text-[11px]">
                    {user.email || '-'}
                  </span>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2 px-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 active:scale-[0.99] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 size={12} className="text-white/60" />
                    <span>Ubah Data Profil</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/80 block">
                    Nama Lengkap:
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-white/10 focus:outline-none focus:border-white text-white placeholder-white/40"
                    placeholder="Nama Lengkap Anda"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/80 block">
                    Nomor Telepon:
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-white/10 focus:outline-none focus:border-white text-white placeholder-white/40"
                    placeholder="Contoh: +62 812-3456-7890"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/80 block">
                    Email yang Didaftarkan:
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-white/10 focus:outline-none focus:border-white text-white placeholder-white/40"
                    placeholder="Contoh: nama@domain.com"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(user.name || '');
                      setPhoneInput(user.phone || '');
                      setEmailInput(user.email || '');
                      setIsEditing(false);
                    }}
                    className="px-3.5 py-1.5 rounded-full text-xs text-white/60 hover:text-white hover:bg-white/10 font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-full text-xs bg-white hover:bg-[#EAEAEB] text-[#111113] font-semibold cursor-pointer shadow-xs transition"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Section: Informasi Komunitas (CG / Connect Group) */}
          <section className="bg-white dark:bg-[#18181D] rounded-[26px] p-5 shadow-2xs border border-[#EAEAEB] dark:border-[#26262B] space-y-3.5">
            <h4 className="text-xs font-bold text-[#111113] dark:text-white uppercase tracking-wider pb-1 border-b border-[#F2F2F3] dark:border-[#26262B]">
              Informasi Komunitas (CG)
            </h4>

            <div className="divide-y divide-[#F2F2F3] dark:divide-[#26262B] text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#66666E] dark:text-[#A1A1AA]">
                  <Users size={13} />
                  <span>Kelompok Sel</span>
                </div>
                <span className="font-semibold text-[#111113] dark:text-white">
                  {user.community_group?.name || 'CG Central Youth 30'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#66666E] dark:text-[#A1A1AA]">
                  <UserIcon size={13} />
                  <span>Pemimpin</span>
                </div>
                <span className="font-semibold text-[#111113] dark:text-white">
                  {user.community_group?.leader || 'Daniel Kristianto'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#66666E] dark:text-[#A1A1AA]">
                  <Clock size={13} />
                  <span>Jadwal Pertemuan</span>
                </div>
                <span className="font-semibold text-[#111113] dark:text-white">
                  {user.community_group?.schedule || 'Jumat, 19.00'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#66666E] dark:text-[#A1A1AA]">
                  <MapPin size={13} />
                  <span>Lokasi</span>
                </div>
                <span className="font-semibold text-[#111113] dark:text-white text-right max-w-[200px]">
                  {user.community_group?.location || 'Jl. Kartini no 118, Surabaya'}
                </span>
              </div>
            </div>
          </section>

          {/* Section: Tombol Logout (Monochrome) */}
          <section className="pt-1 pb-4">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full py-3 px-4 rounded-2xl border border-[#DCDCE0] dark:border-[#2C2C32] bg-white dark:bg-[#18181D] hover:bg-[#F2F2F4] dark:hover:bg-[#222228] active:scale-[0.99] text-[#111113] dark:text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <LogOut size={14} className="text-[#66666E] dark:text-[#A1A1AA]" />
              <span>{isLoggingOut ? 'Mengakhiri sesi...' : 'Keluar dari Akun (Logout)'}</span>
            </button>
          </section>
        </main>

        <Navigation />
      </div>
    </div>
  );
}

