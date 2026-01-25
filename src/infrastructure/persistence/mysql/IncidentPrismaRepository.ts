import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { Incident } from "../../../domain/incident/Incident";
import { getPrismaClient } from "./PrismaClient";

export class IncidentPrismaRepository implements IncidentRepository {
    async hasOpenIncident(source: string, entity: string) {
        const prisma = getPrismaClient();
        const row = await prisma.incident.findFirst({ where: { source, entity, status: "OPEN" } });
        return !!row;
    }
    async create(inc: Incident) {
        const prisma = getPrismaClient();
        await prisma.incident.create({
        data: {
            id: inc.id,
            source: inc.source,
            entity: inc.entity,
            reason: inc.reason,
            status: inc.status,
            openedAt: new Date(inc.openedAt),
        },
        });
    }
    async listOpenIncidents() {
        const prisma = getPrismaClient();
        const rows = await prisma.incident.findMany({ where: { status: "OPEN" } });
        return rows.map((r: any) => new Incident(r.id, r.source, r.entity, r.reason, r.status as any, r.openedAt.getTime(), r.resolvedAt?.getTime()));
    }
    async save(inc: Incident) {
        const prisma = getPrismaClient();
        await prisma.incident.update({ where: { id: inc.id }, data: { status: inc.status, resolvedAt: inc.resolvedAt ? new Date(inc.resolvedAt) : null } });
    }
}
