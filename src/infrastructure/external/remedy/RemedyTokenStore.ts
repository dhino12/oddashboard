import { getRedisClient } from "../../persistence/redis/RedisClient";

const KEY = "token:remedy";

export class RemedyTokenStore {
    async getToken() {
        const redis = getRedisClient()
        const raw = await redis.get(KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // parsed.exp is epoch seconds
        if (parsed.exp * 1000 <= Date.now()) return null;
        return parsed.token;
    }

    async saveToken(token: string, exp: number) {
        const redis = getRedisClient()
        const ttlMs = Math.max(0, exp * 1000 - Date.now());
        await redis.set(KEY, JSON.stringify({ token, exp }), "PX", ttlMs || 60 * 60 * 1000);
    }
}
