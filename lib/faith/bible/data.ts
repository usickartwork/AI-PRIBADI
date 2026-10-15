export interface BibleBook {
  id: string;
  name: string;
  abbreviation: string;
  chapters: number;
  testament: 'PL' | 'PB'; // Perjanjian Lama vs Perjanjian Baru
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  title?: string;
}

export interface TodayVerse {
  reference: string;
  book: string;
  chapter: number;
  verse: string;
  text: string;
  theme: string;
  reflectionQuestion: string;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Perjanjian Lama
  { id: 'kej', name: 'Kejadian', abbreviation: 'Kej', chapters: 50, testament: 'PL' },
  { id: 'kel', name: 'Keluaran', abbreviation: 'Kel', chapters: 40, testament: 'PL' },
  { id: 'im', name: 'Imamat', abbreviation: 'Im', chapters: 27, testament: 'PL' },
  { id: 'bil', name: 'Bilangan', abbreviation: 'Bil', chapters: 36, testament: 'PL' },
  { id: 'ul', name: 'Ulangan', abbreviation: 'Ul', chapters: 34, testament: 'PL' },
  { id: 'yos', name: 'Yosua', abbreviation: 'Yos', chapters: 24, testament: 'PL' },
  { id: 'hak', name: 'Hakim-hakim', abbreviation: 'Hak', chapters: 21, testament: 'PL' },
  { id: 'rut', name: 'Rut', abbreviation: 'Rut', chapters: 4, testament: 'PL' },
  { id: '1sam', name: '1 Samuel', abbreviation: '1Sam', chapters: 31, testament: 'PL' },
  { id: '2sam', name: '2 Samuel', abbreviation: '2Sam', chapters: 24, testament: 'PL' },
  { id: '1raj', name: '1 Raja-raja', abbreviation: '1Raj', chapters: 22, testament: 'PL' },
  { id: '2raj', name: '2 Raja-raja', abbreviation: '2Raj', chapters: 25, testament: 'PL' },
  { id: '1taw', name: '1 Tawarikh', abbreviation: '1Taw', chapters: 29, testament: 'PL' },
  { id: '2taw', name: '2 Tawarikh', abbreviation: '2Taw', chapters: 36, testament: 'PL' },
  { id: 'ezr', name: 'Ezra', abbreviation: 'Ezr', chapters: 10, testament: 'PL' },
  { id: 'neh', name: 'Nehemia', abbreviation: 'Neh', chapters: 13, testament: 'PL' },
  { id: 'est', name: 'Ester', abbreviation: 'Est', chapters: 10, testament: 'PL' },
  { id: 'ayb', name: 'Ayub', abbreviation: 'Ayb', chapters: 42, testament: 'PL' },
  { id: 'mzm', name: 'Mazmur', abbreviation: 'Mzm', chapters: 150, testament: 'PL' },
  { id: 'ams', name: 'Amsal', abbreviation: 'Ams', chapters: 31, testament: 'PL' },
  { id: 'pkh', name: 'Pengkhotbah', abbreviation: 'Pkh', chapters: 12, testament: 'PL' },
  { id: 'kid', name: 'Kidung Agung', abbreviation: 'Kid', chapters: 8, testament: 'PL' },
  { id: 'yes', name: 'Yesaya', abbreviation: 'Yes', chapters: 66, testament: 'PL' },
  { id: 'yer', name: 'Yeremia', abbreviation: 'Yer', chapters: 52, testament: 'PL' },
  { id: 'rat', name: 'Ratapan', abbreviation: 'Rat', chapters: 5, testament: 'PL' },
  { id: 'yeh', name: 'Yehezkiel', abbreviation: 'Yeh', chapters: 48, testament: 'PL' },
  { id: 'dan', name: 'Daniel', abbreviation: 'Dan', chapters: 12, testament: 'PL' },
  { id: 'hos', name: 'Hosea', abbreviation: 'Hos', chapters: 14, testament: 'PL' },
  { id: 'yol', name: 'Yoel', abbreviation: 'Yol', chapters: 3, testament: 'PL' },
  { id: 'am', name: 'Amos', abbreviation: 'Am', chapters: 9, testament: 'PL' },
  { id: 'ob', name: 'Obaja', abbreviation: 'Ob', chapters: 1, testament: 'PL' },
  { id: 'yun', name: 'Yunus', abbreviation: 'Yun', chapters: 4, testament: 'PL' },
  { id: 'mik', name: 'Mikha', abbreviation: 'Mik', chapters: 7, testament: 'PL' },
  { id: 'nah', name: 'Nahum', abbreviation: 'Nah', chapters: 3, testament: 'PL' },
  { id: 'hab', name: 'Habakuk', abbreviation: 'Hab', chapters: 3, testament: 'PL' },
  { id: 'zef', name: 'Zefanya', abbreviation: 'Zef', chapters: 3, testament: 'PL' },
  { id: 'hag', name: 'Hagai', abbreviation: 'Hag', chapters: 2, testament: 'PL' },
  { id: 'zak', name: 'Zakharia', abbreviation: 'Zak', chapters: 14, testament: 'PL' },
  { id: 'mal', name: 'Maleakhi', abbreviation: 'Mal', chapters: 4, testament: 'PL' },

