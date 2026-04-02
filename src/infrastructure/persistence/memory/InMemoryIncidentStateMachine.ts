import { normalizeBankEntity } from "../../../config/bifastlist";

export type IncidentState =
    | "CLOSE"
    | "NORMAL"
    | "WAIT"
    | "FALSE_POSITIVE"
    | "CONFIRMED_INCIDENT"
    | "OPEN_INCIDENT"
    | "RESOLVED";

export interface IncidentStateRecord {
    entity: string;
    metricName?: string;
    state: IncidentState;
    timestamp: number;
}

export class InMemoryIncidentStateStore {
    private store = new Map<string, IncidentStateRecord>();

    get(entity: string): IncidentStateRecord | null {
        return this.store.get(entity) ?? null;
    }

    set(entity: string, record: IncidentStateRecord) {
        this.store.set(entity, record);
    }

    delete(entity: string) {
        this.store.delete(entity);
    }

    all(): IncidentStateRecord[] {
        return Array.from(this.store.values());
    }
}
export type IncidentEvent = {
    entity: string;
    state: string;
    note?: string;
    ts: number;
};

export class InMemoryIncidentEventStore {
    // private events: IncidentEvent[] = [];
    private events = new Map<string, IncidentEvent[]>()
    private readonly windowMs = 60 * 60 * 1000

    push(evt: IncidentEvent) {
        const arr = this.events.get(evt.entity) ?? [];
        arr.push(evt)
        const now = Date.now();
        const filtered = arr.filter(e => now - e.ts <= this.windowMs)
        this.events.set(evt.entity, filtered)
    }

    listByEntity(entity: string) {
        const arr = this.events.get(entity)
        if (arr == undefined) return []
        return arr.filter(e => e.entity === entity);
    }
}

const allowedTransitions: Record<IncidentState, IncidentState[]> = {
    CLOSE: ["FALSE_POSITIVE", "NORMAL", "WAIT"],
    NORMAL: ["WAIT", "FALSE_POSITIVE", "CLOSE"],
    FALSE_POSITIVE: ["NORMAL"],
    WAIT: ["CONFIRMED_INCIDENT", "NORMAL", "WAIT"],
    CONFIRMED_INCIDENT: ["OPEN_INCIDENT", "RESOLVED"],
    OPEN_INCIDENT: ["RESOLVED"],
    RESOLVED: ["NORMAL"]
};

export class InMemoryIncidentStateMachine {
    constructor(
        private store: InMemoryIncidentStateStore,
        private eventStore: InMemoryIncidentEventStore
    ) {}

    getCurrentState(entity: string): IncidentState {
        const entityBankName = normalizeBankEntity(entity).toLowerCase()
        const rec = this.store.get(entityBankName);
        return rec?.state ?? "NORMAL"
    }

    getTimeline(entity: string): IncidentEvent[] {
        const entityBankName = normalizeBankEntity(entity).toLowerCase();
        return this.eventStore.listByEntity(entityBankName)
    }

    transition(entity: string, metricName: string | undefined, next: IncidentState, note?: string) {
        const entityBankName = normalizeBankEntity(entity).toLowerCase()
        const currentRec = this.store.get(entityBankName);
        const current: IncidentState = currentRec?.state ?? "NORMAL";
        const allowed = allowedTransitions[current] ?? [];
        // console.log(entityBankName, next, allowed);

        if (next === "RESOLVED" || next === "NORMAL") {
            this.apply(entityBankName, metricName, next, note);
            return true;
        }

        if (!allowed.includes(next)) {
            // not allowed transition
            return false;
        }

        // console.log(allowed, current, entityBankName);
        this.apply(entityBankName, metricName, next, note);
        return true;
    }

    formatMessage(entity: string, events: IncidentEvent[]): string {
        const header = `INCIDENT BIFAST ${entity}\n`
        const lines = events.map(e => {
            const time = new Date(e.ts)
                .toTimeString()
                .slice(0,5)
            if (e.state == "NORMAL") return `[${time}] ${e.state} - ${e.note}\n`
            return `[${time}] ${e.state} - ${e.note}`
        })
        return `${header} \n${lines.join("\n")}`
    }

    private apply(entity: string, metricName: string | undefined, state: IncidentState, note?: string) {
        const ts = Date.now();
        this.store.set(entity, { entity, metricName, state, timestamp: ts });
        this.eventStore.push({ entity, state, note, ts });
    }
}