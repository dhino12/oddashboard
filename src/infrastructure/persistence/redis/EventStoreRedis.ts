import { EventStore } from "../../../application/ports/EventStore";
import { MonitoringEvent } from "../../../domain/monitoring/MonitoringEvent";
import { getRedisClient } from "./RedisClient";

const TWO_HOURS = 2 * 60 * 60 * 1000;

export class EventStoreRedis implements EventStore {
    async append(event: MonitoringEvent) {
        const redis = getRedisClient();
        const key = `events:${event.source}:${event.entity}`;
        // zadd score=occurredAt member=event.id
        await redis.zadd(key, event.occurredAt.toString(), event.id);
        // cleanup
        await redis.zremrangebyscore(key, 0, Date.now() - TWO_HOURS);
    }

    async countInWindow(source: string, entity: string, windowMs: number) {
        const redis = getRedisClient();
        const key = `events:${source}:${entity}`;
        const min = Date.now() - windowMs;
        const max = Date.now();
        const count = await redis.zcount(key, min.toString(), max.toString());
        return Number(count);
    }

    async cleanupSourceOlderThan(source: string, entity: string, olderThanMs: number) {
        const redis = getRedisClient();
        const key = `events:${source}:${entity}`;
        await redis.zremrangebyscore(key, 0, Date.now() - olderThanMs);
    }
    cleanupOlderThan(ms: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
