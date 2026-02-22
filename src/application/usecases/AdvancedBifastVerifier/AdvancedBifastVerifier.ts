
import { Logger } from "winston";
import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { ElasticMetricService, MetricFetchResult } from "../../../infrastructure/external/elastic/ElasticMetricService";
import { WagHelpdeskService } from "../../../infrastructure/external/elastic/WagHelpdeskService";
import { NauraGateway } from "../../ports/NauraGateway";
import { AdvancedBifastPolicy } from "../../../domain/policy/AdvancedBifastPolicy";

export class AdvancedBifastVerifier {
    constructor(
        private readonly elasticSvc: ElasticMetricService,
        private readonly wagSvc: WagHelpdeskService,
        private readonly incidentRepo: IncidentRepository,
        private readonly logger: Logger,
    ) {}
    async verfiy (source: string, entity: string): Promise<{decision: "WAIT" | "FALSE_POSITIVE" | "CONFIRMED_INCIDENT", metrics: MetricFetchResult}> {
        const metrics = await this.elasticSvc.fetch(source, entity);
        const hasComplaint = await this.wagSvc.hasComplaint(entity);
        const hasOpen = await this.incidentRepo.hasOpenIncident(source, entity);
        const decisionPolicy = AdvancedBifastPolicy.decide({
            overallLevel: metrics.overallLevel,
            hasComplaint,
            hasOpenIncident: hasOpen,
            criticalSource: metrics.signals
                .filter(s => s.trend?.level === "CRITICAL")
                .map(s => s.source)
        })
        this.logger.info(decisionPolicy, metrics)
        return {decision: decisionPolicy, metrics}
    }
}