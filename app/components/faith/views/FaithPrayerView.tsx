'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/faith/Header';
import Navigation from '@/app/components/faith/Navigation';
import { getStoredUser, DEFAULT_USER } from '@/lib/faith/session';
import { User, Prayer, Gratitude, PrayerCategory, PrayerStatus } from '@/types/database';
import { 
  HeartHandshake, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Smile, 
  Heart, 
  Filter, 
  BookHeart
} from 'lucide-react';

const CATEGORIES: PrayerCategory[] = ['Family', 'Study', 'Work', 'Future', 'Relationship', 'Personal'];

export default function PrayerPage() {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [activeTab, setActiveTab] = useState<'prayer' | 'gratitude' | 'reflection'>('prayer');

  // Personal Prayers state
  const [prayers, setPrayers] = useState<Prayer[]>([
    {
      id: 'prayer-1',
      user_id: 'user-demo',
      content: 'Diberikan hikmat dan ketenangan dalam memimpin acara CG Fun minggu ini.',
      category: 'Work',
      status: 'praying',
      created_at: '2026-09-24T10:00:00Z',
    },
    {
      id: 'prayer-2',
      user_id: 'user-demo',
      content: 'Kesehatan papa & mama di rumah serta pemulihan kondisi mama.',
      category: 'Family',
      status: 'praying',
      created_at: '2026-09-22T08:30:00Z',
    },
    {
      id: 'prayer-3',
      user_id: 'user-demo',
      content: 'Kelulusan ujian sertifikasi kompetensi bulan ini.',
      category: 'Study',
      status: 'answered',
      answered_at: '2026-09-25T14:00:00Z',
      created_at: '2026-09-15T09:00:00Z',
    },
  ]);

  // Gratitude List state
  const [gratitudes, setGratitudes] = useState<Gratitude[]>([
    {
      id: 'grat-1',
      user_id: 'user-demo',
      content: 'Keluarga yang selalu mendukung dan memberikan kehangatan.',
      category: 'Family',
      created_at: '2026-09-26T07:00:00Z',
    },
    {
      id: 'grat-2',
      user_id: 'user-demo',
      content: 'Teman-teman CG yang tulus saling mendoakan dan mendengarkan.',
      category: 'Friends',
      created_at: '2026-09-25T08:15:00Z',
    },
    {
      id: 'grat-3',
      user_id: 'user-demo',
      content: 'Kesehatan dan nafas hidup yang baru di pagi hari.',
      category: 'Health',
      created_at: '2026-09-24T06:45:00Z',
    },
  ]);

  // Modals & form input states
  const [isNewPrayerOpen, setIsNewPrayerOpen] = useState(false);
  const [prayerContent, setPrayerContent] = useState('');
  const [prayerCategory, setPrayerCategory] = useState<PrayerCategory>('Personal');

  const [gratitudeContent, setGratitudeContent] = useState('');
  const [gratitudeCategory, setGratitudeCategory] = useState('Personal');

  // Filter state for prayers
  const [statusFilter, setStatusFilter] = useState<'ALL' | PrayerStatus>('ALL');

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser || DEFAULT_USER);
  }, []);

  function handleCreatePrayer(e: React.FormEvent) {
    e.preventDefault();
    if (!prayerContent.trim()) return;

    const newPrayer: Prayer = {
      id: `prayer-${Date.now()}`,
      user_id: user?.id || 'user-demo',
      content: prayerContent.trim(),
      category: prayerCategory,
      status: 'praying',
      created_at: new Date().toISOString(),
    };

    setPrayers([newPrayer, ...prayers]);
    setPrayerContent('');
    setIsNewPrayerOpen(false);
  }

  function handleUpdatePrayerStatus(id: string, newStatus: PrayerStatus) {
    setPrayers(
      prayers.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status: newStatus,
            answered_at: newStatus === 'answered' ? new Date().toISOString() : null,
          };
        }
        return p;
      })
    );
  }

  function handleCreateGratitude(e: React.FormEvent) {
    e.preventDefault();
    if (!gratitudeContent.trim()) return;

    const newGratitude: Gratitude = {
      id: `grat-${Date.now()}`,
      user_id: user?.id || 'user-demo',
      content: gratitudeContent.trim(),
      category: gratitudeCategory,
      created_at: new Date().toISOString(),
    };

    setGratitudes([newGratitude, ...gratitudes]);
    setGratitudeContent('');
  }

  const filteredPrayers = prayers.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });


  return (
    <div className="h-full w-full bg-transparent flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full max-w-4xl h-full bg-white dark:bg-[#121215] rounded-none sm:rounded-[36px] sm:border border-[#EAEAEB] dark:border-[#222226] sm:shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:sm:shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-[#EAEAEB] dark:bg-[#1C1C20] p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('prayer')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'prayer'
                ? 'bg-white dark:bg-[#282830] text-[#111113] dark:text-white shadow-xs font-bold'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Doa Pribadi</span>
          </button>
          <button
            onClick={() => setActiveTab('gratitude')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'gratitude'
                ? 'bg-white dark:bg-[#282830] text-[#111113] dark:text-white shadow-xs font-bold'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Gratitude</span>
          </button>
        </div>

        {/* ================= TAB 1: PRAYER JOURNAL ================= */}
        {activeTab === 'prayer' && (
          <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111113] dark:text-white">Jurnal Doa Pribadi</h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {prayers.filter((p) => p.status === 'praying').length} pokok doa aktif
                </p>
              </div>
              <button
                onClick={() => setIsNewPrayerOpen(true)}
                className="flex items-center gap-1 bg-[#111113] dark:bg-white text-white dark:text-black text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Doa</span>
              </button>
            </div>

            {/* Status Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-medium">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'praying', label: '🙏 Praying' },
                { id: 'waiting', label: '⏳ Waiting' },
                { id: 'answered', label: '✅ Answered' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStatusFilter(item.id as typeof statusFilter)}
                  className={`px-3 py-1 rounded-full text-xs transition active:scale-95 ${
                    statusFilter === item.id
                      ? 'bg-[#111113] dark:bg-white text-white dark:text-black font-semibold'
                      : 'bg-white dark:bg-[#1C1C20] border border-[#EAEAEB] dark:border-[#2C2C32] text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F6] dark:hover:bg-[#25252A]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Prayer List */}
            <div className="space-y-2.5">
              {filteredPrayers.length === 0 ? (
                <div className="bg-white dark:bg-[#18181D] rounded-2xl p-8 text-center border border-[#EAEAEB] dark:border-[#26262B] shadow-xs">
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Belum ada doa di kategori ini.</p>
                </div>
              ) : (
                filteredPrayers.map((prayer) => (
                  <div
                    key={prayer.id}
                    className="bg-white dark:bg-[#18181D] rounded-2xl p-4 border border-[#EAEAEB] dark:border-[#26262B] shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#111113] dark:text-neutral-200 leading-snug">
                        {prayer.content}
                      </p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F4F6] dark:bg-[#222228] text-[#71717A] dark:text-[#A1A1AA] flex-shrink-0">
                        {prayer.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#EAEAEB] dark:border-[#26262B] text-xs">
                      {/* Status Selector */}
                      <div className="flex gap-1 text-[11px]">
                        <button
                          onClick={() => handleUpdatePrayerStatus(prayer.id, 'praying')}
                          className={`px-2 py-0.5 rounded-md transition font-medium cursor-pointer ${
                            prayer.status === 'praying'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold'
                              : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F6] dark:hover:bg-[#25252A]'
                          }`}
                        >
                          🙏 Praying
                        </button>
                        <button
                          onClick={() => handleUpdatePrayerStatus(prayer.id, 'waiting')}
                          className={`px-2 py-0.5 rounded-md transition font-medium cursor-pointer ${
                            prayer.status === 'waiting'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold'
                              : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F6] dark:hover:bg-[#25252A]'
                          }`}
                        >
                          ⏳ Waiting
                        </button>
                        <button
                          onClick={() => handleUpdatePrayerStatus(prayer.id, 'answered')}
                          className={`px-2 py-0.5 rounded-md transition font-medium cursor-pointer ${
                            prayer.status === 'answered'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                              : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F6] dark:hover:bg-[#25252A]'
                          }`}
                        >
                          ✅ Answered
                        </button>
                      </div>

                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                        {new Date(prayer.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: GRATITUDE JOURNAL ================= */}
        {activeTab === 'gratitude' && (
          <div className="space-y-4">
            {/* Input Card */}
            <form
              onSubmit={handleCreateGratitude}
              className="bg-white dark:bg-[#18181D] rounded-2xl p-4 border border-[#EAEAEB] dark:border-[#26262B] shadow-xs space-y-3"
            >
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>What are you thankful for today?</span>
              </div>

              <textarea
                rows={2}
                value={gratitudeContent}
                onChange={(e) => setGratitudeContent(e.target.value)}
                placeholder="Tuliskan hal kecil atau besar yang kamu syukuri hari ini..."
                className="w-full text-xs p-3 bg-[#F4F4F6] dark:bg-[#1E1E24] border border-[#EAEAEB] dark:border-[#2C2C32] text-[#111113] dark:text-white placeholder-[#8E8E93] dark:placeholder-[#66666E] rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
              />

              <div className="flex items-center justify-between pt-1">
                <select
                  value={gratitudeCategory}
                  onChange={(e) => setGratitudeCategory(e.target.value)}
                  className="text-xs bg-[#F4F4F6] dark:bg-[#1E1E24] border border-[#EAEAEB] dark:border-[#2C2C32] rounded-lg px-2.5 py-1 text-[#111113] dark:text-white focus:outline-none"
                >
                  <option value="Family">❤️ Family</option>
                  <option value="Friends">👥 Friends</option>
                  <option value="Health">💪 Health</option>
                  <option value="Work/Study">💼 Work / Study</option>
                  <option value="Personal">✨ Personal</option>
                </select>

                <button
                  type="submit"
                  disabled={!gratitudeContent.trim()}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Save Gratitude
                </button>
              </div>
            </form>

            {/* Gratitude History */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#111113] dark:text-white uppercase tracking-wider block">
                Riwayat Ucapan Syukur
              </span>

              {gratitudes.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#18181D] rounded-2xl p-3.5 border border-[#EAEAEB] dark:border-[#26262B] shadow-xs flex items-start gap-3"
                >
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex-shrink-0 mt-0.5">
                    <Heart className="w-3.5 h-3.5 fill-rose-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.2 rounded-full">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[#111113] dark:text-neutral-200 mt-1 font-medium">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: New Personal Prayer */}
        {isNewPrayerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#EAEAEB] dark:border-[#26262B] pb-2">
                <h3 className="text-sm font-bold text-[#111113] dark:text-white">Buat Pokok Doa Pribadi</h3>
                <button
                  onClick={() => setIsNewPrayerOpen(false)}
                  className="text-[#71717A] hover:text-[#111113] dark:text-[#A1A1AA] dark:hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePrayer} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#111113] dark:text-neutral-200 block mb-1">
                    What would you like to pray for?
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={prayerContent}
                    onChange={(e) => setPrayerContent(e.target.value)}
                    placeholder="Tuliskan pokok doamu di sini..."
                    className="w-full text-xs p-3 bg-[#F4F4F6] dark:bg-[#1E1E24] border border-[#EAEAEB] dark:border-[#2C2C32] text-[#111113] dark:text-white placeholder-[#8E8E93] dark:placeholder-[#66666E] rounded-xl focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#111113] dark:text-neutral-200 block mb-1">
                    Kategori:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setPrayerCategory(cat)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition cursor-pointer active:scale-95 ${
                          prayerCategory === cat
                            ? 'bg-[#111113] dark:bg-white text-white dark:text-black border-[#111113] dark:border-white font-bold'
                            : 'bg-[#F4F4F6] dark:bg-[#202026] text-[#71717A] dark:text-[#A1A1AA] border-[#EAEAEB] dark:border-[#2C2C32] hover:bg-[#EAEAEB] dark:hover:bg-[#282830]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewPrayerOpen(false)}
                    className="flex-1 py-2 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] bg-[#F4F4F6] dark:bg-[#202026] hover:bg-[#EAEAEB] dark:hover:bg-[#282830] rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold text-white dark:text-black bg-[#111113] dark:bg-white hover:bg-black dark:hover:bg-neutral-200 rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                  >
                    Save Prayer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

        <Navigation />
      </div>
    </div>
  );
}
