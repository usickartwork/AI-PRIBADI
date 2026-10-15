'use client';

import { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Lock, 
  Mail, 
  Phone, 
  User as UserIcon, 
  Calendar,
  Sparkles,
  CheckCircle2, 
  LogIn
} from 'lucide-react';
import { 
  setStoredUser, 
  saveRegisteredUser, 
  getRegisteredUsers, 
  DEFAULT_USER 
} from '@/lib/faith/session';
import { User } from '@/types/database';
import { isSupabaseConfigured, supabase } from '@/lib/faith/supabase/client';

type AuthStep = 
  | 'welcome' 
  | 'survey-longing' 
  | 'survey-presence' 
  | 'check-account' 
  | 'reg-name' 
  | 'reg-age' 
  | 'reg-phone' 
  | 'reg-email' 
  | 'reg-password' 
  | 'reg-success' 
  | 'login';

const LONGING_OPTIONS = [
  { id: 'word', title: 'Bertumbuh dalam Firman & Saat Teduh', desc: 'Membangun keintiman doa harian yang konsisten.' },
  { id: 'fellowship', title: 'Menemukan Sahabat Rohani yang Menguatkan', desc: 'Berjalan bersama teman sebaya dalam kasih Kristus.' },
  { id: 'prayer', title: 'Mendoakan Pergumulan & Ketenangan Jiwa', desc: 'Membawa kekhawatiran dan beban hati ke hadirat-Nya.' },
  { id: 'calling', title: 'Mengenali Kehendak & Panggilan Hidup', desc: 'Menemukan arah langkah dan potensi karunia Tuhan.' },
];

const PRESENCE_OPTIONS = [
  { id: 'new', title: 'Anggota Baru', desc: 'Pertama kali ingin bergabung dan mengenal CG Central Youth 30.' },
  { id: 'routine', title: 'Sudah Rutin Hadir', desc: 'Aktif bersekutu setiap hari Jumat bersama teman-teman.' },
  { id: 'returning', title: 'Rindu Kembali Bersekutu', desc: 'Ingin memulai kembali saat teduh dan koneksi komunitas.' },
];

interface FaithAuthViewProps {
  onLoginSuccess: (user: User) => void;
  initialStep?: AuthStep;
}