  // Perjanjian Baru
  { id: 'mat', name: 'Matius', abbreviation: 'Mat', chapters: 28, testament: 'PB' },
  { id: 'mrk', name: 'Markus', abbreviation: 'Mrk', chapters: 16, testament: 'PB' },
  { id: 'luk', name: 'Lukas', abbreviation: 'Luk', chapters: 24, testament: 'PB' },
  { id: 'yoh', name: 'Yohanes', abbreviation: 'Yoh', chapters: 21, testament: 'PB' },
  { id: 'kis', name: 'Kisah Para Rasul', abbreviation: 'Kis', chapters: 28, testament: 'PB' },
  { id: 'rom', name: 'Roma', abbreviation: 'Rom', chapters: 16, testament: 'PB' },
  { id: '1kor', name: '1 Korintus', abbreviation: '1Kor', chapters: 16, testament: 'PB' },
  { id: '2kor', name: '2 Korintus', abbreviation: '2Kor', chapters: 13, testament: 'PB' },
  { id: 'gal', name: 'Galatia', abbreviation: 'Gal', chapters: 6, testament: 'PB' },
  { id: 'ef', name: 'Efesus', abbreviation: 'Ef', chapters: 6, testament: 'PB' },
  { id: 'flp', name: 'Filipi', abbreviation: 'Flp', chapters: 4, testament: 'PB' },
  { id: 'kol', name: 'Kolose', abbreviation: 'Kol', chapters: 4, testament: 'PB' },
  { id: '1tes', name: '1 Tesalonika', abbreviation: '1Tes', chapters: 5, testament: 'PB' },
  { id: '2tes', name: '2 Tesalonika', abbreviation: '2Tes', chapters: 3, testament: 'PB' },
  { id: '1tim', name: '1 Timotius', abbreviation: '1Tim', chapters: 6, testament: 'PB' },
  { id: '2tim', name: '2 Timotius', abbreviation: '2Tim', chapters: 4, testament: 'PB' },
  { id: 'tit', name: 'Titus', abbreviation: 'Tit', chapters: 3, testament: 'PB' },
  { id: 'flm', name: 'Filemon', abbreviation: 'Flm', chapters: 1, testament: 'PB' },
  { id: 'ibr', name: 'Ibrani', abbreviation: 'Ibr', chapters: 13, testament: 'PB' },
  { id: 'yak', name: 'Yakobus', abbreviation: 'Yak', chapters: 5, testament: 'PB' },
  { id: '1ptr', name: '1 Petrus', abbreviation: '1Ptr', chapters: 5, testament: 'PB' },
  { id: '2ptr', name: '2 Petrus', abbreviation: '2Ptr', chapters: 3, testament: 'PB' },
  { id: '1yoh', name: '1 Yohanes', abbreviation: '1Yoh', chapters: 5, testament: 'PB' },
  { id: '2yoh', name: '2 Yohanes', abbreviation: '2Yoh', chapters: 1, testament: 'PB' },
  { id: '3yoh', name: '3 Yohanes', abbreviation: '3Yoh', chapters: 1, testament: 'PB' },
  { id: 'yud', name: 'Yudas', abbreviation: 'Yud', chapters: 1, testament: 'PB' },
  { id: 'wah', name: 'Wahyu', abbreviation: 'Wah', chapters: 22, testament: 'PB' },
];

