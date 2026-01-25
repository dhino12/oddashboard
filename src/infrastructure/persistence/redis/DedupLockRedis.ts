import { DedupLock } from "../../../application/ports/DedupLock";
import { getRedisClient } from "./RedisClient";

export class DedupLockRedis implements DedupLock {
    async acquire(key: string, ttlMs: number) {
        const redis = getRedisClient()
        const ok = await redis.set(`lock:${key}`,"1","PX",ttlMs,"NX");
        return ok === "OK";
    }
    async release(key: string) {
        const redis = getRedisClient()
        await redis.del(`lock:${key}`);
    }
}
