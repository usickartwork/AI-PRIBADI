'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/faith/Header';
import Navigation from '@/app/components/faith/Navigation';
import FaithQuiz from '@/app/components/faith/arcade/FaithQuiz';
import FaithPet from '@/app/components/faith/arcade/FaithPet';
import ChurchBuilder from '@/app/components/faith/builder/ChurchBuilder';
import { TileSmallChurch } from '@/app/components/faith/builder/BuilderAssets';
import { getArcadeEconomy, saveArcadeEconomy, addCoinsAndXp, getPetState } from '@/lib/faith/arcade/storage';
import { ArcadeEconomy } from '@/lib/faith/arcade/types';
import { DAILY_LOGIN_REWARDS } from '@/lib/faith/arcade/petShopData';
import { getStoredUser, DEFAULT_USER } from '@/lib/faith/session';
import { User } from '@/types/database';
import { FaithLamb, FoodVector } from '@/app/components/faith/arcade/VectorAssets';
import {
  Gamepad2,
  Trophy,
  Flame,
  Coins,
  Star,
  Gift,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calendar,
  X,
  Play,
  HelpCircle,
  Clock,
  Layers,
  Award,
} from 'lucide-react';

export default function GamesPage() {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [activeView, setActiveView] = useState<'hub' | 'quiz' | 'quiz-daily' | 'pet' | 'builder'>('hub');
  const [economy, setEconomy] = useState<ArcadeEconomy | null>(null);
  const [petStage, setPetStage] = useState<'egg' | 'baby' | 'young' | 'adult'>('young');
  const [petLevel, setPetLevel] = useState(1);
  const [showDailyRewardModal, setShowDailyRewardModal] = useState(false);

  // Sync user & economy
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setEconomy(getArcadeEconomy());
    const pet = getPetState();
    setPetStage(pet.stage);
    setPetLevel(pet.level);

    const handleUpdate = () => {
      setEconomy(getArcadeEconomy());
      const p = getPetState();
      setPetStage(p.stage);
      setPetLevel(p.level);
    };

    window.addEventListener('faith_arcade_economy_updated', handleUpdate);
    window.addEventListener('faith_arcade_pet_updated', handleUpdate);

    return () => {
      window.removeEventListener('faith_arcade_economy_updated', handleUpdate);
      window.removeEventListener('faith_arcade_pet_updated', handleUpdate);
    };
  }, []);

  if (!economy) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F4F4F6]">
        <div className="w-7 h-7 border-2 border-[#111113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isDailyDoneToday = economy.dailyChallengeDoneDate === today;

  // Claim Daily Login Reward
  const currentStreakDay = ((economy.dailyStreak - 1) % 7) + 1;
  const isDayClaimed = economy.claimedDailyRewards.includes(currentStreakDay);

  const handleClaimDailyReward = () => {
    if (isDayClaimed) return;
    const reward = DAILY_LOGIN_REWARDS[currentStreakDay - 1];
    if (!reward) return;

    if (reward.type === 'coins' && reward.amount) {
      addCoinsAndXp(reward.amount, 20);
    } else {
      addCoinsAndXp(25, 25);
    }

    const updated = {
      ...economy,
      claimedDailyRewards: [...economy.claimedDailyRewards, currentStreakDay],
    };
    saveArcadeEconomy(updated);
    setEconomy(updated);
  };

  return (
    <div className="h-full w-full bg-transparent flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full max-w-4xl h-full bg-[#F4F4F6] dark:bg-[#121215] rounded-none sm:rounded-[36px] sm:border border-[#EAEAEB] dark:border-[#222226] sm:shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:sm:shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto flex flex-col">
          {activeView === 'quiz' && (
            <FaithQuiz onBack={() => setActiveView('hub')} isDaily={false} />
          )}

          {activeView === 'quiz-daily' && (
            <FaithQuiz onBack={() => setActiveView('hub')} isDaily={true} />
          )}

          {activeView === 'pet' && (
            <FaithPet onBack={() => setActiveView('hub')} />
          )}

          {activeView === 'builder' && (
            <ChurchBuilder onBack={() => setActiveView('hub')} />
          )}

          {activeView === 'hub' && (
            <div className="max-w-md mx-auto w-full p-4 flex flex-col gap-4 animate-page-enter">
              {/* TOP STATS & ECONOMY CARD */}
              <div className="bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] rounded-3xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
                      <Gamepad2 size={19} strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold tracking-tight leading-none text-[#111113] dark:text-white">
                        Faith Arcade
                      </h2>
                      <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-medium block mt-0.5">
                        Pusat Aktivitas &amp; Sahabat Digital
                      </span>
                    </div>
                  </div>

                  {/* Daily Reward Button */}
                  <button
                    onClick={() => setShowDailyRewardModal(true)}
                    className="relative px-3 py-1.5 bg-[#FAFAFA] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#2C2C32] hover:bg-[#F4F4F6] dark:hover:bg-[#282830] rounded-2xl active:scale-95 transition-all text-[#111113] dark:text-white flex items-center gap-1.5 cursor-pointer"
                    title="Hadiah Harian"
                  >
                    <Gift size={15} className="text-[#111113] dark:text-white" />
                    <span className="text-xs font-bold">Reward</span>
                    {!isDayClaimed && (
                      <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                    )}
                  </button>
                </div>

                {/* Currency & Streak Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EAEAEB] dark:border-[#26262B]">
                  {/* Coins */}
                  <div className="bg-[#FAFAFA] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#2C2C32] rounded-2xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#282830] border border-[#EAEAEB] dark:border-[#33333C] flex items-center justify-center shrink-0">
                      <Coins size={14} className="text-[#111113] dark:text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block font-semibold leading-none">
                        Koin Hub
                      </span>
                      <span className="text-sm font-extrabold text-[#111113] dark:text-white truncate block mt-0.5">
                        {economy.coins}
                      </span>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="bg-[#FAFAFA] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#2C2C32] rounded-2xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#282830] border border-[#EAEAEB] dark:border-[#33333C] flex items-center justify-center shrink-0">
                      <Star size={14} className="text-[#111113] dark:text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block font-semibold leading-none">
                        XP Total
                      </span>
                      <span className="text-sm font-extrabold text-[#111113] dark:text-white truncate block mt-0.5">
                        {economy.xp}
                      </span>
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="bg-[#FAFAFA] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#2C2C32] rounded-2xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#282830] border border-[#EAEAEB] dark:border-[#33333C] flex items-center justify-center shrink-0">
                      <Flame size={14} className="text-[#111113] dark:text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block font-semibold leading-none">
                        Streak
                      </span>
                      <span className="text-sm font-extrabold text-[#111113] dark:text-white truncate block mt-0.5">
                        {economy.dailyStreak} Hari
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DAILY CHALLENGE BANNER (EDITORIAL MINIMALIST) */}
              <div className="bg-[#111113] dark:bg-[#1E1E24] rounded-3xl p-5 text-white shadow-sm relative overflow-hidden border border-[#27272A] dark:border-[#33333A]">
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-300 bg-white/10 px-2.5 py-1 rounded-full">
                      Tantangan Harian
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold">
                      <Calendar size={13} />
                      <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-white">
                      Daily Faith Quiz
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      Selesaikan 10 soal kurasi hari ini untuk bonus +100 XP, +50 Koin, dan pertahankan Daily Streak.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-xs font-bold text-neutral-200">
                      <span className="flex items-center gap-1">
                        <Coins size={13} /> +50 Koin
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Star size={13} /> +100 XP
                      </span>
                    </div>

                    {isDailyDoneToday ? (
                      <div className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/15">
                        <CheckCircle2 size={14} />
                        <span>Selesai</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveView('quiz-daily')}
                        className="bg-white text-[#111113] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-neutral-100 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play size={12} className="fill-black" />
                        <span>Mulai Tantangan</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 2 MAIN GAME CARDS */}
              <div className="flex flex-col gap-3.5">
                {/* GAME 1: FAITH QUIZ */}
                <div className="bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-black/30 dark:hover:border-white/30 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] bg-[#F4F4F6] dark:bg-[#222228] px-2.5 py-1 rounded-full">
                        Game 1 • Kuis Refleksi
                      </span>
                      <h3 className="text-lg font-extrabold text-[#111113] dark:text-white mt-2">
                        Faith Quiz
                      </h3>
                      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed mt-1">
                        Kuis pilihan ganda casual seputar Alkitab. Uji kecepatan berpikir dalam batas waktu 15 detik, pertahankan streak combo, dan kumpulkan koin.
                      </p>
                    </div>

                    {/* Clean Vector Visual Icon for Quiz */}
                    <div className="w-14 h-14 rounded-2xl bg-[#FAFAFA] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#26262B] flex items-center justify-center shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center">
                        <HelpCircle size={20} strokeWidth={2.2} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#EAEAEB] dark:border-[#26262B]">
                    <div className="flex items-center gap-3 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> 15 Detik
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Flame size={13} /> Combo x5
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveView('quiz')}
                      className="bg-[#111113] dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-[#27272A] dark:hover:bg-neutral-200 active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                      <span>Mulai Kuis</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* GAME 2: FAITH PET */}
                <div className="bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-black/30 dark:hover:border-white/30 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] bg-[#F4F4F6] dark:bg-[#222228] px-2.5 py-1 rounded-full">
                        Game 2 • Virtual Companion
                      </span>
                      <h3 className="text-lg font-extrabold text-[#111113] dark:text-white mt-2">
                        Faith Pet
                      </h3>
                      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed mt-1">
                        Sahabat domba virtual 2D terinspirasi gameplay Pou. Jelajahi 4 ruangan: Dapur makan, Kamar Mandi bersabun &amp; shower, Kamar Tidur bersakelar lampu, dan Ruang Bermain.
                      </p>
                    </div>

                    {/* Clean Mini Lamb Character Visual */}
                    <div className="w-14 h-14 rounded-2xl bg-[#FAFAFA] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#26262B] flex items-center justify-center shrink-0 overflow-hidden">
                      <FaithLamb stage={petStage} mood="happy" isBlinking={false} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#EAEAEB] dark:border-[#26262B]">
                    <div className="flex items-center gap-3 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                      <span>Level {petLevel}</span>
                      <span>•</span>
                      <span className="capitalize">{petStage} Stage</span>
                    </div>

                    <button
                      onClick={() => setActiveView('pet')}
                      className="bg-[#111113] dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-[#27272A] dark:hover:bg-neutral-200 active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                      <span>Buka Kamar Pet</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* GAME 3: CHURCH BUILDER */}
                <div className="bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-black/30 dark:hover:border-white/30 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] bg-[#F4F4F6] dark:bg-[#222228] px-2.5 py-1 rounded-full">
                        Game 3 • City Builder 2D
                      </span>
                      <h3 className="text-lg font-extrabold text-[#111113] dark:text-white mt-2">
                        Church Builder
                      </h3>
                      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed mt-1">
                        Bangun dan kembangkan komunitas gerejamu dari lahan kecil menjadi kompleks yang hidup. Bangun aula, kafe, taman doa, dan jalan setapak dengan warga NPC yang aktif berkunjung.
                      </p>
                    </div>

                    {/* Clean Mini Church Vector Visual */}
                    <div className="w-14 h-14 rounded-2xl bg-[#FAFAFA] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#26262B] flex items-center justify-center shrink-0 overflow-hidden p-1">
                      <TileSmallChurch level={1} isNight={false} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#EAEAEB] dark:border-[#26262B]">
                    <div className="flex items-center gap-3 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                      <span>Simulasi 2D</span>
                      <span>•</span>
                      <span>Cozy Casual</span>
                    </div>

                    <button
                      onClick={() => setActiveView('builder')}
                      className="bg-[#111113] dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-[#27272A] dark:hover:bg-neutral-200 active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                      <span>Mulai Membangun</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

      {/* DAILY LOGIN REWARD MODAL (CLEAN EDITORIAL) */}
      {showDailyRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-page-enter">
          <div className="bg-white dark:bg-[#18181D] rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-[#EAEAEB] dark:border-[#26262B] relative">
            <button
              onClick={() => setShowDailyRewardModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white hover:bg-[#F4F4F6] dark:hover:bg-[#222228] transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto mb-2">
                <Gift size={20} />
              </div>
              <h3 className="text-base font-extrabold text-[#111113] dark:text-white">Hadiah Login 7 Hari</h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                Buka Faith Arcade setiap hari untuk klaim koin, nutrisi pet, dan aksesoris.
              </p>
            </div>

            {/* 7 Days Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {DAILY_LOGIN_REWARDS.map((reward) => {
                const isCurrent = reward.day === currentStreakDay;
                const isClaimed = economy.claimedDailyRewards.includes(reward.day);

                return (
                  <div
                    key={reward.day}
                    className={`p-2 rounded-2xl border text-center flex flex-col items-center justify-between ${
                      isCurrent
                        ? 'border-black dark:border-white bg-[#FAFAFA] dark:bg-[#202026] ring-2 ring-black dark:ring-white'
                        : isClaimed
                        ? 'border-[#EAEAEB] dark:border-[#26262B] bg-[#F4F4F6] dark:bg-[#1E1E24] opacity-60'
                        : 'border-[#EAEAEB] dark:border-[#26262B] bg-white dark:bg-[#222228]'
                    } ${reward.day === 7 ? 'col-span-2' : ''}`}
                  >
                    <span className="text-[10px] font-bold text-[#71717A] dark:text-[#A1A1AA]">Hari {reward.day}</span>
                    <div className="my-1.5">
                      {reward.type === 'coins' ? (
                        <Coins size={18} className="text-[#111113] dark:text-white" />
                      ) : reward.type === 'food' ? (
                        <FoodVector type="apple" size={20} />
                      ) : (
                        <Award size={18} className="text-[#111113] dark:text-white" />
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold text-[#111113] dark:text-white line-clamp-1">
                      {reward.label}
                    </span>

                    {isClaimed && (
                      <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                        <CheckCircle2 size={10} /> Selesai
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleClaimDailyReward}
              disabled={isDayClaimed}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isDayClaimed
                  ? 'bg-[#111113] hover:bg-[#27272A] dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black shadow-sm active:scale-98'
                  : 'bg-[#F4F4F6] dark:bg-[#222228] text-[#A1A1AA] dark:text-[#66666E] cursor-not-allowed'
              }`}
            >
              <span>{isDayClaimed ? 'Hadiah Hari Ini Sudah Diklaim' : 'Klaim Hadiah Hari Ini'}</span>
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <Navigation />
    </div>
  </div>
  );
}

