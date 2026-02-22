export function stripKeyPrefix(key: string, value: unknown) {
    if (typeof value !== "string") return value
    return value.startsWith(key)
        ? value.slice(key.length)
        : value
}