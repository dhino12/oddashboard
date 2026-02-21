// src/infrastructure/logger/WinstonLogger.ts
import winston, { createLogger, format, transports } from "winston";


export function initLogger() {
    const { combine, json, timestamp, printf, colorize, simple } = format;
    const logger = winston.createLogger({
        level: "info",
        format: combine(
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss' // Customize timestamp format
            }),
            json()
        ),
        transports: [
            new transports.Console(),
            new transports.File({ filename: "open_incident.log" })
        ],
    })
    return logger
}