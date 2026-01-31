export const ENV = {
    REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    DATABASE_URL: process.env.DATABASE_URL || "mysql://user:pass@localhost:3306/db",
    SLIDING_WINDOW_MS: Number(process.env.SLIDING_WINDOW_MS) || 60 * 60 * 1000,
    STABLE_OPEN_MS: Number(process.env.STABLE_OPEN_MS) || 15 * 60 * 1000,
    DEDUP_LOCK_TTL_MS: Number(process.env.DEDUP_LOCK_TTL_MS) || 5 * 60 * 1000,
    REMEDY_BASE: process.env.REMEDY_BASE || "https://10.254.152.105:8443/remedy",
    REMEDY_USER: process.env.REMEDY_USER || "user",
    REMEDY_PASS: process.env.REMEDY_PASS || "pass",
    ALERT_WA_NUMBER: process.env.ALERT_WA_NUMBER || "6282191029737@s.whatsapp.net"
};