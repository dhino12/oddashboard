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
    const t = raw.toUpperCase()
    return bifastList.find(bifastName => {
        if (bifastName.id_bank.toUpperCase() == t || t == bifastName.nama_bank.toUpperCase()) return bifastName.nama_bank.toUpperCase()
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
