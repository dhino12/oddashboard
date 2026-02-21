import { bifastList } from "../../../config/bifastlist";


type ComplaintMessageParser = {
    complainerEntity: string | null
    reportedBank: string | null
    message: string | null
}

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

function normalizeBank(text: string) {
    const lower = text.toLowerCase().trim().replace(/[,.;()]$/g, '').trim();
    return entityLookup.get(lower) || null;
}

export function detectGangguan(text: string): ComplaintMessageParser {
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