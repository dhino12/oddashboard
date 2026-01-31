import { PrismaClient } from '@prisma/client'
import { MonitoringStateStore } from "../../../application/ports/MonitoringStateStore";
import { Source } from "../../../domain/monitoring/MonitoringEvent";
import { MonitoringState } from "../../../domain/monitoring/MonitoringState";
import { getPrismaClient } from "./PrismaClient";

export class MonitoringStatePrisma implements MonitoringStateStore {
    private prisma: PrismaClient
    constructor () {
        this.prisma = getPrismaClient()
    }
    async get(source: Source, entity: string): Promise<MonitoringState | null> {
        const row = await this.prisma.monitoringState.findUnique({
            where: {
                source_entity: {source, entity}
            }
        })
        if (!row) return null;
        return new MonitoringState(
            row.last_status, Number(row.last_changed_at)
        )
    }
    async set(source: Source, entity: string, state: MonitoringState): Promise<void> {
        await this.prisma.monitoringState.upsert({
            where: {
                source_entity: {source, entity}
            },
            create: {
                source, entity,
                last_changed_at: state.lastChangedAt,
                last_status: `${state.lastStatus}`,
            },
            update: {
                last_status: `${state.lastStatus}`,
                last_changed_at: state.lastChangedAt,
            }
        })
    }
    async clear(source: Source, entity: string): Promise<void> {
        await this.prisma.monitoringState.delete({
            where: {
                source_entity: {source, entity}
            }
        })
    }
}