export const BIBLE_BOOK_CODES: Record<string, string> = {
  kejadian: 'Kej', kej: 'Kej',
  keluaran: 'Kel', kel: 'Kel',
  imamat: 'Ima', im: 'Ima', ima: 'Ima',
  bilangan: 'Bil', bil: 'Bil',
  ulangan: 'Ula', ul: 'Ula', ula: 'Ula',
  yosua: 'Yos', yos: 'Yos',
  'hakim-hakim': 'Hak', 'hakimhakim': 'Hak', hak: 'Hak',
  rut: 'Rut',
  '1 samuel': '1Sa', '1samuel': '1Sa', '1sam': '1Sa', '1sa': '1Sa',
  '2 samuel': '2Sa', '2samuel': '2Sa', '2sam': '2Sa', '2sa': '2Sa',
  '1 raja-raja': '1Ra', '1rajaraja': '1Ra', '1raj': '1Ra', '1ra': '1Ra',
  '2 raja-raja': '2Ra', '2rajaraja': '2Ra', '2raj': '2Ra', '2ra': '2Ra',
  '1 tawarikh': '1Ta', '1tawarikh': '1Ta', '1taw': '1Ta', '1ta': '1Ta',
  '2 tawarikh': '2Ta', '2tawarikh': '2Ta', '2taw': '2Ta', '2ta': '2Ta',
  ezra: 'Ezr', ezr: 'Ezr',
  nehemia: 'Neh', neh: 'Neh',
  ester: 'Est', est: 'Est',
  ayub: 'Ayb', ayb: 'Ayb',
  mazmur: 'Mzm', mzm: 'Mzm',
  amsal: 'Ams', ams: 'Ams',
  pengkhotbah: 'Pkh', pkh: 'Pkh',
  'kidung agung': 'Kid', 'kidungagung': 'Kid', kid: 'Kid',
  yesaya: 'Yes', yes: 'Yes',
  yeremia: 'Yer', yer: 'Yer',
  ratapan: 'Rat', rat: 'Rat',
  yehezkiel: 'Yeh', yeh: 'Yeh',
  daniel: 'Dan', dan: 'Dan',
  hosea: 'Hos', hos: 'Hos',
  yoel: 'Yoe', yoe: 'Yoe', yol: 'Yoe',
  amos: 'Amo', amo: 'Amo', am: 'Amo',
  obaja: 'Oba', oba: 'Oba', ob: 'Oba',
  yunus: 'Yun', yun: 'Yun',
  mikha: 'Mik', mik: 'Mik',
  nahum: 'Nah', nah: 'Nah',
  habakuk: 'Hab', hab: 'Hab',
  zefanya: 'Zef', zef: 'Zef',
  hagai: 'Hag', hag: 'Hag',
  zakharia: 'Zak', zak: 'Zak',
  maleakhi: 'Mal', mal: 'Mal',
  matius: 'Mat', mat: 'Mat',
  markus: 'Mrk', mrk: 'Mrk',
  lukas: 'Luk', luk: 'Luk',
  yohanes: 'Yoh', yoh: 'Yoh',
  'kisah para rasul': 'Kis', 'kisahpararasul': 'Kis', kis: 'Kis',
  roma: 'Rom', rom: 'Rom',
  '1 korintus': '1Ko', '1korintus': '1Ko', '1kor': '1Ko', '1ko': '1Ko',
  '2 korintus': '2Ko', '2korintus': '2Ko', '2kor': '2Ko', '2ko': '2Ko',
  galatia: 'Gal', gal: 'Gal',
  efesus: 'Efe', ef: 'Efe', efe: 'Efe',
  filipi: 'Flp', flp: 'Flp',
  kolose: 'Kol', kol: 'Kol',
  '1 tesalonika': '1Te', '1tesalonika': '1Te', '1tes': '1Te', '1te': '1Te',
  '2 tesalonika': '2Te', '2tesalonika': '2Te', '2tes': '2Te', '2te': '2Te',
  '1 timotius': '1Ti', '1timotius': '1Ti', '1tim': '1Ti', '1ti': '1Ti',
  '2 timotius': '2Ti', '2timotius': '2Ti', '2tim': '2Ti', '2ti': '2Ti',
  titus: 'Tit', tit: 'Tit',
  filemon: 'Flm', flm: 'Flm',
  ibrani: 'Ibr', ibr: 'Ibr',
  yakobus: 'Yak', yak: 'Yak',
  '1 petrus': '1Pt', '1petrus': '1Pt', '1ptr': '1Pt', '1pt': '1Pt',
  '2 petrus': '2Pt', '2petrus': '2Pt', '2ptr': '2Pt', '2pt': '2Pt',
  '1 yohanes': '1Yo', '1yohanes': '1Yo', '1yoh': '1Yo', '1yo': '1Yo',
  '2 yohanes': '2Yo', '2yohanes': '2Yo', '2yoh': '2Yo', '2yo': '2Yo',
  '3 yohanes': '3Yo', '3yohanes': '3Yo', '3yoh': '3Yo', '3yo': '3Yo',
  yudas: 'Yud', yud: 'Yud',
  wahyu: 'Why', wah: 'Why', why: 'Why'
};

