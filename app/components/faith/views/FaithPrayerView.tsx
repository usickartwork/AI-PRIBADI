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
    setUser(currentUser);
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
    <div className="h-full max-h-full w-full bg-transparent flex flex-col items-center justify-center sm:p-2 sm:pb-3 overflow-hidden">
      <div className="w-full max-w-4xl h-full bg-white dark:bg-[#121214] rounded-none sm:rounded-[32px] sm:border border-[#EAEAEB] dark:border-white/10 sm:shadow-lg flex flex-col overflow-hidden relative">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-slate-200/70 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('prayer')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'prayer'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Doa Pribadi</span>
          </button>
          <button
            onClick={() => setActiveTab('gratitude')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'gratitude'
                ? 'bg-white text-rose-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
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
                <h2 className="text-base font-bold text-slate-900">Jurnal Doa Pribadi</h2>
                <p className="text-xs text-slate-500">
                  {prayers.filter((p) => p.status === 'praying').length} pokok doa aktif
                </p>
              </div>
              <button
                onClick={() => setIsNewPrayerOpen(true)}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition"
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
                  className={`px-3 py-1 rounded-full text-xs transition ${
                    statusFilter === item.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Prayer List */}
            <div className="space-y-2.5">
              {filteredPrayers.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-400">Belum ada doa di kategori ini.</p>
                </div>
              ) : (
                filteredPrayers.map((prayer) => (
                  <div
                    key={prayer.id}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800 leading-snug">
                        {prayer.content}
                      </p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                        {prayer.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      {/* Status Selector */}
                      <div className="flex gap-1 text-[11px]">
                        <button
                          onClick={() => handleUpdatePrayerStatus(prayer.id, 'praying')}
                          className={`px-2 py-0.5 rounded-md transition font-medium ${
                            prayer.status === 'praying'
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          🙏 Praying
                        </button>
                        <button
                          onClick={() => handleUpdatePrayerStatus(prayer.id, 'waiting')}
                          className={`px-2 py-0.5 rounded-md transition font-medium ${
                            prayer.status === 'waiting'
                              ? 'bg-blue-100 text-blue-800 font-bold'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          ⏳ Waiting
                        </button>
                        <button
                          onClick={() => handleUpdatePrayerStatus(prayer.id, 'answered')}
                          className={`px-2 py-0.5 rounded-md transition font-medium ${
                            prayer.status === 'answered'
                              ? 'bg-emerald-100 text-emerald-800 font-bold'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          ✅ Answered
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400">
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
              className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold uppercase tracking-wider">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>What are you thankful for today?</span>
              </div>

              <textarea
                rows={2}
                value={gratitudeContent}
                onChange={(e) => setGratitudeContent(e.target.value)}
                placeholder="Tuliskan hal kecil atau besar yang kamu syukuri hari ini..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
              />

              <div className="flex items-center justify-between pt-1">
                <select
                  value={gratitudeCategory}
                  onChange={(e) => setGratitudeCategory(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 focus:outline-none"
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
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-xs transition"
                >
                  Save Gratitude
                </button>
              </div>
            </form>

            {/* Gratitude History */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Riwayat Ucapan Syukur
              </span>

              {gratitudes.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-start gap-3"
                >
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-500 flex-shrink-0 mt-0.5">
                    <Heart className="w-3.5 h-3.5 fill-rose-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.2 rounded-full">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 mt-1 font-medium">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: New Personal Prayer */}
        {isNewPrayerOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">Buat Pokok Doa Pribadi</h3>
                <button
                  onClick={() => setIsNewPrayerOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePrayer} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    What would you like to pray for?
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={prayerContent}
                    onChange={(e) => setPrayerContent(e.target.value)}
                    placeholder="Tuliskan pokok doamu di sini..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kategori:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setPrayerCategory(cat)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition ${
                          prayerCategory === cat
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
                    className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
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
