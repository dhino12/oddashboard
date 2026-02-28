import { bifastList } from "../../../config/bifastlist";

const mentionedWhatsappMap: Record<string, string> = {
    "TOKEN_MENTIONED_WHATSAPP": "BSI",
    "12112131": "BSI",
    "312131121": "BCA"
};

function extractMentionTokens(text: string): string[] {
    const matches = text.match(/@(\d+|[A-Z0-9_]+)/gi);
    if (!matches) return [];

    return matches.map(m => m.replace('@', '').toUpperCase());
}

type ComplaintMessageParser = {
    complainerEntity: string | null;
    reportedBank: string | null;
    message: string | null;
};

type EntityCandidate = {
    value: string;
    key: string;
    pos: number;
};

const entityLookup = new Map<string, string>();

bifastList.forEach(bank => {
    const abbr = bank.abbreviation.toLowerCase();
    const name = bank.nama_bank.toLowerCase();
    const cleanName = name.replace(/^bank\s+/i, '').trim();

    [
        abbr,
        name,
        cleanName,
        `bank ${abbr}`,
        `bank ${cleanName}`,
        `bpd ${abbr}`,
        `@${abbr}`,
        `@${name}`,
        `@${cleanName}`,
    ].forEach(key => entityLookup.set(key, bank.abbreviation));
});

[
    'dana',
    '@dana',
    'technical support dana',
    'dana - 3',
].forEach(k => entityLookup.set(k, 'DANA'));

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9@ ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeBank(text: string): string | null {
    return entityLookup.get(text) || null;
}

function scanEntities(text: string): EntityCandidate[] {
    const normalized = normalizeText(text);
    const candidates: EntityCandidate[] = [];

    for (const [key, value] of entityLookup.entries()) {
        let pos = normalized.indexOf(key);
        while (pos !== -1) {
            candidates.push({ value, key, pos });
            pos = normalized.indexOf(key, pos + 1);
        }
    }

    return candidates.sort((a, b) => {
        if (b.key.length !== a.key.length) {
            return b.key.length - a.key.length; // longest match wins
        }
        return b.pos - a.pos;
    });
}

export function detectGangguan(text: string): ComplaintMessageParser {
    const normalized = normalizeText(text);

    const gangguanKeywords = [
        'kendala', 'gangguan', 'u173', 'rc u173', 'u170', 'u999',
        'kenaikan response', 'intermitten',
        'gagal login', 'pengecekan'
    ];

    if (!gangguanKeywords.some(k => normalized.includes(k))) {
        return { complainerEntity: null, reportedBank: null, message: null };
    }

    let complainer: string | null = null;
    let reported: string | null = null;

    const mentionTokens = extractMentionTokens(text);

    for (const token of mentionTokens) {
        if (mentionedWhatsappMap[token]) {
            complainer = mentionedWhatsappMap[token];
            break; // HARUS menang, stop
        }
    }
    const entities = scanEntities(text);

    if (!complainer) {
        const mentionEntity = entities.find(e => e.key.startsWith('@'));
        if (mentionEntity) {
            complainer = mentionEntity.value;
        }
    } 
    const directionPatterns = [
        { re: /u173 dari (.+?) ke /, type: 'from-to' },
        { re: /dari (.+?) ke arah (.+)/, type: 'from-to' },
        { re: /dari (.+)/, type: 'from' },
        { re: /ke arah (.+)/, type: 'to' },
        { re: /ke (.+)/, type: 'to' },
    ];

    for (const { re, type } of directionPatterns) {
        const match = normalized.match(re);
        if (!match) continue;

        if (type === 'from-to') {
            const from = normalizeBank(match[1].trim());
            const to = normalizeBank(match[2]?.trim());
            if (from) reported = from;
            if (!complainer && to) complainer = to;
            break;
        }

        if (type === 'from') {
            const from = normalizeBank(match[1].trim());
            if (from) reported = from;
            break;
        }

        if (type === 'to') {
            const to = normalizeBank(match[1].trim());
            if (to) complainer = to;
            break;
        }
    } 
    if (!complainer) {
        const fallback = entities.find(e => e.value !== reported && e.value !== 'BI');
        if (fallback) complainer = fallback.value;
    }

    if (!reported) {
        const fallback = entities.find(e => e.value !== complainer && e.value !== 'BI');
        if (fallback) reported = fallback.value;
    }

    return {
        complainerEntity: complainer || 'Tidak terdeteksi',
        reportedBank: reported || 'Tidak terdeteksi',
        message: text.trim()
    };
}