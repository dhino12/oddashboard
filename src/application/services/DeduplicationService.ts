import { DedupLock } from "../ports/DedupLock";

export class DeduplicationService {
    constructor(private lock: DedupLock) {}

    async acquireIncidentLock(source: string, entity: string, ttlMs: number) {
        return this.lock.acquire(`incident:${source}:${entity}`, ttlMs);
    }
}
