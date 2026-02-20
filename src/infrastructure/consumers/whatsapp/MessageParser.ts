// src/infrastructure/consumers/whatsapp/MessageParser.ts
import nlp from "compromise";
import { bifastList } from "../../../config/bifastlist";
const OPEN_VERBS = ["open", "opened", "buka", "aktif", "reopen"];
const CLOSED_PATTERNS = [ "closed", "ditutup", "down", "autoclose", "auto close", "has closed", "successfully closed" ];
const OPEN_PATTERNS = [ "open", "dibuka", "dibuka kembali", "reopen", "up" ];

const IGNORE_WORDS = new Set([
    "bifast", "qris", "rtgs", "skn",
    "ditutup", "dibuka", "closed", "open", "down", "error",
]);

export type ParsedBifastMessage = {
    source: "BIFAST";
    entity: string;
    status: "OPEN" | "CLOSED";
    reason?: "AUTOCLOSE" | "MANUAL" | "UNKNOWN";
}; 

function extractEntities(text: string): string[] {
    if (text.split("\n")[0].includes("BI FAST [CT OUTGOING]")){
        const match = text.match(/\b[A-Z]{3,}ID[A-Z0-9]+\b/);
        return match ? [match[0]] : [""];
    }
    const doc = nlp(text);
    return doc
        .terms()
        .not("#Verb")
        .not("#Preposition")
        .out("array")
        .map((t: any) => t.toLowerCase())
        .filter((t: any) => /^[a-z]{3,}$/i.test(t))
        .filter((t: any) => !IGNORE_WORDS.has(t));
}

function normalizeEntity(raw: string): string {
    if (raw == "") return ""
    const t = raw.toUpperCase()
    return bifastList.find(bifastName => {
        if (bifastName.id_bank.toUpperCase() == t || t == bifastName.nama_bank.toUpperCase()) {
            return bifastName.nama_bank.toUpperCase()
        }
    })?.nama_bank ?? ""
}

function detectSource(text: string): "BIFAST" | null {
    return /bi\s*fast/i.test(text) ? "BIFAST" : null;
}
function detectStatusNLP(text: string): "OPEN" | "CLOSED" | null {
    const t = text.toLowerCase();

    if (CLOSED_PATTERNS.some(p => t.includes(p))) {
        return "CLOSED";
    }

    if (OPEN_PATTERNS.some(p => t.includes(p))) {
        return "OPEN";
    }
    if (/[❌⛔🚫]/.test(text)) return "CLOSED";
    if (/[✅🟢]/.test(text)) return "OPEN";

    return null;
}

function detectEntity(text: string): string | null {
    const tokens = extractEntities(text.toUpperCase());
    console.log(tokens);
    
    return normalizeEntity(tokens[0])
}
function detectReason(text: string): ParsedBifastMessage["reason"] {
    if (/auto|otomatis|automatically/i.test(text)) return "AUTOCLOSE";
    if (/manual/i.test(text)) return "MANUAL";
    return "UNKNOWN";
}

interface GangguanDetection {
    complainerEntity: string | null;    // lawan bicara / yang complain (misal "BTN", "BANK MEGA")
    reportedBank: string | null;        // bank yang dikeluhkan (misal "MANDIRI", "Bank Cimbniaga")
    message: string | null;
}

