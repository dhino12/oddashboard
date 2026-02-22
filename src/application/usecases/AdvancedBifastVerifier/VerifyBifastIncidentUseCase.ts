import { Incident } from "../../../domain/incident/Incident";
import { v4 as uuidv4 } from "uuid";
import { AdvancedBifastVerifier } from "./AdvancedBifastVerifier";
import { now, timeFormatDraft, timeFormatStatusUpdate } from "../../../utils/Time";
import { NauraGateway } from "../../ports/NauraGateway";
import { IncidentRepository } from "../../../domain/incident/IncidentRepository";

export class VerifyBifastIncidentUseCase {
    constructor (
        private readonly verifier: AdvancedBifastVerifier,
        private readonly nauraGateway: NauraGateway,
        private readonly incidentRepo: IncidentRepository,
    ) {}

    async execute(source: string, entity: string) {
        const resultVerify = await this.verifier.verfiy(source, entity);
        if (resultVerify.decision !== "CONFIRMED_INCIDENT") {
            return resultVerify.decision
        }
        console.log("CONFIRM_INCIDENT");
        const reasons = resultVerify.metrics.signals
            .filter(s => s.trend?.level === "CRITICAL")
            .map(s => {s.source, s.trend?.trend, s.trend?.level})
            .join("_")
        
        const currentTime = now()
        const idDraft = uuidv4()
        const incident = new Incident(
            idDraft,
            source, // app_name (BIFAST / QRIS)
            entity, // nama_bank or nama_qris
            `Unstable state detected (${4000} flaps) - ` + reasons,
            {
                bankName: entity.toLowerCase(),
                incidentNumber: "INC_TEST_AUTOMATION",
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
        return resultVerify.decision
    }
}