export interface FaithTemporalInfo {
  dayName: string;
  dateStr: string;
  hourMin: string;
  hourMinSec: string;
  partOfDay: 'pagi' | 'siang' | 'sore' | 'malam';
  tzShort: string;
  tzLabel: string;
  promptBlock: string;
}

export function getFaithTemporalInfo(userTimeZone?: string): FaithTemporalInfo {
  const requestedTz = typeof userTimeZone === 'string' && userTimeZone.trim()
    ? userTimeZone.trim()
    : 'Asia/Jakarta';

  let validTz = requestedTz;
  try {
    new Intl.DateTimeFormat('id-ID', { timeZone: validTz }).format(new Date());
  } catch {
    validTz = 'Asia/Jakarta';
  }

  const now = new Date();

  const dayName = new Intl.DateTimeFormat('id-ID', {
    timeZone: validTz,
    weekday: 'long',
  }).format(now);

  const dateStr = new Intl.DateTimeFormat('id-ID', {
    timeZone: validTz,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: validTz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hh = timeParts.find((p) => p.type === 'hour')?.value ?? '00';
  const mm = timeParts.find((p) => p.type === 'minute')?.value ?? '00';
  const ss = timeParts.find((p) => p.type === 'second')?.value ?? '00';

  const hourNum = Number.parseInt(hh, 10);
  const partOfDay: 'pagi' | 'siang' | 'sore' | 'malam' =
    hourNum >= 4 && hourNum < 11
      ? 'pagi'
      : hourNum >= 11 && hourNum < 15
        ? 'siang'
        : hourNum >= 15 && hourNum < 19
          ? 'sore'
          : 'malam';

  let tzShort = validTz;
  let tzLabel = validTz;
  if (validTz === 'Asia/Jakarta' || validTz === 'Asia/Pontianak') {
    tzShort = 'WIB';
    tzLabel = 'WIB (Waktu Indonesia Barat, UTC+7)';
  } else if (validTz === 'Asia/Makassar' || validTz === 'Asia/Ujung_Pandang') {
    tzShort = 'WITA';
    tzLabel = 'WITA (Waktu Indonesia Tengah, UTC+8)';
  } else if (validTz === 'Asia/Jayapura') {
    tzShort = 'WIT';
    tzLabel = 'WIT (Waktu Indonesia Timur, UTC+9)';
  }

  const hourMin = `${hh}:${mm}`;
  const hourMinSec = `${hh}:${mm}:${ss}`;

  const promptBlock =
    `\n\nINFORMASI WAKTU DAN TANGGAL REAL-TIME AKTIF:\n` +
    `- Hari dan Tanggal Sekarang: ${dayName}, ${dateStr}\n` +
    `- Jam Sekarang: ${hourMin} ${tzShort} (${hourMinSec})\n` +
    `- Suasana Waktu: ${partOfDay}\n` +
    `- Zona Waktu Pengguna: ${tzLabel}\n` +
    `ATURAN WAJIB WAKTU:\n` +
    `- Kamu MEMILIKI akses langsung ke jam, hari, dan tanggal real-time di atas.\n` +
    `- DILARANG KERAS mengatakan bahwa kamu tidak memiliki akses ke waktu real-time, tidak tahu jam atau tanggal sekarang, atau menyuruh pengguna melihat jam di perangkatnya.\n` +
    `- Jika pengguna bertanya jam berapa sekarang, tanggal berapa hari ini, hari apa sekarang, besok atau kemarin tanggal berapa, atau menyapa sesuai suasana waktu (pagi, siang, sore, malam, hari Minggu), jawablah secara hangat, alami, dan akurat berdasarkan waktu real-time di atas.`;

  return {
    dayName,
    dateStr,
    hourMin,
    hourMinSec,
    partOfDay,
    tzShort,
    tzLabel,
    promptBlock,
  };
}
