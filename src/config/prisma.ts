import {PrismaClient} from '@prisma/client'

let prisma: PrismaClient | null = null;

export function initPrisma(){
    prisma = new PrismaClient();
    return prisma;
}

export function getPrisma() {
    if (!prisma) throw new Error("Prisma not initialized");
    return prisma
}