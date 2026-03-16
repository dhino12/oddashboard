interface ParsedStateCommand {
    source: string;
    entity: string;
    time?: string;
}

export function parseStateCommand(message: string): ParsedStateCommand | null {
    const trimmed = message.trim();

    if (!trimmed.startsWith('/state ')) {
        return null;
    }

    const content = trimmed.slice(7).trim();
    if (!content) return null;
    const parts = content.split(/\s+/);
    const source = parts[0];
    const timeRegex = /^\d{1,2}:\d{2}$/;
    let time: string | undefined;
    let entityParts: string[];

    if (parts.length > 1 && timeRegex.test(parts[parts.length - 1])) {
        time = parts.pop()!;
        entityParts = parts.slice(1);
    } else {
        entityParts = parts.slice(1);
    }

    const entity = entityParts.join(' ').trim();

    return {
        source,
        entity: entity || '',
        time,
    };
}