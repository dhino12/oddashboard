import { MonitoringStateStore } from "../../../application/ports/MonitoringStateStore";
import { MonitoringState } from "../../../domain/monitoring/MonitoringState";
import { Source } from "../../../domain/monitoring/MonitoringEvent"; 
import { getRedisClient } from "./RedisClient";

const STATE_TTL_MS =
  Number(process.env.MONITORING_STATE_TTL_MS) || 2 * 60 * 60 * 1000;

export class MonitoringStateRedis implements MonitoringStateStore {
    private key(source: Source, entity: string): string {
        return `monitoring:state:${source}:${entity}`;
    }

    async get(source: Source,entity: string): Promise<MonitoringState | null> {
        const redis = getRedisClient()
        const raw = await redis.get(this.key(source, entity));
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            return new MonitoringState(
                parsed.lastStatus,
                parsed.lastChangedAt
            );
        } catch {
            // corrupted data → treat as no state
            return null;
        }
    }

    async set(source: Source,entity: string,state: MonitoringState): Promise<void> {
        const redis = getRedisClient()
        await redis.set(
            this.key(source, entity),
            JSON.stringify({
                lastStatus: state.lastStatus,
                lastChangedAt: state.lastChangedAt,
            }),
            "PX",
            STATE_TTL_MS
        );
    }

    async delete(source: Source, entity: string): Promise<void> {
        const redis = getRedisClient()
        await redis.del(this.key(source, entity));
    }
}
