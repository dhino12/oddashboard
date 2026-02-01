import { EventStore } from "../../ports/EventStore";

export class CleanupMonitoringJob {
    constructor(private readonly repo: EventStore) {}
    async execute(retentionMs: number) {
        return await this.repo.cleanupOlderThan(retentionMs)
    }
}