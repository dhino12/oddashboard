export class MonitoringState {
    constructor(
        public readonly lastStatus: "OPEN" | "CLOSED" | null | String,
        public readonly lastChangedAt: number,
        public readonly entity: string | null = null
    ) {}
}
