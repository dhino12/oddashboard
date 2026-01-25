export type Source = "BIFAST" | "QRIS";
export type MonitoringStatus = "OPEN" | "CLOSED" | "SUCCESS" | "FAILURE"

export class MonitoringEvent {
    constructor(
        public readonly id: string,
        public readonly source: Source,
        public readonly entity: string,
        public readonly status: MonitoringStatus,
        public readonly occurredAt: number
    ) {}
}