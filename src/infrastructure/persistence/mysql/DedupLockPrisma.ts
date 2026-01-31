import { DedupLock } from "../../../application/ports/DedupLock";

export class DedupLockDb implements DedupLock {
    async acquire(key: string, ttlMs: number): Promise<boolean> {
        return true
    }
}