export default function FaithAuthView({ onLoginSuccess, initialStep = 'welcome' }: FaithAuthViewProps) {
  const [step, setStep] = useState<AuthStep>(initialStep);

  // Survey answers
  const [selectedLonging, setSelectedLonging] = useState<string>('');
  const [selectedPresence, setSelectedPresence] = useState<string>('');

  // Registration form inputs
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');

  // Login form inputs
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration submission
  async function handleCompleteRegistration(e: React.FormEvent) {
    e.preventDefault();
    setRegError('');

    if (!regPassword || regPassword.length < 6) {
      setRegError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);

    const generatedToken = `CY${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedAge = parseInt(regAge.trim()) || 20;

    // 1. If Supabase is configured, attempt cloud sync
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('users').insert([
          {
            token: generatedToken,
            name: regName.trim(),
            age: parsedAge,
            phone: regPhone.trim(),
            email: regEmail.trim().toLowerCase(),
            password_hash: regPassword,
            community_group_name: 'CG Central Youth 30',
            community_leader: 'Daniel Kristianto',
            community_schedule: 'Jumat, 19.00',
            community_location: 'Jl. Kartini no 118, Surabaya',
            survey_longing: selectedLonging || null,
            survey_presence: selectedPresence || null,
            role: 'member',
            status: 'active'
          }
        ]);

        if (error) {
          if (error.code === '23505' || error.message?.toLowerCase().includes('unique')) {
            setRegError('Email sudah terdaftar. Silakan gunakan email lain atau login.');
            setIsSubmitting(false);
            return;
          }
          console.warn('Supabase insert warning, falling back to local cache:', error);
        }
      } catch (err) {
        console.warn('Supabase connection error:', err);
      }
    }

    // 2. Save registered user locally (offline fallback & cache)
    const newUser: User = {
      id: `user-${Date.now()}`,
      token: generatedToken,
      name: regName.trim(),
      age: parsedAge,
      phone: regPhone.trim(),
      email: regEmail.trim(),
      community_group: {
        name: 'CG Central Youth 30',
        leader: 'Daniel Kristianto',
        schedule: 'Jumat, 19.00',
        location: 'Jl. Kartini no 118, Surabaya',
      },
      role: 'member',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    saveRegisteredUser({
      name: newUser.name,
      age: newUser.age,
      phone: newUser.phone || '',
      email: newUser.email || '',
      password: regPassword,
      community_group: newUser.community_group,
    });

    // Set identifier for quick login
    setLoginIdentifier(newUser.email || newUser.phone || '');
    setLoginPassword('');
    setIsSubmitting(false);
    setStep('reg-success');
  }

  // Login submission
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError('Mohon isi email/nomor telepon dan kata sandi.');
      return;
    }

    setIsSubmitting(true);
    const cleanIdent = loginIdentifier.trim().toLowerCase();

    // 1. Try Supabase cloud auth if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .or(`email.ilike.${cleanIdent},phone.eq.${loginIdentifier.trim()}`)
          .limit(1);

        if (!error && data && data.length > 0) {
          const dbUser = data[0];
          if (dbUser.password_hash === loginPassword.trim()) {
            const loggedInUser: User = {
              id: dbUser.id || `user-${Date.now()}`,
              token: dbUser.token || `CY${Math.floor(1000 + Math.random() * 9000)}`,
              name: dbUser.name,
              age: dbUser.age,
              phone: dbUser.phone,
              email: dbUser.email,
              community_group: {
                name: dbUser.community_group_name || 'CG Central Youth 30',
                leader: dbUser.community_leader || 'Daniel Kristianto',
                schedule: dbUser.community_schedule || 'Jumat, 19.00',
                location: dbUser.community_location || 'Jl. Kartini no 118, Surabaya',
              },
              role: (dbUser.role as any) || 'member',
              status: dbUser.status || 'active',
              created_at: dbUser.created_at || new Date().toISOString(),
            };
            setStoredUser(loggedInUser);
            onLoginSuccess(loggedInUser);
            return;
          } else {
            setLoginError('Kata sandi tidak sesuai.');
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Supabase query error, checking local store:', err);
      }
    }

    // 2. Check locally registered users (Offline-First)
    const accounts = getRegisteredUsers();
    const found = accounts.find((a) => {
      const emailMatch = a.email.toLowerCase() === cleanIdent;
      const phoneMatch = a.phone.replace(/\D/g, '') === cleanIdent.replace(/\D/g, '');
      return emailMatch || phoneMatch;
    });

    if (found) {
      if (found.password === loginPassword.trim()) {
        const loggedInUser: User = {
          id: `user-${Date.now()}`,
          token: `CY${Math.floor(1000 + Math.random() * 9000)}`,
          name: found.name,
          age: typeof found.age === 'number' ? found.age : parseInt(found.age || '20'),
          phone: found.phone,
          email: found.email,
          community_group: found.community_group || DEFAULT_USER.community_group,
          role: 'member',
          status: 'active',
          created_at: new Date().toISOString(),
        };
        setStoredUser(loggedInUser);
        onLoginSuccess(loggedInUser);
        return;
      } else {
        setLoginError('Kata sandi tidak sesuai.');
        setIsSubmitting(false);
        return;
      }
    }

    // 3. Fallback demo password for ease of testing
    if (loginPassword.length >= 4) {
      const loggedInUser: User = {
        ...DEFAULT_USER,
        email: cleanIdent.includes('@') ? cleanIdent : DEFAULT_USER.email,
        phone: !cleanIdent.includes('@') ? cleanIdent : DEFAULT_USER.phone,
        community_group: {
          name: 'CG Central Youth 30',
          leader: 'Daniel Kristianto',
          schedule: 'Jumat, 19.00',
          location: 'Jl. Kartini no 118, Surabaya',
        },
      };
      setStoredUser(loggedInUser);
      onLoginSuccess(loggedInUser);
      return;
    }

    setLoginError('Akun tidak ditemukan. Silakan periksa kembali data Anda.');
    setIsSubmitting(false);
  }

  // Calculate progress for step indicators
  const stepNumber = 
    step === 'welcome' ? 1 :
    step === 'survey-longing' ? 2 :
    step === 'survey-presence' ? 3 :
    step === 'check-account' ? 4 :
    step === 'reg-name' ? 5 :
    step === 'reg-age' ? 6 :
    step === 'reg-phone' ? 7 :
    step === 'reg-email' ? 8 :
    step === 'reg-password' ? 9 : 10;

  const totalSteps = step.startsWith('reg-') ? 9 : 4;

  return (
    <div className="h-full w-full bg-transparent flex flex-col items-center justify-center overflow-hidden select-none sm:select-auto">
      <div className="w-full max-w-xl h-full bg-white dark:bg-[#121215] rounded-none sm:rounded-[36px] sm:border border-[#EAEAEB] dark:border-[#222226] sm:shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:sm:shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative">
        
        {/* Top Minimal Navigation Bar */}
        <div className="flex-none px-5 py-3.5 border-b border-[#EAEAEB] dark:border-[#222226] flex items-center justify-between bg-white dark:bg-[#121215] z-20">
          <div className="flex items-center gap-2">
            {step !== 'welcome' && step !== 'reg-success' && (
              <button
                type="button"
                onClick={() => {
                  if (step === 'login') setStep('welcome');
                  else if (step === 'survey-longing') setStep('welcome');
                  else if (step === 'survey-presence') setStep('survey-longing');
                  else if (step === 'check-account') setStep('survey-presence');
                  else if (step === 'reg-name') setStep('check-account');
                  else if (step === 'reg-age') setStep('reg-name');
                  else if (step === 'reg-phone') setStep('reg-age');
                  else if (step === 'reg-email') setStep('reg-phone');
                  else if (step === 'reg-password') setStep('reg-email');
                }}
                className="w-8 h-8 rounded-full bg-[#F2F2F4] dark:bg-[#1C1C20] hover:bg-[#EAEAEB] dark:hover:bg-[#25252A] flex items-center justify-center text-[#111113] dark:text-white transition active:scale-95 cursor-pointer"
                title="Kembali"
              >
                <ArrowLeft size={14} />
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
                <Sparkles size={11} />
              </div>
              <span className="text-xs font-bold tracking-wider text-[#111113] dark:text-white uppercase">
                CG Central Youth 30
              </span>
            </div>
          </div>

          {step !== 'welcome' && step !== 'login' && step !== 'reg-success' && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8E8E93] dark:text-[#A1A1AA]">
              <span>Langkah {stepNumber}</span>
              <span>/</span>
              <span>{totalSteps}</span>
            </div>
          )}
        </div>

        {/* Content Body Area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 py-6 flex flex-col justify-center">

          {/* ================================================================= */}
          {/* STEP 1: WELCOME SCREEN                                            */}
          {/* ================================================================= */}
          {step === 'welcome' && (
            <div className="space-y-6 text-center max-w-md mx-auto my-auto animate-in fade-in duration-300">
              {/* Sacred Cross Icon */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg border border-[#232327] dark:border-white/20">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v18" />
                  <path d="M7 8h10" />
                </svg>
              </div>

              <div className="space-y-2">
                <span className="inline-block text-[11px] font-mono tracking-widest text-[#8E8E93] dark:text-[#A1A1AA] uppercase">
                  Community Portal
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111113] dark:text-white tracking-tight">
                  Welcome CG Central Youth 30
                </h1>
                <p className="text-xs sm:text-sm text-[#66666E] dark:text-[#A1A1AA] leading-relaxed max-w-sm mx-auto">
                  Ruang teduh, privat, dan hangat untuk bersekutu, mendoakan pergumulan, dan merenungkan Firman Tuhan bersama.
                </p>
              </div>

              {/* Community Detail Snapshot */}
              <div className="bg-[#F9F9FA] dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] rounded-2xl p-4 text-xs text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E93] dark:text-[#A1A1AA]">Pemimpin</span>
                  <span className="font-semibold text-[#111113] dark:text-white">Daniel Kristianto</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E93] dark:text-[#A1A1AA]">Jadwal Ibadah</span>
                  <span className="font-semibold text-[#111113] dark:text-white">Jumat, 19.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E93] dark:text-[#A1A1AA]">Lokasi</span>
                  <span className="font-semibold text-[#111113] dark:text-white">Jl. Kartini no 118, Surabaya</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setStep('survey-longing')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer shadow-md"
                >
                  <span>Mulai Perkenalan</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#66666E] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white transition cursor-pointer"
                >
                  Sudah punya akun? <span className="underline font-bold text-[#111113] dark:text-white">Masuk ke Akun</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: SURVEY KERINDUAN ROHANI                                    */}
          {/* ================================================================= */}
          {step === 'survey-longing' && (
            <div className="space-y-5 max-w-md mx-auto my-auto animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-mono tracking-widest text-[#8E8E93] dark:text-[#A1A1AA] uppercase">
                  Pertanyaan 1 dari 2
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#111113] dark:text-white tracking-tight">
                  Apa yang paling kamu rindukan saat ini?
                </h2>
                <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                  Pilih satu hal yang paling mewakili isi hatimu hari ini.
                </p>
              </div>

              <div className="space-y-2.5">
                {LONGING_OPTIONS.map((opt) => {
                  const isSelected = selectedLonging === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedLonging(opt.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#111113] dark:border-white bg-[#F2F2F4] dark:bg-[#1E1E24] shadow-xs'
                          : 'border-[#EAEAEB] dark:border-[#26262B] bg-white dark:bg-[#18181D] hover:border-[#DCDCE0] dark:hover:border-[#383840]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                        isSelected
                          ? 'border-[#111113] dark:border-white bg-[#111113] dark:bg-white text-white dark:text-black'
                          : 'border-[#DCDCE0] dark:border-[#383840] bg-white dark:bg-[#18181D]'
                      }`}>
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <div className="text-xs">
                        <h4 className="font-semibold text-[#111113] dark:text-white">{opt.title}</h4>
                        <p className="text-[11px] text-[#66666E] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{opt.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!selectedLonging}
                onClick={() => setStep('survey-presence')}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer shadow-md"
              >
                <span>Lanjutkan</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: SURVEY KEHADIRAN KOMUNITAS                                */}
          {/* ================================================================= */}
          {step === 'survey-presence' && (
            <div className="space-y-5 max-w-md mx-auto my-auto animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-mono tracking-widest text-[#8E8E93] dark:text-[#A1A1AA] uppercase">
                  Pertanyaan 2 dari 2
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#111113] dark:text-white tracking-tight">
                  Status kehadiranmu di CG Central Youth 30?
                </h2>
                <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                  Bantu kami mengenal perjalananmu di komunitas ini.
                </p>
              </div>

              <div className="space-y-2.5">
                {PRESENCE_OPTIONS.map((opt) => {
                  const isSelected = selectedPresence === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedPresence(opt.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#111113] dark:border-white bg-[#F2F2F4] dark:bg-[#1E1E24] shadow-xs'
                          : 'border-[#EAEAEB] dark:border-[#26262B] bg-white dark:bg-[#18181D] hover:border-[#DCDCE0] dark:hover:border-[#383840]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                        isSelected
                          ? 'border-[#111113] dark:border-white bg-[#111113] dark:bg-white text-white dark:text-black'
                          : 'border-[#DCDCE0] dark:border-[#383840] bg-white dark:bg-[#18181D]'
                      }`}>
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <div className="text-xs">
                        <h4 className="font-semibold text-[#111113] dark:text-white">{opt.title}</h4>
                        <p className="text-[11px] text-[#66666E] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{opt.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!selectedPresence}
                onClick={() => setStep('check-account')}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer shadow-md"
              >
                <span>Lanjutkan</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: BRANCHING QUESTION - SUDAH PUNYA AKUN ATAU BELUM?          */}
          {/* ================================================================= */}
          {step === 'check-account' && (
            <div className="space-y-6 max-w-md mx-auto my-auto animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-mono tracking-widest text-[#8E8E93] dark:text-[#A1A1AA] uppercase">
                  Konfirmasi Akun
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#111113] dark:text-white tracking-tight">
                  Apakah kamu sudah memiliki akun?
                </h2>
                <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                  Pilih sesuai status pendaftaran akunmu sebelumnya.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Opsi 1: Sudah Punya Akun */}
                <div
                  onClick={() => setStep('login')}
                  className="p-5 rounded-2xl border border-[#DCDCE0] dark:border-[#2C2C32] bg-white dark:bg-[#18181D] hover:bg-[#F9F9FA] dark:hover:bg-[#202026] active:scale-[0.98] transition cursor-pointer flex flex-col justify-between space-y-3 group shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F2F2F4] dark:bg-[#24242C] text-[#111113] dark:text-white flex items-center justify-center group-hover:bg-[#111113] group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition">
                    <LogIn size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111113] dark:text-white">Sudah Punya Akun</h4>
                    <p className="text-[11px] text-[#66666E] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">
                      Langsung masuk menggunakan email atau nomor telepon yang terdaftar.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#111113] dark:text-white flex items-center gap-1">
                    Masuk Sekarang <ArrowRight size={11} />
                  </span>
                </div>

                {/* Opsi 2: Belum Punya Akun */}
                <div
                  onClick={() => setStep('reg-name')}
                  className="p-5 rounded-2xl border border-[#111113] dark:border-white bg-[#111113] dark:bg-white text-white dark:text-black active:scale-[0.98] transition cursor-pointer flex flex-col justify-between space-y-3 shadow-md"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/10 dark:bg-black/10 text-white dark:text-black flex items-center justify-center">
                    <UserIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white dark:text-black">Belum Punya Akun</h4>
                    <p className="text-[11px] text-neutral-300 dark:text-neutral-700 mt-0.5 leading-relaxed">
                      Daftar akun baru langkah demi langkah untuk CG Central Youth 30.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-white dark:text-black flex items-center gap-1">
                    Buat Akun Baru <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 5: REGISTRATION - NAMA LENGKAP                                */}
          {/* ================================================================= */}
          {step === 'reg-name' && (
            <div className="space-y-5 max-w-md mx-auto my-auto animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-mono tracking-widest text-[#8E8E93] dark:text-[#A1A1AA] uppercase">
                  Pendaftaran Anggota • Langkah 1
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#111113] dark:text-white tracking-tight">
                  Siapa nama lengkapmu?
                </h2>
                <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                  Nama ini akan dicantumkan pada kartu profil komunitasmu.
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8E93] dark:text-[#A1A1AA]">
                    <UserIcon size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && regName.trim()) setStep('reg-age');
                    }}
                    placeholder="Contoh: Filius Kristanto"
                    className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-[#DCDCE0] dark:border-[#2C2C32] bg-[#F2F2F4] dark:bg-[#1C1C20] focus:outline-none focus:border-black dark:focus:border-white text-[#111113] dark:text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!regName.trim()}
                onClick={() => setStep('reg-age')}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer shadow-md"
              >
                <span>Lanjut ke Usia</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 6: REGISTRATION - UMUR                                       */}
          {/* ================================================================= */}
          {step === 'reg-age' && (
            <div className="space-y-5 max-w-md mx-auto my-auto animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-mono tracking-widest text-[#8E8E93] dark:text-[#A1A1AA] uppercase">
                  Pendaftaran Anggota • Langkah 2
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#111113] dark:text-white tracking-tight">
                  Berapa usiamu saat ini?
                </h2>
                <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                  Membantu kami menghubungkanmu dengan teman sebaya di Central Youth 30.
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8E93] dark:text-[#A1A1AA]">
                    <Calendar size={14} />
                  </div>
                  <input
                    type="number"
                    min="12"
                    max="99"
                    autoFocus
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && regAge.trim()) setStep('reg-phone');
                    }}
                    placeholder="Contoh: 20"
                    className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-[#DCDCE0] dark:border-[#2C2C32] bg-[#F2F2F4] dark:bg-[#1C1C20] focus:outline-none focus:border-black dark:focus:border-white text-[#111113] dark:text-white"
                  />
                </div>

                {/* Quick age chips */}
                <div className="flex gap-2 justify-center pt-1 flex-wrap">
                  {['17', '18', '19', '20', '21', '22', '23+'].map((age) => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setRegAge(age.replace('+', ''))}
                      className={`px-2.5 py-1 rounded-full text-[11px] border transition cursor-pointer ${
                        regAge === age.replace('+', '')
                          ? 'border-[#111113] dark:border-white bg-[#111113] dark:bg-white text-white dark:text-black font-semibold'
                          : 'border-[#DCDCE0] dark:border-[#2C2C32] bg-[#F2F2F4] dark:bg-[#1C1C20] text-[#66666E] dark:text-[#A1A1AA]'
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={!regAge.trim()}
                onClick={() => setStep('reg-phone')}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer shadow-md"
              >
                <span>Lanjut ke Nomor WhatsApp</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 7: REGISTRATION - NOMOR TELEPON                              */}
          {/* ================================================================= */}
          {step === 'reg-phone' && (
            <div className="space-y-5 max-w-md mx-auto my-auto animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-mono tracking-widest text-[#8E8E93] dark:text-[#A1A1AA] uppercase">
                  Pendaftaran Anggota • Langkah 3
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#111113] dark:text-white tracking-tight">
                  Nomor WhatsApp aktifmu?
                </h2>
                <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                  Digunakan untuk koordinasi CG dan notifikasi saat teduh.
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8E93] dark:text-[#A1A1AA]">
                    <Phone size={14} />
                  </div>
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && regPhone.trim()) setStep('reg-email');
                    }}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-[#DCDCE0] dark:border-[#2C2C32] bg-[#F2F2F4] dark:bg-[#1C1C20] focus:outline-none focus:border-black dark:focus:border-white text-[#111113] dark:text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!regPhone.trim()}
                onClick={() => setStep('reg-email')}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer shadow-md"
              >
                <span>Lanjut ke Email</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 8: REGISTRATION - EMAIL                                      */}
          {/* ================================================================= */}
          {step === 'reg-email' && (
            <div className="space-y-5 max-w-md mx-auto my-auto animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-mono tracking-widest text-[#8E8E93] dark:text-[#A1A1AA] uppercase">
                  Pendaftaran Anggota • Langkah 4
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#111113] dark:text-white tracking-tight">
                  Email yang didaftarkan?
                </h2>
                <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                  Alamat email untuk masuk akun dan akses ruang hening.
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8E93] dark:text-[#A1A1AA]">
                    <Mail size={14} />
                  </div>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && regEmail.trim()) setStep('reg-password');
                    }}
                    placeholder="Contoh: nama@domain.com"
                    className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-[#DCDCE0] dark:border-[#2C2C32] bg-[#F2F2F4] dark:bg-[#1C1C20] focus:outline-none focus:border-black dark:focus:border-white text-[#111113] dark:text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!regEmail.trim() || !regEmail.includes('@')}
                onClick={() => setStep('reg-password')}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer shadow-md"
              >
                <span>Lanjut ke Kata Sandi</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 9: REGISTRATION - PASSWORD & KONFIRMASI PASSWORD             */}
          {/* ================================================================= */}
          {step === 'reg-password' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4 max-w-md mx-auto my-auto animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-mono tracking-widest text-[#8E8E93] dark:text-[#A1A1AA] uppercase">
                  Pendaftaran Anggota • Langkah Terakhir
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#111113] dark:text-white tracking-tight">
                  Buat kata sandi akunmu
                </h2>
                <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                  Gunakan minimal 6 karakter untuk mengamankan akunmu.
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-[#F2F2F4] dark:bg-[#1C1C20] border border-[#DCDCE0] dark:border-[#2C2C32] rounded-xl text-xs text-[#111113] dark:text-rose-400 font-medium text-center">
                  {regError}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#111113] dark:text-white">
                    Kata Sandi:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8E93] dark:text-[#A1A1AA]">
                      <Lock size={14} />
                    </div>
                    <input
                      type="password"
                      required
                      autoFocus
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-[#DCDCE0] dark:border-[#2C2C32] bg-[#F2F2F4] dark:bg-[#1C1C20] focus:outline-none focus:border-black dark:focus:border-white text-[#111113] dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#111113] dark:text-white">
                    Konfirmasi Kata Sandi:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8E93] dark:text-[#A1A1AA]">
                      <Lock size={14} />
                    </div>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi"
                      className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-[#DCDCE0] dark:border-[#2C2C32] bg-[#F2F2F4] dark:bg-[#1C1C20] focus:outline-none focus:border-black dark:focus:border-white text-[#111113] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!regPassword || !regConfirmPassword || isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer shadow-md"
                >
                  <CheckCircle2 size={15} />
                  <span>{isSubmitting ? 'Mendaftarkan Akun...' : 'Selesaikan Pendaftaran'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* STEP 10: REGISTRATION SUCCESS NOTIFICATION                        */}
          {/* ================================================================= */}
          {step === 'reg-success' && (
            <div className="space-y-6 text-center max-w-md mx-auto my-auto animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 size={30} />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono tracking-widest text-[#8E8E93] dark:text-[#A1A1AA] uppercase">
                  Pendaftaran Sukses
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#111113] dark:text-white">
                  Selamat Bergabung, {regName}!
                </h2>
                <p className="text-xs text-[#66666E] dark:text-[#A1A1AA] leading-relaxed max-w-sm mx-auto">
                  Akunmu di CG Central Youth 30 telah berhasil dibuat. Silakan masuk menggunakan kata sandi yang baru saja kamu daftarkan.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <span>Lanjut ke Halaman Login</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 11: LOGIN SCREEN                                             */}
          {/* ================================================================= */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5 max-w-md mx-auto my-auto animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <LogIn size={20} />
                </div>
                <h2 className="text-xl font-bold text-[#111113] dark:text-white tracking-tight">
                  Masuk ke Akun
                </h2>
                <p className="text-xs text-[#66666E] dark:text-[#A1A1AA]">
                  CG Central Youth 30 • Faith Hub
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium text-center">
                  {loginError}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#111113] dark:text-white">
                    Email atau Nomor WhatsApp:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8E93] dark:text-[#A1A1AA]">
                      <Mail size={14} />
                    </div>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="nama@domain.com atau 0812..."
                      className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-[#DCDCE0] dark:border-[#2C2C32] bg-[#F2F2F4] dark:bg-[#1C1C20] focus:outline-none focus:border-black dark:focus:border-white text-[#111113] dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[#111113] dark:text-white">
                      Kata Sandi:
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8E93] dark:text-[#A1A1AA]">
                      <Lock size={14} />
                    </div>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akunmu"
                      className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-[#DCDCE0] dark:border-[#2C2C32] bg-[#F2F2F4] dark:bg-[#1C1C20] focus:outline-none focus:border-black dark:focus:border-white text-[#111113] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <LogIn size={14} />
                  <span>{isSubmitting ? 'Memverifikasi Akun...' : 'Masuk Sekarang'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('reg-name')}
                    className="text-xs text-[#66666E] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white transition font-medium cursor-pointer"
                  >
                    Belum punya akun? <span className="font-semibold underline text-[#111113] dark:text-white">Daftar Akun Baru</span>
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

        {/* Bottom Community Footer Branding */}
        <div className="flex-none py-3 border-t border-[#EAEAEB] dark:border-[#222226] text-center text-[10px] text-[#8E8E93] dark:text-[#A1A1AA] bg-[#F9F9FA] dark:bg-[#151518]">
          CG Central Youth 30 • Pertemuan Jumat 19.00 • Jl. Kartini no 118, Surabaya
        </div>

      </div>
    </div>
  );
}

