import Redis from "ioredis"
import { ENV } from "./env"

let client: Redis | null = null
export async function initRedis() {
    client = new Redis(ENV.REDIS_URL);
    return client;
}

export function getRedis() {
    if (!client) throw new Error("Redis not initialized");
    return client;
}