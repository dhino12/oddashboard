export class MonitoringState {
    constructor(
        public readonly lastStatus: "OPEN" | "CLOSED" | null,
        public readonly lastChangedAt: number
    ) {}
}
