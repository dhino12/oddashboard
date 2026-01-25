// src/infrastructure/logger/WinstonLogger.ts
import winston from "winston";

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

export function initLogger() {
    const logger = winston.createLogger({
        level: "info",
        transports: [
            new winston.transports.Console({format: winston.format.simple()})
        ]
    })
    return logger
}