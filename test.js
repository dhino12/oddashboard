// Daftar bifastList (paste full list kamu di sini)
const bifastList = [
  { id_bank: "BTANIDJA", nama_bank: "Bank Tabungan Negara", abbreviation: "BTN", kode: 901 },
  { id_bank: "BBBAIDJA", nama_bank: "Bank Permata", abbreviation: "Permata", kode: 347 },
  // ... semua entri lain ...
  { id_bank: "PDJTIDJ1", nama_bank: "BPD Jatim", abbreviation: "Jatim", kode: 120 },
  { id_bank: "BRINIDJA", nama_bank: "Bank Rakyat Indonesia", abbreviation: "BRI", kode: 133 },
  { id_bank: "DANAIDJ1", nama_bank: "DANA", abbreviation: "DANA", kode: 873 },
  // dst...
];

// Buat lookup cepat (case-insensitive + variasi umum di chat OCR)
const entityLookup = new Map();
bifastList.forEach(bank => {
  const abbr = bank.abbreviation.toLowerCase();
  const name = bank.nama_bank.toLowerCase();
  entityLookup.set(abbr, bank.abbreviation);
  entityLookup.set(name, bank.abbreviation);
  entityLookup.set(`bpd ${abbr}`, bank.abbreviation);
  entityLookup.set(`bank ${abbr}`, bank.abbreviation);
  entityLookup.set(`@${abbr}`, bank.abbreviation);
  entityLookup.set(`@${name.replace('bank ', '')}`, bank.abbreviation);
  // variasi lain yang sering muncul
  entityLookup.set('dana', 'DANA');
  entityLookup.set('@dana', 'DANA');
  entityLookup.set('dana - 3', 'DANA');
});

// Fungsi normalisasi entity
function normalizeBank(text) {
  const lower = text.toLowerCase().trim().replace(/[,.;]$/, '');
  return entityLookup.get(lower) || null;
}

function detectGangguan(text) {
  const lowerText = text.toLowerCase();
  const gangguanKeywords = ['kendala', 'gangguan', 'u173', 'rc u173', 'kenaikan response', 'terpantau', 'gagal login', 'mohon dicek'];

  // Cek apakah ada indikasi gangguan
  if (!gangguanKeywords.some(kw => lowerText.includes(kw))) {
    return { complainerEntity: null, reportedBank: null, message: null };
  }

  let complainer = null;
  let reported = null;

  // 1. Ambil bagian awal pesan (baris 1-2, biasanya sender/tag)
  const lines = text.split('\n');
  const awalPart = (lines[0] + ' ' + (lines[1] || '')).trim();
  const awalLower = awalPart.toLowerCase();

  // Cari complainer di awal (prioritas tag @... atau "Kami dari" atau nama bank langsung)
  const awalWords = awalPart.split(/\s+/);
  for (let i = awalWords.length - 1; i >= 0; i--) {  // mulai dari belakang tag
    const word = awalWords[i];
    const norm = normalizeBank(word);
    if (norm) {
      complainer = norm;
      break;
    }
    // Coba gabung 2 kata (misal "BPD Jatim")
    if (i > 0) {
      const twoWords = (awalWords[i-1] + ' ' + word).toLowerCase();
      const normTwo = normalizeBank(twoWords);
      if (normTwo) {
        complainer = normTwo;
        break;
      }
    }
  }

  // Khusus handling DANA di tag support
  if (!complainer && (awalLower.includes('@dana') || awalLower.includes('dana - 3') || awalLower.includes('technical support dana'))) {
    complainer = 'DANA';
  }

  // 2. Cari reported setelah indikator
  const indicators = [
    { kw: 'dari ', startOffset: 5 },
    { kw: 'ke arah ', startOffset: 8 },
    { kw: 'u173 dari ', startOffset: 10 },
    { kw: 'rc u173 ke ', startOffset: 11 },
    { kw: 'u173 ke ', startOffset: 8 },
  ];

  let earliestReportedPos = Infinity;
  indicators.forEach(ind => {
    const pos = lowerText.indexOf(ind.kw);
    if (pos !== -1 && pos < earliestReportedPos) {
      earliestReportedPos = pos + ind.startOffset;
    }
  });

  if (earliestReportedPos < Infinity) {
    const afterText = text.slice(earliestReportedPos);
    const afterLower = afterText.toLowerCase();

    // Cari kata pertama yang match bank setelah indikator
    const afterWords = afterText.split(/\s+/).slice(0, 8); // ambil 8 kata pertama
    for (let i = 0; i < afterWords.length; i++) {
      const word = afterWords[i];
      const norm = normalizeBank(word);
      if (norm && norm !== complainer) {
        reported = norm;
        break;
      }
      // Coba 2 kata
      if (i + 1 < afterWords.length) {
        const two = (afterWords[i] + ' ' + afterWords[i+1]).toLowerCase();
        const normTwo = normalizeBank(two);
        if (normTwo && normTwo !== complainer) {
          reported = normTwo;
          break;
        }
      }
    }
  }

  // Fallback reported jika tidak ketemu proximity
  if (!reported) {
    const dariMatch = lowerText.match(/dari\s+([a-z\s]{3,30})/i);
    if (dariMatch && dariMatch[1]) {
      const candidate = dariMatch[1].trim().toLowerCase();
      const norm = normalizeBank(candidate);
      if (norm && norm !== complainer) reported = norm;
    }
  }

  // Jika reported dan complainer sama, prioritaskan awal sebagai complainer
  if (complainer && reported && complainer === reported) {
    reported = null;
  }

  return {
    complainerEntity: complainer || 'Tidak terdeteksi',
    reportedBank: reported || 'Tidak terdeteksi',
    message: text.trim()
  };
}

// Tes
const case1 = `Rekan @Technical Support DANA - 3 @Dana
Technical terpantau ada kenaikan response
U173 dari BRI, apakah sedang ada kendala? Terimakasih`;

const case2 = `Rekan @bank BPD Jatim, dari BRI ada kenaikan rc u173 ke arah Bank Jatim, 
apakah ada kendala`;

console.log(detectGangguan(case1));
// Harusnya: { complainerEntity: 'DANA', reportedBank: 'BRI', message: ... }

console.log(detectGangguan(case2));
// Harusnya: { complainerEntity: 'Jatim', reportedBank: 'BRI', message: ... }