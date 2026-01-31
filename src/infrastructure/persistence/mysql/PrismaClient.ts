import { PrismaClient } from '@prisma/client'
let prisma: PrismaClient;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

export function getPrismaClient(): PrismaClient {
    if (!prisma) {
        throw new Error("Prisma client not set");
    }
    return prisma;
}