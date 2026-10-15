import { QuizQuestion } from './types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'Perjanjian Lama',
    question: 'Siapakah yang diperintahkan Allah untuk membangun bahtera besar guna menyelamatkan keluarganya dari air bah?',
    options: ['Musa', 'Nuh', 'Abraham', 'Daud'],
    correctIndex: 1,
    explanation: 'Allah memerintahkan Nuh membuat bahtera dari kayu gofir karena kejahatan manusia di bumi saat itu.',
    verseRef: 'Kejadian 6:14',
  },
  {
    id: 'q2',
    category: 'Perjanjian Lama',
    question: 'Pemuda penggembala manakah yang mengalahkan raksasa Goliat hanya dengan umban dan sebuah batu?',
    options: ['Salomo', 'Samson', 'Daud', 'Saul'],
    correctIndex: 2,
    explanation: 'Daud datang dalam nama TUHAN semesta alam dan merobohkan Goliat dengan sebutir batu licin.',
    verseRef: '1 Samuel 17:49',
  },
  {
    id: 'q3',
    category: 'Injil & Yesus',
    question: 'Di kota manakah Tuhan Yesus dilahirkan sesuai nubuatan para nabi?',
    options: ['Nazaret', 'Yerusalem', 'Betlehem', 'Yerikho'],
    correctIndex: 2,
    explanation: 'Yesus lahir di Betlehem di tanah Yudea pada zaman raja Herodes.',
    verseRef: 'Matius 2:1',
  },
  {
    id: 'q4',
    category: 'Injil & Yesus',
    question: 'Mujizat apakah yang pertama kali dilakukan oleh Tuhan Yesus dalam pelayanan-Nya?',
    options: [
      'Mengubah air menjadi anggur di Kana',
      'Meredakan angin ribut di danau',
      'Membangkitkan Lazarus',
      'Memberi makan 5000 orang',
    ],
    correctIndex: 0,
    explanation: 'Mujizat pertama Yesus terjadi di sebuah pesta pernikahan di kota Kana, Galilea.',
    verseRef: 'Yohanes 2:11',
  },
  {
    id: 'q5',
    category: 'Perjanjian Lama',
    question: 'Berapa hari dan malam Allah menurunkan hujan lebat saat peristiwa air bah zaman Nuh?',
    options: ['7 hari 7 malam', '40 hari 40 malam', '100 hari 100 malam', '12 hari 12 malam'],
    correctIndex: 1,
    explanation: 'Hujan lebat melanda bumi selama empat puluh hari dan empat puluh malam.',
    verseRef: 'Kejadian 7:12',
  },
  {
    id: 'q6',
    category: 'Para Rasul',
    question: 'Rasul manakah yang sebelumnya dikenal dengan nama Saulus dan menganiaya jemaat sebelum bertobat di jalan menuju Damsyik?',
    options: ['Petrus', 'Paulus', 'Barnabas', 'Stefanus'],
    correctIndex: 1,
    explanation: 'Saulus mengalami perjumpaan adikodrati dengan Kristus dalam perjalanan ke Damsyik dan kemudian dikenal sebagai Rasul Paulus.',
    verseRef: 'Kisah Para Rasul 9:3-6',
  },
  {
    id: 'q7',
    category: 'Perjanjian Lama',
    question: 'Siapakah tokoh Alkitab yang ditelan oleh seekor ikan besar setelah melarikan diri dari panggilan Tuhan ke Niniwe?',
    options: ['Elia', 'Yeremia', 'Yunus', 'Yesaya'],
    correctIndex: 2,
    explanation: 'Yunus mencoba melarikan diri ke Tarsis, namun Tuhan mendatangkan badai dan ikan besar menelannya selama tiga hari tiga malam.',
    verseRef: 'Yunus 1:17',
  },
  {
    id: 'q8',
    category: 'Injil & Yesus',
    question: 'Siapakah nama murid yang menyangkal Yesus sebanyak tiga kali sebelum ayam berkokok?',
    options: ['Yudas Iskariot', 'Yohanes', 'Simon Petrus', 'Tomas'],
    correctIndex: 2,
    explanation: 'Petrus menyangkal mengenal Yesus tiga kali di halaman imam besar sebelum ayam berkokok, sesuai perkataan Yesus.',
    verseRef: 'Lukas 22:60-61',
  },
  {
    id: 'q9',
    category: 'Hikmat & Mazmur',
    question: 'Menurut Amsal 1:7, apakah yang menjadi permulaan dari segala pengetahuan?',
    options: [
      'Banyak membaca buku',
      'Takut akan TUHAN',
      'Mendengarkan nasihat orang kaya',
      'Kecerdasan akal budi',
    ],
    correctIndex: 1,
    explanation: 'Takut akan TUHAN adalah permulaan pengetahuan, tetapi orang bodoh menghina hikmat dan didikan.',
    verseRef: 'Amsal 1:7',
  },
  {
    id: 'q10',
    category: 'Injil & Yesus',
    question: 'Berapa banyak roti dan ikan yang digunakan Yesus untuk memberi makan lima ribu orang laki-laki?',
    options: ['5 roti dan 2 ikan', '7 roti dan 3 ikan', '3 roti dan 2 ikan', '12 roti dan 7 ikan'],
    correctIndex: 0,
    explanation: 'Seorang anak membawa lima roti jelai dan dua ikan kecil, yang kemudian diberkati dan digandakan oleh Yesus.',
    verseRef: 'Yohanes 6:9',
  },
  {
    id: 'q11',
    category: 'Perjanjian Lama',
    question: 'Laut manakah yang terbelah dua oleh kuasa Tuhan ketika Musa mengulurkan tongkatnya agar bangsa Israel bisa lewat?',
    options: ['Laut Mati', 'Laut Teberau (Koleba)', 'Laut Galilea', 'Laut Tengah'],
    correctIndex: 1,
    explanation: 'Tuhan membelah Laut Teberau dengan angin timur yang keras sehingga orang Israel dapat berjalan di tanah kering.',
    verseRef: 'Keluaran 14:21',
  },
  {
    id: 'q12',
    category: 'Perjanjian Baru',
    question: 'Di pulau manakah Rasul Yohanes menerima penglihatan ilahi dan menuliskan Kitab Wahyu?',
    options: ['Kreta', 'Siprus', 'Patmos', 'Malta'],
    correctIndex: 2,
    explanation: 'Yohanes berada di pulau Patmos oleh karena firman Allah dan kesaksian tentang Yesus Kristus.',
    verseRef: 'Wahyu 1:9',
  },
  {
    id: 'q13',
    category: 'Perjanjian Lama',
    question: 'Siapakah raja Israel yang dianugerahi Tuhan hikmat luar biasa serta membangun Bait Suci megah di Yerusalem?',
    options: ['Daud', 'Salomo', 'Hizkia', 'Yosia'],
    correctIndex: 1,
    explanation: 'Raja Salomo meminta hati yang paham menimbang perkara kepada Tuhan, dan ia mendirikan Bait Allah yang megah.',
    verseRef: '1 Raja-raja 3:9-12',
  },
  {
    id: 'q14',
    category: 'Para Rasul',
    question: 'Siapakah martir Kristen pertama yang dilempari batu sampai mati sambil memohon ampun bagi para pembunuhnya?',
    options: ['Stefanus', 'Yakobus', 'Filipus', 'Timotius'],
    correctIndex: 0,
    explanation: 'Stefanus dipenuhi Roh Kudus, melihat kemuliaan Allah, dan berseru memohon agar dosa orang yang merajamnya tidak ditanggungkan.',
    verseRef: 'Kisah Para Rasul 7:59-60',
  },
  {
    id: 'q15',
    category: 'Perjanjian Lama',
    question: 'Di gunung manakah Nabi Elia menantang 450 nabi Baal dan api Tuhan turun membakar habis korban persembahan?',
    options: ['Gunung Sinai', 'Gunung Karmel', 'Gunung Nebo', 'Gunung Sion'],
    correctIndex: 1,
    explanation: 'Tantangan antara Elia dan nabi-nabi Baal diadakan di hadapan seluruh bangsa Israel di atas Gunung Karmel.',
    verseRef: '1 Raja-raja 18:19-38',
  },
  {
    id: 'q16',
    category: 'Injil & Yesus',
    question: 'Siapakah pemungut cukai bertubuh pendek yang memanjat pohon ara di Yerikho agar dapat melihat Yesus lewat?',
    options: ['Bartimeus', 'Nikodemus', 'Zakheus', 'Kornelius'],
    correctIndex: 2,
    explanation: 'Zakheus memanjat pohon ara (sikomor) karena badannya pendek dan orang banyak menghalangi pandangannya.',
    verseRef: 'Lukas 19:3-4',
  },
  {
    id: 'q17',
    category: 'Perjanjian Lama',
    question: 'Kitab apakah yang terletak paling pertama di dalam urutan Alkitab?',
    options: ['Keluaran', 'Kejadian', 'Mazmur', 'Ulangan'],
    correctIndex: 1,
    explanation: 'Kitab Kejadian (Genesis) adalah kitab pertama yang menceritakan penciptaan alam semesta dan permulaan umat manusia.',
    verseRef: 'Kejadian 1:1',
  },
  {
    id: 'q18',
    category: 'Perjanjian Baru',
    question: 'Menurut Galatia 5:22-23, manakah yang merupakan salah satu dari sembilan Buah Roh?',
    options: ['Kekayaan', 'Kasih', 'Kemasyhuran', 'Kekuasaan'],
    correctIndex: 1,
    explanation: 'Buah Roh ialah kasih, sukacita, damai sejahtera, kesabaran, kemurahan, kebaikan, kesetiaan, kelemahlembutan, dan penguasaan diri.',
    verseRef: 'Galatia 5:22-23',
  },
  {
    id: 'q19',
    category: 'Injil & Yesus',
    question: 'Siapakah sahabat Yesus yang telah meninggal empat hari di dalam kubur dan dibangkitkan kembali oleh-Nya di Betania?',
    options: ['Yairus', 'Lazarus', 'Bartimeus', 'Nikodemus'],
    correctIndex: 1,
    explanation: 'Yesus berseru dengan suara keras: "Lazarus, marilah ke luar!" dan Lazarus yang telah empat hari di kubur bangkit.',
    verseRef: 'Yohanes 11:43-44',
  },
  {
    id: 'q20',
    category: 'Perjanjian Lama',
    question: 'Siapakah nabi yang diangkat ke surga hidup-hidup dalam angin badai dengan kereta berapi dan kuda berapi?',
    options: ['Elia', 'Elisa', 'Musa', 'Henokh'],
    correctIndex: 0,
    explanation: 'Ketika Elia dan Elisa sedang berjalan, tampillah kereta berapi dengan kuda berapi dan Elia naik ke surga dalam angin badai.',
    verseRef: '2 Raja-raja 2:11',
  },
  {
    id: 'q21',
    category: 'Injil & Yesus',
    question: 'Di taman manakah Tuhan Yesus berdoa dengan sangat bersungguh-sungguh sebelum Ia ditangkap dan disalibkan?',
    options: ['Taman Eden', 'Taman Getsemani', 'Taman Golgota', 'Taman Betania'],
    correctIndex: 1,
    explanation: 'Yesus berdoa di Taman Getsemani: "Ya Bapa-Ku, jikalau cawan ini tidak dapat lalu... jadilah kehendak-Mu!"',
    verseRef: 'Matius 26:36-42',
  },
  {
    id: 'q22',
    category: 'Perjanjian Lama',
    question: 'Berapa kali bangsa Israel mengelilingi tembok kota Yerikho pada hari ketujuh sebelum tembok itu runtuh?',
    options: ['1 kali', '3 kali', '7 kali', '12 kali'],
    correctIndex: 2,
    explanation: 'Pada hari ketujuh mereka mengelilingi kota tujuh kali, para imam meniup sangkakala, rakyat bersorak, dan runtuhlah tembok itu.',
    verseRef: 'Yosua 6:15-20',
  },
  {
    id: 'q23',
    category: 'Perjanjian Baru',
    question: 'Apakah hukum yang terutama dan yang pertama yang diajarkan oleh Tuhan Yesus?',
    options: [
      'Kasihilah sesamamu manusia seperti dirimu sendiri',
      'Kasihilah Tuhan, Allahmu, dengan segenap hatimu, jiwamu, dan akal budimu',
      'Berikanlah perpuluhan setiap hari sabat',
      'Berpuasalah empat puluh hari empat puluh malam',
    ],
    correctIndex: 1,
    explanation: 'Hukum yang terutama adalah mengasihi Tuhan Allah dengan segenap hati, jiwa, dan akal budi. Hukum kedua yang sama dengan itu adalah mengasihi sesama.',
    verseRef: 'Matius 22:37-38',
  },
  {
    id: 'q24',
    category: 'Perjanjian Lama',
    question: 'Siapakah pemuda Ibrani yang selamat tanpa terluka sedikit pun saat dicampakkan ke dalam gua singa karena tetap berdoa kepada Allah?',
    options: ['Daniel', 'Sadrakh', 'Mesakh', 'Abednego'],
    correctIndex: 0,
    explanation: 'Raja Darius mendapati Daniel selamat karena Allah mengutus malaikat-Nya mengatupkan mulut singa-singa itu.',
    verseRef: 'Daniel 6:22',
  },
  {
    id: 'q25',
    category: 'Hikmat & Mazmur',
    question: 'Mazmur 23 dibuka dengan kalimat terkenal: "TUHAN adalah ... , takkan kekurangan aku."',
    options: ['Batu karangku', 'Gembalaku', 'Perisaiku', 'Benteng hidupku'],
    correctIndex: 1,
    explanation: '"TUHAN adalah gembalaku, takkan kekurangan aku. Ia membaringkan aku di padang yang berumput hijau..."',
    verseRef: 'Mazmur 23:1-2',
  },
];

/**
 * Returns a randomized set of 10 questions for a standard quiz round.
 */
export function getRandomQuizQuestions(count = 10): QuizQuestion[] {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generates a deterministic daily quiz based on date string (YYYY-MM-DD)
 */
export function getDailyQuizQuestions(dateStr: string, count = 10): QuizQuestion[] {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const pool = [...QUIZ_QUESTIONS];
  const selected: QuizQuestion[] = [];
  let currentSeed = seed;

  while (selected.length < count && pool.length > 0) {
    const idx = currentSeed % pool.length;
    selected.push(pool.splice(idx, 1)[0]);
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
  }

  return selected;
}
