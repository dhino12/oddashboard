export type IncidentStatus = "OPEN" | "RESOLVED";
export class Incident {
    constructor(
        public id: string,
        public source: string,
        public entity: string,
        public reason: string,
        public status: IncidentStatus = "OPEN",
        public openedAt: number = Date.now(),
        public resolvedAt?: number
    ) {}

    resolve() {
        this.status = "RESOLVED";
        this.resolvedAt = Date.now()
    }
}