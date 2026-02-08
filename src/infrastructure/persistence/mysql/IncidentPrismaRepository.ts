import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { Incident } from "../../../domain/incident/Incident";
import { getPrismaClient } from "./PrismaClient";
import { PrismaClient } from '@prisma/client'
import { IncidentDTO } from "../../../application/usecases/ProcessMonitoringEvent/ProcessMonitoringEventDTO";
import { timeFormatDraft, timeFormatStatusUpdate, toDateTimeSeconds } from "../../../utils/Time";

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
                incNumber: inc.metadata.incidentNumber ?? "INC_TEST",
                source: inc.source,
                entity: inc.entity,
                reason: inc.reason,
                status: inc.status,
                incTimestamp: new Date(inc.metadata.incTimestamps),
                created_at: new Date(inc.openedAt),
            },
        });
    }
    async listOpenIncidents() {
        const rows = await this.prisma.incidents.findMany({ where: { status: "OPEN" } });
        return rows.map((r) => new Incident(r.id, r.source, r.entity, r.reason, {
            bankName: r.entity.toLowerCase(),
            incidentNumber: "",
            incidentDescription: `Gangguan layanan transaksi pada BIFAST ${r.entity}`,
            impactedApplication: "BIFAST",
            priority: "MEDIUM",
            typeIncident: `3rd Party`,
            impact: `Nasabah tidak dapat melakukan transaksi pada BIFAST ${r.entity}`,
            suspect: `Gangguan disisi ${r.entity}`,
            incTimestamp: timeFormatDraft(toDateTimeSeconds(r.incTimestamp)), 
            incTimestamps: toDateTimeSeconds(r.incTimestamp),
            incTimestampNextUpdate: timeFormatStatusUpdate(toDateTimeSeconds(r.incTimestamp)),
            closedTimestamp: toDateTimeSeconds(r.incTimestamp),
            estimation: "Belum Dapat Ditentukan",
            picConfirmation: "Tim Monitoring",
            statusNextUpdate: `[${timeFormatStatusUpdate(toDateTimeSeconds(r.incTimestamp))}] Saat ini untuk sementara waktu dilakukan penutupan layanan transaksi pada BIFAST ${r.entity}`,
            status: "Pending",
        } as IncidentDTO, r.status as any, r.incTimestamp.getTime(), r.resolved_at?.getTime()));
    }
    async save(inc: Incident) {
        await this.prisma.incidents.update({ where: { id: inc.id }, data: { status: inc.status, resolved_at: inc.resolvedAt ? new Date(inc.resolvedAt) : null } });
    }
    async delete(inc: Incident) {
        await this.prisma.incidents.delete({
            where: { id: inc.id, status: inc.status }
        })
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
            {
                bankName: row.entity.toLowerCase(),
                incidentNumber: "",
                incidentDescription: `Gangguan layanan transaksi pada BIFAST ${row.entity}`,
                impactedApplication: "BIFAST",
                priority: "MEDIUM",
                typeIncident: `3rd Party`,
                impact: `Nasabah tidak dapat melakukan transaksi pada BIFAST ${row.entity}`,
                suspect: `Gangguan disisi ${row.entity}`,
                incTimestamp: timeFormatDraft(`${row.created_at}`.substring(0,16)), 
                incTimestamps: `${row.created_at}`.substring(0,16),
                incTimestampNextUpdate: timeFormatStatusUpdate(`${row.created_at}`.substring(0,16)),
                closedTimestamp: `${row.created_at}`.substring(0,16),
                estimation: "Belum Dapat Ditentukan",
                picConfirmation: "Tim Monitoring",
                statusNextUpdate: `[${timeFormatStatusUpdate(`${row.created_at}`.substring(0,16))}] Saat ini untuk sementara waktu dilakukan penutupan layanan transaksi pada BIFAST ${row.entity}`,
                status: "Pending",
            },
            row.status as any,
            row.created_at.getTime(),
            row.resolved_at?.getTime()
        );
    }
}
