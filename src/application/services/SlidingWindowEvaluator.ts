import { EventStore } from "../ports/EventStore";

export class SlidingWindowEvaluator {
    constructor(private eventStore: EventStore, private windowMs: number) {}

    async countFailures(source: string, entity: string) {
        return await this.eventStore.countInWindow(source, entity, this.windowMs);
    }

    async isThresholdExceeded(source: string, entity: string, threshold: number) {
        const count = await this.countFailures(source, entity);
        return count >= threshold;
    }
}