export function getBibleBookCode(identifier: string): string {
  const clean = identifier.trim().toLowerCase();
  return (
    BIBLE_BOOK_CODES[clean] ||
    BIBLE_BOOK_CODES[clean.replace(/\s+/g, '')] ||
    BIBLE_BOOK_CODES[clean.replace(/-/g, ' ')] ||
    BIBLE_BOOK_CODES[clean.replace(/-/g, '')] ||
    identifier.trim()
  );
}


export const FEATURED_VERSES: TodayVerse[] = [
  {
    reference: 'Roma 8:28',
    book: 'Roma',
    chapter: 8,
    verse: '28',
    text: 'Kita tahu sekarang, bahwa Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia, yaitu bagi mereka yang terpanggil sesuai dengan rencana Allah.',
    theme: 'Penyertaan & Rencana Allah',
    reflectionQuestion: 'Adakah situasi yang saat ini terasa berat, namun kamu rindu melihat bagaimana Allah tetap berdaulat mengubahkan untuk kebaikanmu?',
  },
  {
    reference: 'Amsal 3:5–6',
    book: 'Amsal',
    chapter: 3,
    verse: '5-6',
    text: 'Percayalah kepada TUHAN dengan segenap hatimu, dan janganlah bersandar kepada pengertianmu sendiri. Akuilah Dia dalam segala lakumu, maka Ia akan meluruskan jalanmu.',
    theme: 'Kepercayaan Penuh',
    reflectionQuestion: 'Apa area hidupmu yang paling sering kamu coba kendalikan sendiri daripada mempercayakannya dalam doa?',
  },
  {
    reference: 'Filipi 4:6–7',
    book: 'Filipi',
    chapter: 4,
    verse: '6-7',
    text: 'Janganlah hendaknya kamu kuatir tentang apa pun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur. Damai sejahtera Allah, yang melampaui segala akal, akan memelihara hati dan pikiranmu dalam Kristus Yesus.',
    theme: 'Kelegaan & Damai Sejahtera',
    reflectionQuestion: 'Kekhawatiran apa yang ingin kamu serahkan secara sadar kepada Tuhan hari ini?',
  },
  {
    reference: 'Yeremia 29:11',
    book: 'Yeremia',
    chapter: 29,
    verse: '11',
    text: 'Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan.',
    theme: 'Pengharapan Masa Depan',
    reflectionQuestion: 'Bagaimana firman ini menguatkan caramu memandang masa depan minggu ini?',
  },
  {
    reference: 'Matius 6:33–34',
    book: 'Matius',
    chapter: 6,
    verse: '33-34',
    text: 'Tetapi carilah dahulu Kerajaan Allah dan kebenarannya, maka semuanya itu akan ditambahkan kepadamu. Sebab itu janganlah kamu kuatir akan hari besok, karena hari besok mempunyai kesusahannya sendiri.',
    theme: 'Prioritas Hati',
    reflectionQuestion: 'Apa satu langkah praktis hari ini untuk mendahulukan kehendak Tuhan di atas kesibukanmu?',
  },
  {
    reference: 'Mazmur 23:1–3',
    book: 'Mazmur',
    chapter: 23,
    verse: '1-3',
    text: 'TUHAN adalah gembalaku, takkan kekurangan aku. Ia membaringkan aku di padang yang berumput hijau, Ia membimbing aku ke air yang tenang; Ia menyegarkan jiwaku.',
    theme: 'Gembala yang Baik',
    reflectionQuestion: 'Kapan terakhir kali kamu benar-benar beristirahat dan membiarkan Tuhan menyegarkan jiwamu?',
  },
  {
    reference: 'Yohanes 14:27',
    book: 'Yohanes',
    chapter: 14,
    verse: '27',
    text: 'Damai sejahtera Kutinggalkan bagimu. Damai sejahtera-Ku Kuberikan kepadamu, dan apa yang Kuberikan tidak seperti yang diberikan oleh dunia kepadamu. Janganlah gelisah dan gentar hatimu.',
    theme: 'Damai Kristus',
    reflectionQuestion: 'Apa perbedaan damai yang Tuhan tawarkan dengan kenyamanan sementara yang ditawarkan dunia?',
  },
];