export function detectGangguanWithEntities(text: string): GangguanDetection {
    // Keyword gangguan
    const gangguanKeywords = [
        'kendala', 'gangguan', 'u173', 'kenaikan response', 'gagal login','ada kendala'
    ];

    // Pola untuk reportedBank (yang dikeluhkan)
    const reportedBankPattern = /dari\s+([A-Z][a-zA-Z\s]+?)(?=\s*,|\s*\.|$|\s+apakah|\s+dari|\s+BTN|\s+mandiri|\s+bni|\s+bri)/i;

    // Pola untuk complainerEntity (lawan bicara / pengirim keluhan)
    const complainerPatterns = [
        /kami\s+dari\s+([A-Z][a-zA-Z\s]+?)(?:\s*,|\s+ mengalami|\s+mengalami|\s*$)/i,           // "Kami dari BTN"
        /\b(?:IT|Service\s+Desk|Recovery|HelpDesk|TIM|BIFAST|NationalNobu|Tbk)\s+([A-Z][a-zA-Z\s]+?)\b/i,  // "IT Service Desk BRI", "IT RECOVERY BANK MEGA"
        /@([A-Z][^@\n]{3,30}?)(?:\s+Technical|\s+Support|\s*-\s*\d|\s*@|\n|$)/i,                 // "@TIM BIFAST BI", "@NationalNobu"
        /\b(BTN|BNI|BRI|MANDIRI|MEGA|CIMB|(?:Bank\s+[A-Za-z]+))\b(?=.*mengalami|.*kendala)/i     // fallback nama bank sebelum kata keluhan
    ];

    // Split pesan (sama seperti sebelumnya)
    const messageSplitter = /(?:\n|^)(?=\d{1,2}[.:]\d{2}|\bRekan\b|\b[A-Z]{3,}\b\s*(?:@|\s|$)|^\s*[A-Z][a-zA-Z\s]+(?:\s+Support|\s+Desk|\s+Recovery|\s+IT))/gm;
    const rawParts = text.split(messageSplitter).filter(p => p.trim());
    const messages: string[] = [];
    let current = '';

    for (const part of rawParts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        if (trimmed.match(/^\d{1,2}[.:]\d{2}$/) || trimmed.match(/^\b(Rekan|IT|Technical|DANA|BNI|BRI|MANDIRI|MEGA|BTN)\b/)) {
        if (current) {
            messages.push(current.trim());
            current = '';
        }
        }
        current += trimmed + ' ';
    }
    if (current) messages.push(current.trim());

    // Proses setiap pesan
    for (const msg of messages) {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.length < 30) continue;

        const hasGangguan = gangguanKeywords.some(kw => lowerMsg.includes(kw));
        if (!hasGangguan) continue;

        let complainer: string | null = null;
        let reported: string | null = null;

        // 1. Ekstrak complainerEntity (lawan bicara)
        for (const pattern of complainerPatterns) {
            const match = msg.match(pattern);
            if (match && match[1]) {
                complainer = match[1].trim();
                break;
            }
        }

        // Fallback: jika tidak ketemu pola spesifik, ambil nama bank/instansi di awal pesan (3-20 karakter pertama setelah @ atau kata awal)
        if (!complainer) {
            const awalMatch = msg.match(/^.{0,60}(?:@|\bKami dari\b|\bIT\b|\bTIM\b|\bRecovery\b|\bService Desk\b)([^@\n]{3,25})/i);
            if (awalMatch && awalMatch[1]) {
                complainer = awalMatch[1].trim().replace(/Technical Support.*$/i, '').trim();
            }
        }

        // 2. Ekstrak reportedBank
        const reportedMatch = msg.match(reportedBankPattern);
        if (reportedMatch && reportedMatch[1]) {
            reported = reportedMatch[1].trim();
        } else {
            // Fallback: cari nama bank lain yang muncul (bukan DANA)
            const possibleBanks = ['MANDIRI', 'BNI', 'BRI', 'MEGA', 'BTN', 'CIMB', 'CIMB NIAGA', 'BCA', 'NOBU'];
            for (const bank of possibleBanks) {
                if (lowerMsg.includes(bank.toLowerCase()) && !lowerMsg.includes('dana')) {
                    reported = bank;
                    break;
                }
            }
        }

        // Jika keduanya ketemu (atau minimal reported ketemu), return
        if (reported || complainer) {
            const cleanedMsg = msg.replace(/^\d{1,2}[.:]\d{2}\s*/, '').trim();
            return {
                complainerEntity: complainer || "Tidak terdeteksi",
                reportedBank: reported || "Tidak terdeteksi",
                message: cleanedMsg
            };
        }
    }

    return { complainerEntity: null, reportedBank: null, message: null };
}

export function parseBifastMessage(rawText: string): ParsedBifastMessage | null {
    if (!rawText) return null;
    rawText = rawText.replace(/^source:.*$/gim, "").trim();

    const source = detectSource(rawText); 
    console.log(`Source: ${source}`);
    if (!source) return null;
    
    const entity = detectEntity(rawText);
    console.log(`Entity: ${entity}`);
    if (!entity) return null;
    
    const status = detectStatusNLP(rawText);
    console.log(`Status: ${status}`);
    if (!status) return null;
    
    const reason = detectReason(rawText);
    console.log(`Reason: ${reason}`);

    return { source, entity, status, reason };
}
