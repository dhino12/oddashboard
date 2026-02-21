// Daftar bifastList (paste full list kamu di sini)
const bifastList = [
    { "id_bank": "ALOBIDJA", "nama_bank": "Allo Bank", "abbreviation": "BANK ALLO", "kode": 112 },
    { "id_bank": "AMARIDJA", "nama_bank": "Amar Bank", "abbreviation": "Amar", "kode": 457 },
    { "id_bank": "PDACIDJ1", "nama_bank": "Bank Aceh Syariah", "abbreviation": "Aceh Sy", "kode": 289 },
    { "id_bank": "ALADIDJA", "nama_bank": "Bank Aladin Syariah", "abbreviation": "Aladin Sy", "kode": 631 },
    { "id_bank": "ANZBAU3M", "nama_bank": "Bank ANZ Indonesia", "abbreviation": "ANZ", "kode": 374 },
    { "id_bank": "ARTGIDJA", "nama_bank": "Bank Artha Graha Internasional", "abbreviation": "AGI", "kode": 508 },
    { "id_bank": "PDJBIDJA", "nama_bank": "Bank BJB", "abbreviation": "BJB", "kode": 192 },
    { "id_bank": "BNPAIDJA", "nama_bank": "Bank BNP Paribas Indonesia", "abbreviation": "BNP", "kode": 746 },
    { "id_bank": "PDJYIDJ1", "nama_bank": "Bank BPD DIY", "abbreviation": "DIY", "kode": 315 },
    { "id_bank": "PDJYIDJ1", "nama_bank": "Bank BPD DIY UUS", "abbreviation": "DIY UUS", "kode": 847 },
    { "id_bank": "BUMIIDJA", "nama_bank": "Bank Bumi Arta", "abbreviation": "Bumi", "kode": 563 },
    { "id_bank": "CAPTIDJA", "nama_bank": "Bank Capital Indonesia", "abbreviation": "Capital", "kode": 229 },
    { "id_bank": "CENAIDJA", "nama_bank": "Bank Central Asia", "abbreviation": "BCA", "kode": 256 },
    { "id_bank": "BSYAIDJA", "nama_bank": "Bank Central Asia Syariah", "abbreviation": "BCA Sy", "kode": 519 },
    { "id_bank": "BNIAIDJA", "nama_bank": "Bank CIMB Niaga", "abbreviation": "CIMB", "kode": 764 },
    { "id_bank": "NISPIDJA", "nama_bank": "Bank CIMB Niaga UUS", "abbreviation": "CIMB UUS", "kode": 381 },
    { "id_bank": "CTBCIDJA", "nama_bank": "Bank CTBC Indonesia", "abbreviation": "CTBC", "kode": 672 },
    { "id_bank": "BDINIDJA", "nama_bank": "Bank Danamon Indonesia", "abbreviation": "Danamon", "kode": 582 },
    { "id_bank": "BDINIDJA", "nama_bank": "Bank Danamon UUS", "abbreviation": "DanamonUUS", "kode": 148 },
    { "id_bank": "DBSBIDJA", "nama_bank": "Bank DBS Indonesia", "abbreviation": "DBS", "kode": 937 },
    { "id_bank": "GNSHIDJA", "nama_bank": "Bank Ganesha", "abbreviation": "Ganesha", "kode": 405 },
    { "id_bank": "HIBKIDJA", "nama_bank": "Bank Hibank Indonesia", "abbreviation": "Hibank", "kode": 821 },
    { "id_bank": "HSBCIDJA", "nama_bank": "Bank HSBC Indonesia", "abbreviation": "HSBC", "kode": 693 },
    { "id_bank": "IBKKIDJA", "nama_bank": "Bank IBK Indonesia", "abbreviation": "IBK", "kode": 176 },
    { "id_bank": "ICBKIDJA", "nama_bank": "Bank ICBC Indonesia", "abbreviation": "ICBC", "kode": 542 },
    { "id_bank": "IPERIDJA", "nama_bank": "Bank Ina Perdana", "abbreviation": "Ina", "kode": 309 },
    { "id_bank": "IDXSIDJA", "nama_bank": "Bank Index Selindo", "abbreviation": "Index", "kode": 874 },
    { "id_bank": "INDOIDJA", "nama_bank": "Bank Indonesia", "abbreviation": "BI", "kode": 998 },
    { "id_bank": "PDJBIDJ1", "nama_bank": "Bank Jabar Banten Syariah", "abbreviation": "BJB Sy", "kode": 217 },
    { "id_bank": "JAGBIDJA", "nama_bank": "Bank Jago", "abbreviation": "Jago", "kode": 777 },
    { "id_bank": "JAGBIDJ1", "nama_bank": "Bank Jago Unit Usaha Syariah", "abbreviation": "Jago UUS", "kode": 463 },
    { "id_bank": "PDJTIDJ1", "nama_bank": "Bank Jatim UUS", "abbreviation": "Jatim UUS", "kode": 120 },
    { "id_bank": "JTRUIDJA", "nama_bank": "Bank Jtrust Indonesia", "abbreviation": "Jtrust", "kode": 658 },
    { "id_bank": "KHNAIDJA", "nama_bank": "Bank KEB Hana Indonesia", "abbreviation": "Hana", "kode": 341 },
    { "id_bank": "BMRIIDJA", "nama_bank": "Bank Mandiri", "abbreviation": "Mandiri", "kode": 901 },
    { "id_bank": "BTPNIDJA", "nama_bank": "Bank Mandiri Taspen", "abbreviation": "Taspen", "kode": 534 },
    { "id_bank": "MAYBIDJA", "nama_bank": "Bank Mayapada", "abbreviation": "Mayapada", "kode": 286 },
    { "id_bank": "IBBKIDJA", "nama_bank": "Bank Maybank Indonesia", "abbreviation": "Maybank", "kode": 489 },
    { "id_bank": "MAYBIDJ1", "nama_bank": "Bank Maybank UUS", "abbreviation": "MaybankUUS", "kode": 752 },
    { "id_bank": "MEGAIDJA", "nama_bank": "Bank Mega", "abbreviation": "Mega", "kode": 438 },
    { "id_bank": "BSMDIDJA", "nama_bank": "Bank Mega Syariah", "abbreviation": "Mega Sy", "kode": 165 },
    { "id_bank": "MESTIDJA", "nama_bank": "Bank Mestika Dharma", "abbreviation": "Mestika", "kode": 927 },
    { "id_bank": "MHCCIDJA", "nama_bank": "Bank Mizuho Indonesia", "abbreviation": "Mizuho", "kode": 604 },
    { "id_bank": "MNCIIDJA", "nama_bank": "Bank MNC Internasional", "abbreviation": "MNC", "kode": 371 },
    { "id_bank": "MUABIDJA", "nama_bank": "Bank Muamalat Indonesia", "abbreviation": "Muamalat", "kode": 219 },
    { "id_bank": "MASNIDJA", "nama_bank": "Bank Multi Arta Sentosa", "abbreviation": "MAS", "kode": 896 },
    { "id_bank": "PDNBIDJ1", "nama_bank": "Bank Nagari", "abbreviation": "Nagari", "kode": 473 },
    { "id_bank": "PDNBIDJ1", "nama_bank": "Bank Nagari UUS", "abbreviation": "Nagari UUS", "kode": 128 },
    { "id_bank": "SNMRIDJ1", "nama_bank": "Bank Nano Syariah", "abbreviation": "SNMRS UUS", "kode": 590 },
    { "id_bank": "NOBUIDJA", "nama_bank": "Bank Nationalnobu", "abbreviation": "Nobu", "kode": 304 },
    { "id_bank": "BNINIDJA", "nama_bank": "Bank Negara Indonesia", "abbreviation": "BNI", "kode": 690 },
    { "id_bank": "NEOCIDJA", "nama_bank": "Bank Neo Commerce", "abbreviation": "Neo", "kode": 862 },
    { "id_bank": "NISPIDJA", "nama_bank": "Bank OCBC", "abbreviation": "OCBC", "kode": 258 },
    { "id_bank": "NISPIDJA", "nama_bank": "Bank OCBC NISP UUS", "abbreviation": "OCBC UUS", "kode": 715 },
    { "id_bank": "BOFAID2X", "nama_bank": "Bank of America", "abbreviation": "BOA", "kode": 139 },
    { "id_bank": "BKCHIDJA", "nama_bank": "Bank of China", "abbreviation": "BoC", "kode": 847 },
    { "id_bank": "BOIIDJJA", "nama_bank": "Bank Of India Indonesia", "abbreviation": "BoI", "kode": 506 },
    { "id_bank": "OKEIIDJA", "nama_bank": "Bank OKE Indonesia", "abbreviation": "OKE", "kode": 273 },
    { "id_bank": "PDSDIDJ1", "nama_bank": "Bank Panin Dubai Syariah", "abbreviation": "Panin D Sy", "kode": 419 },
    { "id_bank": "BBBAIDJA", "nama_bank": "Bank Permata", "abbreviation": "Permata", "kode": 347 },
    { "id_bank": "BBBAIDJA", "nama_bank": "Bank Permata UUS", "abbreviation": "PermataUUS", "kode": 821 },
    { "id_bank": "QNBKIDJA", "nama_bank": "Bank QNB Indonesia", "abbreviation": "QNB", "kode": 695 },
    { "id_bank": "BRINIDJA", "nama_bank": "Bank Rakyat Indonesia", "abbreviation": "BRI", "kode": 133 },
    { "id_bank": "RAYAIDJA", "nama_bank": "Bank Raya Indonesia", "abbreviation": "Raya", "kode": 562 },
    { "id_bank": "REPOIDJA", "nama_bank": "Bank Resona Perdania", "abbreviation": "Resona", "kode": 208 },
    { "id_bank": "SAMPIDJA", "nama_bank": "Bank Sahabat Sampoerna", "abbreviation": "Sampoerna", "kode": 774 },
    { "id_bank": "SAQUIDJA", "nama_bank": "Bank Saqu Indonesia", "abbreviation": "Saqu", "kode": 391 },
    { "id_bank": "SHBKIDJA", "nama_bank": "Bank Shinhan Indonesia", "abbreviation": "Shinhan", "kode": 647 },
    { "id_bank": "SIMSIDJA", "nama_bank": "Bank Sinarmas", "abbreviation": "Sinarmas", "kode": 185 },
    { "id_bank": "SUNIIDJA", "nama_bank": "Bank SMBC Indonesia", "abbreviation": "SMBC", "kode": 920 },
    { "id_bank": "PDWSIDJA", "nama_bank": "Bank Sulselbar", "abbreviation": "Sulselbar", "kode": 944 },
    { "id_bank": "SLSBRIDJ1", "nama_bank": "Bank Sulselbar UUS", "abbreviation": "SLSBR UUS", "kode": 512 },
    { "id_bank": "BUKPIDJA", "nama_bank": "Bank Syariah Bukopin", "abbreviation": "Bukopin Sy", "kode": 366 },
    { "id_bank": "BSMDIDJA", "nama_bank": "Bank Syariah Indonesia", "abbreviation": "BSI", "kode": 998 },
    { "id_bank": "BTANIDJA", "nama_bank": "Bank Tabungan Negara", "abbreviation": "BTN", "kode": 901 },
    { "id_bank": "BTPNIDJA", "nama_bank": "Bank Tabungan Pensiunan Nasional Syariah", "abbreviation": "BTPN Sy", "kode": 534 },
    { "id_bank": "UOBVIDJA", "nama_bank": "Bank UOB Indonesia", "abbreviation": "UOB", "kode": 278 },
    { "id_bank": "VICBIDJA", "nama_bank": "Bank Victoria International", "abbreviation": "Victoria", "kode": 413 },
    { "id_bank": "WOURIDJA", "nama_bank": "Bank Woori Saudara", "abbreviation": "Woori", "kode": 750 },
    { "id_bank": "BCADIDJ1", "nama_bank": "BCA Digital", "abbreviation": "BCA Digi", "kode": 629 },
    { "id_bank": "PDBLIDJ1", "nama_bank": "BPD Bali", "abbreviation": "BPD Bali", "kode": 184 },
    { "id_bank": "PDBTIDJ1", "nama_bank": "BPD Banten", "abbreviation": "Banten", "kode": 736 },
    { "id_bank": "PDJMIDJ1", "nama_bank": "BPD Jambi", "abbreviation": "Jambi", "kode": 402 },
    { "id_bank": "PDJMIDJ1", "nama_bank": "BPD Jambi UUS", "abbreviation": "Jambi UUS", "kode": 159 },
    { "id_bank": "PDJGIDJ1", "nama_bank": "BPD Jateng", "abbreviation": "Jateng", "kode": 632 },
    { "id_bank": "PDJGIDJ1", "nama_bank": "BPD Jateng UUS", "abbreviation": "Jateng UUS", "kode": 307 },
    { "id_bank": "PDJTIDJ1", "nama_bank": "BPD Jatim", "abbreviation": "Jatim", "kode": 120 },
    { "id_bank": "PDKBIDJ1", "nama_bank": "BPD Kalbar", "abbreviation": "Kalbar", "kode": 865 },
    { "id_bank": "PDKBIDJ1", "nama_bank": "BPD Kalbar UUS", "abbreviation": "Kalbar UUS", "kode": 441 },
    { "id_bank": "PDKTIDJ1", "nama_bank": "BPD Kalimantan Tengah", "abbreviation": "Kalteng", "kode": 655 },
    { "id_bank": "PDKTIDJ1", "nama_bank": "BPD Kaltimtara", "abbreviation": "Kaltimtara", "kode": 228 },
    { "id_bank": "KLTMIDJ1", "nama_bank": "BPD Kaltimtara UUS", "abbreviation": "KLTMTR UUS", "kode": 793 },
    { "id_bank": "PDNTIDJ1", "nama_bank": "BPD NTT", "abbreviation": "NTT", "kode": 516 },
    { "id_bank": "BSSPIDSP", "nama_bank": "BPD Sumsel Babel", "abbreviation": "SSBB", "kode": 301 },
    { "id_bank": "SSBBIDJ1", "nama_bank": "BPD Sumsel Babel UUS", "abbreviation": "SSBB UUS", "kode": 678 },
    { "id_bank": "PDSUIDJ1", "nama_bank": "BPD Sumut", "abbreviation": "Sumut", "kode": 415 },
    { "id_bank": "PDSUIDJ1", "nama_bank": "BPD Sumut UUS", "abbreviation": "Sumut UUS", "kode": 962 },
    { "id_bank": "CCBKIDJA", "nama_bank": "China Construction Bank Indonesia", "abbreviation": "CCB", "kode": 147 },
    { "id_bank": "CITIIDJX", "nama_bank": "Citibank", "abbreviation": "CITI", "kode": 583 },
    { "id_bank": "DANAIDJ1", "nama_bank": "DANA", "abbreviation": "DANA", "kode": 873 },
    { "id_bank": "DEUTIDJA", "nama_bank": "Deutsche Bank AG", "abbreviation": "Deutsche", "kode": 319 },
    { "id_bank": "CHASUS33", "nama_bank": "Jpmorgan Chase Bank", "abbreviation": "JPM Chase", "kode": 704 },
    { "id_bank": "KBBKIDJA", "nama_bank": "KB Bank", "abbreviation": "KB", "kode": 251 },
    { "id_bank": "KRTHIDJA", "nama_bank": "Krom Bank Indonesia", "abbreviation": "Bisnis", "kode": 836 },
    { "id_bank": "KSEIIDJA", "nama_bank": "Kustodian Sentral Efek Indonesia", "abbreviation": "KSEI", "kode": 492 },
    { "id_bank": "MUFGIDJA", "nama_bank": "MUFG Bank", "abbreviation": "MUFG", "kode": 167 },
    { "id_bank": "PINBIDJA", "nama_bank": "Panin Bank", "abbreviation": "Panin", "kode": 925 },
    { "id_bank": "PDRIIDJ1", "nama_bank": "PT BPD Riau Kepri Syariah (Perseroda)", "abbreviation": "Riau", "kode": 380 },
    { "id_bank": "NUSAIDJ1", "nama_bank": "PT Nusantara Cita Bersama", "abbreviation": "Nusacita", "kode": 614 },
    { "id_bank": "SEABIDJA", "nama_bank": "Seabank", "abbreviation": "Seabank", "kode": 381 },
    { "id_bank": "SHOPEIDJ1", "nama_bank": "Shopeepay", "abbreviation": "Shopeepay", "kode": 729 },
    { "id_bank": "SCBLIDJA", "nama_bank": "Standard Chartered Bank", "abbreviation": "Stanchart", "kode": 456 },
    { "id_bank": "PDLPIDJ1", "nama_bank": "BPD Lampung", "abbreviation": "Lampung", kode: 773 },
]
// Buat lookup yang lebih kaya variasi
const entityLookup = new Map();
bifastList.forEach(bank => {
  const abbr = bank.abbreviation.toLowerCase();
  const name = bank.nama_bank.toLowerCase();
  const cleanName = name.replace(/^bank\s+/i, '').trim(); // "aceh syariah"

  entityLookup.set(abbr, bank.abbreviation);
  entityLookup.set(name, bank.abbreviation);
  entityLookup.set(cleanName, bank.abbreviation);
  entityLookup.set(`bpd ${abbr}`, bank.abbreviation);
  entityLookup.set(`bank ${abbr}`, bank.abbreviation);
  entityLookup.set(`@${abbr}`, bank.abbreviation);
  entityLookup.set(`@${cleanName}`, bank.abbreviation);
  entityLookup.set(`@${name}`, bank.abbreviation);
});