// Complete full verses for default chapter (Roma 8) for instantaneous 0ms display
export const ROMA_8_FULL_VERSES: BibleVerse[] = [
  { book: 'Roma', chapter: 8, verse: 1, text: 'Demikianlah sekarang tidak ada penghukuman bagi mereka yang ada di dalam Kristus Yesus.', title: 'Hidup oleh Roh' },
  { book: 'Roma', chapter: 8, verse: 2, text: 'Roh, yang memberi hidup telah memerdekakan kamu dalam Kristus dari hukum dosa dan hukum maut.' },
  { book: 'Roma', chapter: 8, verse: 3, text: 'Sebab apa yang tidak mungkin dilakukan hukum Taurat karena tak berdaya oleh daging, telah dilakukan oleh Allah. Dengan jalan mengutus Anak-Nya sendiri dalam daging, yang serupa dengan daging yang dikuasai dosa karena dosa, Ia telah menjatuhkan hukuman atas dosa di dalam daging,' },
  { book: 'Roma', chapter: 8, verse: 4, text: 'supaya tuntutan hukum Taurat digenapi di dalam kita, yang tidak hidup menurut daging, tetapi menurut Roh.' },
  { book: 'Roma', chapter: 8, verse: 5, text: 'Sebab mereka yang hidup menurut daging, memikirkan hal-hal yang dari daging; mereka yang hidup menurut Roh, memikirkan hal-hal yang dari Roh.' },
  { book: 'Roma', chapter: 8, verse: 6, text: 'Karena keinginan daging adalah maut, tetapi keinginan Roh adalah hidup dan damai sejahtera.' },
  { book: 'Roma', chapter: 8, verse: 7, text: 'Sebab keinginan daging adalah perseteruan terhadap Allah, karena ia tidak takluk kepada hukum Allah; hal ini memang tidak mungkin baginya.' },
  { book: 'Roma', chapter: 8, verse: 8, text: 'Mereka yang hidup dalam daging, tidak mungkin berkenan kepada Allah.' },
  { book: 'Roma', chapter: 8, verse: 9, text: 'Tetapi kamu tidak hidup dalam daging, melainkan dalam Roh, jika memang Roh Allah diam di dalam kamu. Tetapi jika orang tidak memiliki Roh Kristus, ia bukan milik Kristus.' },
  { book: 'Roma', chapter: 8, verse: 10, text: 'Tetapi jika Kristus ada di dalam kamu, maka tubuh memang mati karena dosa, tetapi roh adalah kehidupan oleh karena kebenaran.' },
  { book: 'Roma', chapter: 8, verse: 11, text: 'Dan jika Roh Dia, yang telah membangkitkan Yesus dari antara orang mati, diam di dalam kamu, maka Ia, yang telah membangkitkan Kristus Yesus dari antara orang mati, akan menghidupkan juga tubuhmu yang fana itu oleh Roh-Nya, yang diam di dalam kamu.' },
  { book: 'Roma', chapter: 8, verse: 12, text: 'Jadi, saudara-saudara, kita adalah orang berhutang, tetapi bukan kepada daging, supaya hidup menurut daging.' },
  { book: 'Roma', chapter: 8, verse: 13, text: 'Sebab, jika kamu hidup menurut daging, kamu akan mati; tetapi jika oleh Roh kamu mematikan perbuatan-perbuatan tubuhmu, kamu akan hidup.' },
  { book: 'Roma', chapter: 8, verse: 14, text: 'Semua orang, yang dipimpin Roh Allah, adalah anak Allah.' },
  { book: 'Roma', chapter: 8, verse: 15, text: 'Sebab kamu tidak menerima roh perbudakan yang membuat kamu menjadi takut lagi, tetapi kamu telah menerima Roh yang menjadikan kamu anak Allah. Oleh Roh itu kita berseru: "ya Abba, ya Bapa!"' },
  { book: 'Roma', chapter: 8, verse: 16, text: 'Roh itu bersaksi bersama-sama dengan roh kita, bahwa kita adalah anak-anak Allah.' },
  { book: 'Roma', chapter: 8, verse: 17, text: 'Dan jika kita adalah anak, maka kita juga adalah ahli waris, maksudnya orang-orang yang berhak menerima janji-janji Allah, yang akan menerimanya bersama-sama dengan Kristus, yaitu jika kita menderita bersama-sama dengan Dia, supaya kita juga dipermuliakan bersama-sama dengan Dia.' },
  { book: 'Roma', chapter: 8, verse: 18, text: 'Sebab aku yakin, bahwa penderitaan zaman sekarang ini tidak dapat dibandingkan dengan kemuliaan yang akan dinyatakan kepada kita.', title: 'Pengharapan anak-anak Allah' },
  { book: 'Roma', chapter: 8, verse: 19, text: 'Sebab dengan sangat rindu seluruh makhluk menantikan saat anak-anak Allah dinyatakan.' },
  { book: 'Roma', chapter: 8, verse: 20, text: 'Karena seluruh makhluk telah ditaklukkan kepada kesia-siaan, bukan oleh kehendaknya sendiri, tetapi oleh kehendak Dia, yang telah menaklukkannya,' },
  { book: 'Roma', chapter: 8, verse: 21, text: 'tetapi dalam pengharapan, karena makhluk itu sendiri juga akan dimerdekakan dari perbudakan kebinasaan dan masuk ke dalam kemerdekaan kemuliaan anak-anak Allah.' },
  { book: 'Roma', chapter: 8, verse: 22, text: 'Sebab kita tahu, bahwa sampai sekarang segala makhluk sama-sama mengeluh dan sama-sama merasa sakit bersalin.' },
  { book: 'Roma', chapter: 8, verse: 23, text: 'Dan bukan hanya mereka saja, tetapi kita yang telah menerima karunia sulung Roh, kita juga mengeluh dalam hati kita sambil menantikan pengangkatan sebagai anak, yaitu pembebasan tubuh kita.' },
  { book: 'Roma', chapter: 8, verse: 24, text: 'Sebab kita diselamatkan dalam pengharapan. Tetapi pengharapan yang dilihat, bukan pengharapan lagi; sebab bagaimana orang masih mengharapkan apa yang dilihatnya?' },
  { book: 'Roma', chapter: 8, verse: 25, text: 'Tetapi jika kita mengharapkan apa yang tidak kita lihat, kita menantikannya dengan tekun.' },
  { book: 'Roma', chapter: 8, verse: 26, text: 'Demikian juga Roh membantu kita dalam kelemahan kita; sebab kita tidak tahu, bagaimana sebenarnya harus berdoa; tetapi Roh sendiri berdoa untuk kita kepada Allah dengan keluhan-keluhan yang tidak terucapkan.' },
  { book: 'Roma', chapter: 8, verse: 27, text: 'Dan Allah yang menyelidiki hati nurani, mengetahui maksud Roh itu, yaitu bahwa Ia, sesuai dengan kehendak Allah, berdoa untuk orang-orang kudus.' },
  { book: 'Roma', chapter: 8, verse: 28, text: 'Kita tahu sekarang, bahwa Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia, yaitu bagi mereka yang terpanggil sesuai dengan rencana Allah.' },
  { book: 'Roma', chapter: 8, verse: 29, text: 'Sebab semua orang yang dipilih-Nya dari semula, mereka juga ditentukan-Nya dari semula untuk menjadi serupa dengan gambaran Anak-Nya, supaya Ia, Anak-Nya itu, menjadi yang sulung di antara banyak saudara.' },
  { book: 'Roma', chapter: 8, verse: 30, text: 'Dan mereka yang ditentukan-Nya dari semula, mereka itu juga dipanggil-Nya. Dan mereka yang dipanggil-Nya, mereka itu juga dibenarkan-Nya. Dan mereka yang dibenarkan-Nya, mereka itu juga dimuliakan-Nya.' },
  { book: 'Roma', chapter: 8, verse: 31, text: 'Sebab itu apakah yang akan kita katakan tentang semuanya itu? Jika Allah di pihak kita, siapakah yang akan melawan kita?', title: 'Keyakinan iman' },
  { book: 'Roma', chapter: 8, verse: 32, text: 'Ia, yang tidak menyayangkan Anak-Nya sendiri, tetapi yang menyerahkan-Nya bagi kita semua, bagaimanakah mungkin Ia tidak mengaruniakan segala sesuatu kepada kita bersama-sama dengan Dia?' },
  { book: 'Roma', chapter: 8, verse: 33, text: 'Siapakah yang akan menggugat orang-orang pilihan Allah? Allah, yang membenarkan mereka? Siapakah yang akan menghukum mereka?' },
  { book: 'Roma', chapter: 8, verse: 34, text: 'Kristus Yesus, yang telah mati? Bahkan lebih lagi: yang telah bangkit, yang juga duduk di sebelah kanan Allah, yang malah menjadi Pembela bagi kita?' },
  { book: 'Roma', chapter: 8, verse: 35, text: 'Siapakah yang akan memisahkan kita dari kasih Kristus? Penindasan atau kesesakan atau penganiayaan, atau kelaparan atau ketelanjangan, atau bahaya, atau pedang?' },
  { book: 'Roma', chapter: 8, verse: 36, text: 'Seperti ada tertulis: "Oleh karena Engkau kami ada dalam bahaya maut sepanjang hari, kami telah dianggap sebagai domba-domba sembelihan."' },
  { book: 'Roma', chapter: 8, verse: 37, text: 'Tetapi dalam semuanya itu kita lebih dari pada orang-orang yang menang, oleh Dia yang telah mengasihi kita.' },
  { book: 'Roma', chapter: 8, verse: 38, text: 'Sebab aku yakin, bahwa baik maut, maupun hidup, baik malaikat-malaikat, maupun pemerintah-pemerintah, baik yang ada sekarang, maupun yang akan datang,' },
  { book: 'Roma', chapter: 8, verse: 39, text: 'atau kuasa-kuasa, baik yang di atas, maupun yang di bawah, ataupun sesuatu makhluk lain, tidak akan dapat memisahkan kita dari kasih Allah, yang ada dalam Kristus Yesus, Tuhan kita.' },
];

