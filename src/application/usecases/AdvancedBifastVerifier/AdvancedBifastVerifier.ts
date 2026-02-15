import { Incident } from "../../../domain/incident/Incident";
import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { ElasticMetricService } from "../../../infrastructure/external/elastic/ElasticMetricService";
import { WagHelpdeskService } from "../../../infrastructure/external/elastic/WagHelpdeskService";

export class AdvancedBifastVerifier {
    constructor(
        private readonly elasticSvc: ElasticMetricService,
        private readonly wagSvc: WagHelpdeskService,
        private readonly incidentRepo: IncidentRepository
    ) {}
    async verfiy (source: string, entity: string): Promise<"WAIT" | "FALSE_POSITIVE" | "CONFIRMED_INCIDENT"> {
        const metrics = await this.elasticSvc.fetch(source, entity);
        if (metrics.overallLevel == null) {
            return "WAIT"
        }
        
        if (metrics.overallLevel !== "CRITICAL") {
            return "FALSE_POSITIVE"
        }

        const hasComplaint = await this.wagSvc.hasComplaint(entity);
        if (!hasComplaint) {
            return "WAIT"
        }

        const hasOpen = await this.incidentRepo.hasOpenIncident(source, entity);
        if (hasOpen) {
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
        // await this.incidentRepo.create()
        return "CONFIRMED_INCIDENT" 
    }
}