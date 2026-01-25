export interface DedupLock {
    acquire(key: string, ttlMs: number): Promise<boolean>;
    release?(key: string): Promise<void>;
}