// Offline chapter sample data for instant browsing
export const SAMPLE_CHAPTERS: Record<string, { bookName: string; chapter: number; verses: { num: number; text: string; title?: string }[] }> = {
  'rom-8': {
    bookName: 'Roma',
    chapter: 8,
    verses: ROMA_8_FULL_VERSES.map((v) => ({ num: v.verse, text: v.text, title: v.title })),
  },
  'mzm-23': {
    bookName: 'Mazmur',
    chapter: 23,
    verses: [
      { num: 1, text: 'TUHAN adalah gembalaku, takkan kekurangan aku.', title: 'TUHAN, gembalaku yang baik' },
      { num: 2, text: 'Ia membaringkan aku di padang yang berumput hijau, Ia membimbing aku ke air yang tenang;' },
      { num: 3, text: 'Ia menyegarkan jiwaku. Ia menuntun aku di jalan yang benar oleh karena nama-Nya.' },
      { num: 4, text: 'Sekalipun aku berjalan dalam lembah kekelaman, aku tidak takut bahaya, sebab Engkau besertaku; gada-Mu dan tongkat-Mu, itulah yang menghibur aku.' },
      { num: 5, text: 'Engkau menyediakan hidangan bagiku, di hadapan lawanku; Engkau mengurapi kepalaku dengan minyak; pialaku penuh melimpah.' },
      { num: 6, text: 'Kebajikan dan kemurahan belaka akan mengikuti aku, seumur hidupku; dan aku akan diam dalam rumah TUHAN sepanjang masa.' },
    ],
  },
};
