import { InMemoryWagComplaintStoreRepository } from "../../persistence/memory/InMemoryWagComplaint";

// infrastructure/external/WagHelpdeskService.ts
export class WagHelpdeskClient {
    constructor(
        private readonly store: InMemoryWagComplaintStoreRepository
    ) {}

    async hasComplaint(entity: string): Promise<boolean> {
        return this.store.hasRecent(entity)
    }
}
