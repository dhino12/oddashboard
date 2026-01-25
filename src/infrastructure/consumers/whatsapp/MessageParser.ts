// src/infrastructure/consumers/whatsapp/MessageParser.ts

export type ParsedBifastMessage = {
    source: "BIFAST";
    entity: string;
    status: "OPEN" | "CLOSED";
    reason?: "AUTOCLOSE" | "MANUAL" | "UNKNOWN";
};

const ENTITY_REGEX = /\b([A-Z]{3,}[A-Z0-9]+)\b/;
const CLOSED_REGEX = /\bclosed\b/i;
const OPEN_REGEX = /\bopen(ed)?\b/i;
const AUTOCLOSE_REGEX = /\bautomatically\b/i;

export function parseBifastMessage(rawText: string): ParsedBifastMessage | null {
    if (!rawText) return null;

    // Must contain "BI Fast" keyword (guard awal)
    if (!/bi\s*fast/i.test(rawText)) return null;

    // Extract entity (contoh: DANAIDJ1)
    const entityMatch = rawText.match(ENTITY_REGEX);
    if (!entityMatch) return null;
    const entity = entityMatch[1].toUpperCase();
    // Determine status
    let status: "OPEN" | "CLOSED" | null = null;
    if (CLOSED_REGEX.test(rawText)) {
        status = "CLOSED";
    } else if (OPEN_REGEX.test(rawText)) {
        status = "OPEN";
    }
    if (!status) return null;

    // Optional reason
    let reason: ParsedBifastMessage["reason"] = "UNKNOWN";
    if (AUTOCLOSE_REGEX.test(rawText)) {
        reason = "AUTOCLOSE";
    }

    return {
        source: "BIFAST",
        entity,
        status,
        reason,
    };
}
