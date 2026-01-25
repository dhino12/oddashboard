import Redis from "ioredis";

let redis: Redis;

export function setRedisClient(client: Redis) {
    redis = client;
}

export function getRedisClient(): Redis {
    if (!redis) {
        throw new Error("Redis client not set");
    }
    return redis;
}
