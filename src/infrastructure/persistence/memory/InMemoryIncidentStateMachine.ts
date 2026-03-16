import { findBifastBankNameByAbbreviation, normalizeBankEntity } from "../../../config/bifastlist";

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
    private events: IncidentEvent[] = [];

    push(evt: IncidentEvent) {
        this.events.push(evt);
        if (this.events.length > 2000) this.events.splice(0, this.events.length - 2000);
    }

    listByEntity(entity: string) {
        return this.events.filter(e => e.entity === entity);
    }
}

const allowedTransitions: Record<IncidentState, IncidentState[]> = {
    CLOSE: ["FALSE_POSITIVE", "NORMAL", "WAIT"],
    NORMAL: ["WAIT", "FALSE_POSITIVE", "CLOSE"],
    FALSE_POSITIVE: ["NORMAL"],
    WAIT: ["CONFIRMED_INCIDENT", "NORMAL"],
    CONFIRMED_INCIDENT: ["OPEN_INCIDENT", "RESOLVED"],
    OPEN_INCIDENT: ["RESOLVED"],
    RESOLVED: ["NORMAL"]
};

export class InMemoryIncidentStateMachine {
    constructor(
        private store: InMemoryIncidentStateStore,
        private eventStore: InMemoryIncidentEventStore
    ) {}

    getCurrent(entity: string): IncidentState | null {
        const rec = this.store.get(entity);
        return rec?.state ?? null;
    }

    getTimeline(entity: string): IncidentEvent[] {
        return this.eventStore.listByEntity(entity)
    }

    transition(entity: string, metricName: string | undefined, next: IncidentState, note?: string) {
        const entityBankName = normalizeBankEntity(entity).toLowerCase()
        const currentRec = this.store.get(entityBankName);
        const current: IncidentState = currentRec?.state ?? "NORMAL";
        const allowed = allowedTransitions[current] ?? [];
        console.log(entityBankName, next, allowed);

        if (next === "RESOLVED" || next === "NORMAL") {
            this.apply(entityBankName, metricName, next, note);
            return true;
        }

        if (!allowed.includes(next)) {
            // not allowed transition
            return false;
        }

        console.log(allowed, current, entityBankName);
        this.apply(entityBankName, metricName, next, note);
        return true;
    }

    formatMessage(entity: string, events: IncidentEvent[]): string {
        const header = `INCIDENT BIFAST ${entity}\n`
        const lines = events.map(e => {
            const time = new Date(e.ts)
                .toTimeString()
                .slice(0,5)
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