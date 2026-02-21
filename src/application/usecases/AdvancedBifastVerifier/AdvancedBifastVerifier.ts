import { v4 as uuidv4 } from "uuid";
import { Logger } from "winston";
import { Incident } from "../../../domain/incident/Incident";
import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { ElasticMetricService } from "../../../infrastructure/external/elastic/ElasticMetricService";
import { WagHelpdeskService } from "../../../infrastructure/external/elastic/WagHelpdeskService";
import { NauraGateway } from "../../ports/NauraGateway";
import { now, timeFormatDraft, timeFormatStatusUpdate } from "../../../utils/Time";

export class AdvancedBifastVerifier {
    constructor(
        private readonly elasticSvc: ElasticMetricService,
        private readonly wagSvc: WagHelpdeskService,
        private readonly nauraGateway: NauraGateway,
        private readonly incidentRepo: IncidentRepository,
        private readonly logger: Logger,
    ) {}
    async verfiy (source: string, entity: string): Promise<"WAIT" | "FALSE_POSITIVE" | "CONFIRMED_INCIDENT"> {
        const metrics = await this.elasticSvc.fetch(source, entity);
        if (metrics.overallLevel == null) {
            this.logger.info("AdvancedBifastVerify: ", metrics)
            return "WAIT"
        }
        
        if (metrics.overallLevel !== "CRITICAL") {
            this.logger.info("AdvancedBifastVerify_FALSE_POSITIVE: ", metrics)
            return "FALSE_POSITIVE"
        }
        
        const hasComplaint = await this.wagSvc.hasComplaint(entity);
        if (!hasComplaint) {
            this.logger.info("AdvancedBifastVerify_WAIT_FORCOMPLAINT_WAG: ", hasComplaint)
            return "WAIT"
        }
        
        const hasOpen = await this.incidentRepo.hasOpenIncident(source, entity);
        if (hasOpen) {
            this.logger.info("AdvancedBifastVerify_INCIDENT_HAS_BEEN_CREATED_IN_DB: ", hasOpen)
            return "CONFIRMED_INCIDENT"
        }
        
        // contoh policy rule eksplisit
        const criticalSignals = metrics.signals.filter(s => s.trend?.level === "CRITICAL") 
        if (
            criticalSignals.some(s => s.source === "BIFAST_TX") &&
            criticalSignals.some(s => s.source === "BIFAST_TX_CIHUB")
        ) {
            // benar-benar incident berat
        }
        this.logger.info("AdvancedBifastVerify_INCIDENT_CREATED 📝: ", criticalSignals)
        
        const currentTime = now()
        const idDraft = uuidv4()
        const incident = new Incident(
            idDraft,
            source, // app_name (BIFAST / QRIS)
            entity, // nama_bank or nama_qris
            `Unstable state detected (${2000} flaps)`,
            {
                bankName: entity.toLowerCase(),
                incidentNumber: "",
                incidentDescription: `Gangguan layanan transaksi pada BIFAST ${entity.toUpperCase()}`,
                impactedApplication: "BIFAST",
                priority: "MEDIUM",
                typeIncident: `3rd Party`,
                impact: `Nasabah tidak dapat melakukan transaksi pada BIFAST ${entity.toUpperCase()}`,
                suspect: `Gangguan disisi ${entity.toUpperCase()}`,
                incTimestamp: timeFormatDraft(`${currentTime}`.substring(0,16)), 
                incTimestamps: currentTime,
                incTimestampNextUpdate: timeFormatStatusUpdate(`${currentTime}`.substring(0,16)),
                closedTimestamp: `${currentTime}`.substring(0,16),
                estimation: "Belum Dapat Ditentukan",
                picConfirmation: "Tim Monitoring",
                statusNextUpdate: `[${timeFormatStatusUpdate(`${currentTime}`.substring(0,16))}] Saat ini untuk sementara waktu dilakukan penutupan layanan transaksi pada BIFAST ${entity.toUpperCase()}`,
                status: "Pending",
            },
        );
        await this.incidentRepo.create(incident);
        await this.nauraGateway.postToNaura({
            idDraft,
            incidentNumber: incident.metadata.incidentNumber,
            incidentDescription: incident.metadata.incidentDescription,
            impactedApplications: incident.metadata.impactedApplication,
            priority: incident.metadata.priority,
            typeIncident: incident.metadata.typeIncident,
            impact: incident.metadata.impact,
            suspect: incident.metadata.suspect,
            waktuTerindikasi: incident.metadata.incTimestamp,
            durasiGangguan: incident.metadata.estimation,
            konfirmasiPIC: incident.metadata.picConfirmation,
            status: incident.metadata.status,
            solusiNextUpdate: incident.metadata.statusNextUpdate,
            ticketStatus: incident.metadata.status,
            officerName: "automation_test",
        })
        return "CONFIRMED_INCIDENT" 
    }
}