// Tambah variasi manual khusus DANA & umum
entityLookup.set('dana', 'DANA');
entityLookup.set('@dana', 'DANA');
entityLookup.set('dana - 3', 'DANA');
entityLookup.set('technical support dana', 'DANA');

function normalizeBank(text) {
  const lower = text.toLowerCase().trim().replace(/[,.;()]$/g, '').trim();
  return entityLookup.get(lower) || null;
}

function detectGangguan(text) {
  const lowerText = text.toLowerCase();

  // Keyword gangguan diperluas agar case "pengecekan", "boleh dibantu" lolos
  const gangguanKeywords = [
    'kendala', 'gangguan', 'u173', 'rc u173', 'kenaikan response', 'terpantau',
    'gagal login', 'mohon dicek', 'intermitten', 'pengecekan', 'boleh dibantu',
    'kenaikan u173', 'kenaikan rc'
  ];

  if (!gangguanKeywords.some(kw => lowerText.includes(kw))) {
    return { complainerEntity: null, reportedBank: null, message: null };
  }

  let complainer = null;
  let reported = null;

  // 1. Complainer: prioritas awal pesan (tag sender)
  const lines = text.split('\n');
  const awalPart = (lines[0] + ' ' + (lines[1] || '')).trim();
  const awalLower = awalPart.toLowerCase();

  const awalWords = awalPart.split(/\s+/);
  for (let i = awalWords.length - 1; i >= 0; i--) {
    const word = awalWords[i];
    const norm = normalizeBank(word);
    if (norm) {
      complainer = norm;
      break;
    }
    // 2 kata
    if (i > 0) {
      const two = (awalWords[i-1] + ' ' + word).toLowerCase();
      const normTwo = normalizeBank(two);
      if (normTwo) {
        complainer = normTwo;
        break;
      }
    }
    // 3 kata (penting untuk "bank aceh syariah")
    if (i > 1) {
      const three = (awalWords[i-2] + ' ' + awalWords[i-1] + ' ' + word).toLowerCase();
      const normThree = normalizeBank(three);
      if (normThree) {
        complainer = normThree;
        break;
      }
    }
  }

  // Khusus DANA support
  if (!complainer && awalLower.includes('dana')) {
    complainer = 'DANA';
  }

  // 2. Reported: setelah indikator
  const indicators = [
    'dari ', 'ke arah ', 'ke ', 'u173 dari ', 'u173 ke ', 'rc u173 ke ', 'kenaikan u173 ke ', 'kenaikan u173 '
  ];

  let earliestPos = Infinity;
  indicators.forEach(kw => {
    const pos = lowerText.indexOf(kw);
    if (pos !== -1 && pos < earliestPos) earliestPos = pos + kw.length;
  });

  if (earliestPos < Infinity) {
    const afterText = text.slice(earliestPos);
    const afterWords = afterText.split(/\s+/).slice(0, 12);

    for (let i = 0; i < afterWords.length; i++) {
      const word = afterWords[i];
      const norm = normalizeBank(word);
      if (norm && norm !== complainer) {
        reported = norm;
        break;
      }
      if (i + 1 < afterWords.length) {
        const two = (afterWords[i] + ' ' + afterWords[i+1]).toLowerCase();
        const normTwo = normalizeBank(two);
        if (normTwo && normTwo !== complainer) {
          reported = normTwo;
          break;
        }
      }
      if (i + 2 < afterWords.length) {
        const three = (afterWords[i] + ' ' + afterWords[i+1] + ' ' + afterWords[i+2]).toLowerCase();
        const normThree = normalizeBank(three);
        if (normThree && normThree !== complainer) {
          reported = normThree;
          break;
        }
      }
    }
  }

  // Fallback reported: jika tidak ketemu proximity, ambil entity TERAKHIR di seluruh teks (sering reported ada di belakang)
  if (!reported) {
    const candidates = [];
    for (const [key, value] of entityLookup.entries()) {
      let lastPos = -1;
      let pos = lowerText.indexOf(key, 0);
      while (pos !== -1) {
        lastPos = pos;
        pos = lowerText.indexOf(key, pos + 1);
      }
      if (lastPos !== -1 && value !== complainer) {
        candidates.push({ value, pos: lastPos });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.pos - a.pos); // ambil yang paling belakang
      reported = candidates[0].value;
    }
  }

  // Jika hanya reported yang ketemu (tidak ada complainer), itu OK sesuai requestmu
  return {
    complainerEntity: complainer || 'Tidak terdeteksi',
    reportedBank: reported || 'Tidak terdeteksi',
    message: text.trim()
  };
}
// Tes
const case1 = `Rekan @Technical Support DANA - 3 @Dana
Technical terpantau ada intermitten kenaikan response
U173 dari BRI, apakah sedang ada kendala? Terimakasih`;

const case2 = `Rekan @bank BPD Jatim, dari BRI ada kenaikan rc u173 ke arah Bank Jatim, 
apakah ada kendala`;

const case3 = `Rekan @bank BPD Lampung, dari BRI ada kenaikan rc U173 ke arah Bank Lampung (PDLPIDJ1), apakah ada kendala ?`

const case4 = `Rekan @bank aceh syariah, boleh dibantu pengecekan terpantau kenaikan U173 ke Bank Aceh Syariah, terima kasih`

console.log(detectGangguan(case1));
// Harusnya: { complainerEntity: 'DANA', reportedBank: 'BRI', message: ... }

console.log(detectGangguan(case2));
// Harusnya: { complainerEntity: 'Jatim', reportedBank: 'BRI', message: ... }

console.log(detectGangguan(case3));
// Harusnya: { complainerEntity: 'Lampung', reportedBank: 'BRI', message: ... }

console.log(detectGangguan(case4));
// Harusnya: { complainerEntity: 'Lampung', reportedBank: 'BRI', message: ... }