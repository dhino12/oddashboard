import { InMemoryWagComplaintStore } from "../../persistence/memory/InMemoryWagComplaint";

// infrastructure/external/WagHelpdeskService.ts
export class WagHelpdeskService {
    constructor(
        private readonly store: InMemoryWagComplaintStore
    ) {}

    async hasComplaint(entity: string): Promise<boolean> {
        return this.store.hasRecent(entity)
    }
}
