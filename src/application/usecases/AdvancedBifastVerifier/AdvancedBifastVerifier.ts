import { Incident } from "../../../domain/incident/Incident";
import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { ElasticMetricService, WagHelpdeskService } from "../../../infrastructure/external/elastic/ElasticMetricService";

export class AdvancedBifastVerifier {
    constructor(
        private readonly elasticSvc: ElasticMetricService,
        private readonly wagSvc: WagHelpdeskService,
        private readonly incidentRepo: IncidentRepository
    ) {}
    async verfiy (source: string, entity: string): Promise<"WAIT" | "FALSE_POSITIVE" | "CONFIRMED_INCIDENT"> {
        const metrics = await this.elasticSvc.fetch(source, entity);
        if (metrics.trend == null) {
            return "WAIT"
        }
        
        if (metrics.trend !== "CRITICAL") {
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

        // await this.incidentRepo.create()
        return "CONFIRMED_INCIDENT" 
    }
}