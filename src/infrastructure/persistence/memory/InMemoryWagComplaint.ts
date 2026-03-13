export interface WagComplaintRecord {
    entity: string,
    timestamp: number,
    message: string
}

export class InMemoryWagComplaintStoreRepository {
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
            console.log('IF RECORD - '  + filtered.length);
            this.data.delete(entity)
        }   else {
            console.log('ELSE RECORD - ' + filtered.length);
            this.data.set(entity, filtered)
        }
    }

    hasRecent(entity: string): boolean {
        const arr = this.data.get(entity);
        if (arr == undefined) {
            console.log(`hasRecent InMemoryWagComplaintStore -> arr undefined`);
            return false
        }
        const filtered = arr.filter(r => Date.now() - r.timestamp <= this.windowMs)
        console.log(filtered.length);
        return !!arr && filtered.length > 1;
    }
}