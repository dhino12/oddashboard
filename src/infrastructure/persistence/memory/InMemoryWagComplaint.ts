export interface WagComplaintRecord {
    entity: string,
    timestamp: number,
    message: string
}

export class InMemoryWagComplaintStore {
    private readonly windowMs = 5 * 60 * 1000;
    private readonly data = new Map<string, WagComplaintRecord[]>()
    
    record(entity: string, message: string) {
        const now = Date.now();
        const arr = this.data.get(entity) ?? [];
        
        arr.push({
            entity, timestamp: now, message
        })

        // sliding window cleanup after 5 minutes
        const filtered = arr.filter(r => now - r.timestamp <= this.windowMs)
        if (filtered.length == 0) {
            this.data.delete(entity)
        }   else {
            this.data.set(entity, filtered)
        }
    }

    hasRecent(entity: string): boolean {
        const arr = this.data.get(entity);
        return !!arr && arr.length > 0;
    }
}