import { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "../../persistence/mysql/PrismaClient";
import { getRedisClient } from "../../persistence/redis/RedisClient";

const KEY = "token:remedy";

export class RemedyTokenStore {
    private prisma: PrismaClient
    constructor() {
        this.prisma = getPrismaClient()
    }
    async getToken() {
        const row = await this.prisma.userToken.findUnique({
            where: {key: KEY}
        })
        if (!row) return null;
        if (row.expires_at <= Date.now()) {
            return null;
        }
        return row.token
    }

    async saveToken(token: string, exp: number, username: string) {
        await this.prisma.userToken.upsert({
            where: {
                key: KEY
            }, 
            create: {
                key: KEY,
                token, username, expires_at: exp * 1000
            },
            update: {
                token, expires_at: exp * 1000, username
            }
        })
    }

    async cleanUp() {
        await this.prisma.userToken.deleteMany({
            where: {
                expires_at: { lt: Date.now() }
            }
        });
    }
}
