import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client'
import "dotenv/config";

let prisma: PrismaClient | null = null;

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.HOST,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, // for azure
        trustServerCertificate: false // change to true for local dev / self-signed certs
    }
}

export function initPrisma(){
    const adapter = new PrismaMariaDb(
        {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DATABASE_NAME,
            host: "localhost",
            port: 3306,
            connectionLimit: 5
        },
        // { database: 'open_incident' } // Optional: specify the default schema/database
    )
    prisma = new PrismaClient({
        adapter,
        log:  [
            {
                emit: "event",
                level: "query"
            },
            {
                emit: "event",
                level: "error"
            },
            {
                emit: "event",
                level: "info"
            },
            {
                emit: "event",
                level: "warn"
            }
        ]
    });
    return prisma;
}
