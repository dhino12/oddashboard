// src/infrastructure/logger/WinstonLogger.ts
import winston, { createLogger, format, transports } from "winston";


export function initLogger() {
    const { combine, metadata, timestamp, printf, colorize, simple } = format;
    const logger = winston.createLogger({
        level: "info",
        format: combine(
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss' // Customize timestamp format
            }),
            metadata({fillExcept: ["message", "level", "timestamp"]}),
            printf((info) => {
                return JSON.stringify({
                    level: info.level,
                    timestamp: info.timestamp,
                    message: info.message,
                    data: info.metadata,
                })
            }),
        ),
        transports: [
            new transports.Console(),
            new transports.File({ filename: "open_incident.log" })
        ],
    })
    return logger
}