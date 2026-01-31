import { PrismaClient } from '@prisma/client'
import { EventStore } from "../../../application/ports/EventStore";
import { MonitoringEvent } from "../../../domain/monitoring/MonitoringEvent";
import { getPrismaClient } from "./PrismaClient";

export class EventStorePrisma implements EventStore {
    private prisma: PrismaClient

    constructor () {
        this.prisma = getPrismaClient()
    }
    async append(event: MonitoringEvent): Promise<void> {
        await this.prisma.monitoringEvents.create({
            data: {
                id: event.id,
                source: event.source,
                entity: event.entity,
                status: event.status,
                occurred_at: event.occurredAt
            }
        })
    }
    async countInWindow(source: string, entity: string, windowMs: number): Promise<number> {
        const since = Date.now() - windowMs;
        return await this.prisma.monitoringEvents.count({
            where: { source, entity, occurred_at: {gte: since} }
        })
    }
    async cleanupOlderThan(ms: number): Promise<void> {
        const cutOff = Date.now() - ms;
        await this.prisma.monitoringEvents.deleteMany({
            where: {occurred_at: { lt: cutOff }}
        })
    }
    cleanupSourceOlderThan(source: string, entity: string, olderThanMs: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
}