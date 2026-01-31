import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { Incident } from "../../../domain/incident/Incident";
import { getPrismaClient } from "./PrismaClient";
import { PrismaClient } from '@prisma/client'

export class IncidentPrismaRepository implements IncidentRepository {
    private prisma: PrismaClient
    constructor() {
        this.prisma = getPrismaClient();
    }
    async hasOpenIncident(source: string, entity: string) {
        const row = await this.prisma.incidents.findFirst({ where: { source, entity, status: "OPEN" } });
        return !!row;
    }
    async create(inc: Incident) {
        await this.prisma.incidents.create({
            data: {
                id: inc.id,
                source: inc.source,
                entity: inc.entity,
                reason: inc.reason,
                status: inc.status,
                created_at: new Date(inc.openedAt),
            },
        });
    }
    async listOpenIncidents() {
        const prisma = getPrismaClient();
        const rows = await prisma.incidents.findMany({ where: { status: "OPEN" } });
        return rows.map((r) => new Incident(r.id, r.source, r.entity, r.reason, r.status as any, r.created_at.getTime(), r.resolved_at?.getTime()));
    }
    async save(inc: Incident) {
        const prisma = getPrismaClient();
        await prisma.incidents.update({ where: { id: inc.id }, data: { status: inc.status, resolved_at: inc.resolvedAt ? new Date(inc.resolvedAt) : null } });
    }
    async findOpenIncident(source: string, entity: string): Promise<Incident | null> {
        const row = await this.prisma.incidents.findFirst({
            where: { source, entity, status: "OPEN" }
        });

        if (!row) return null;

        return new Incident(
            row.id,
            row.source,
            row.entity,
            row.reason,
            row.status as any,
            row.created_at.getTime(),
            row.resolved_at?.getTime()
        );
    }
}
