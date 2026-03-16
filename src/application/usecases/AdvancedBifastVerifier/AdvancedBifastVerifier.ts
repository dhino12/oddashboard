
import { Logger } from "winston";
import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { NauraGateway } from "../../ports/NauraGateway";
import { AdvancedBifastPolicy } from "../../../domain/policy/AdvancedBifastPolicy";
import { ElasticMetricClient, MetricFetchResult } from "../../../infrastructure/external/elastic/ElasticMetricClient";
import { WagHelpdeskClient } from "../../../infrastructure/external/elastic/WagHelpdeskClient";
import { InMemoryIncidentStateMachine } from "../../../infrastructure/persistence/memory/InMemoryIncidentStateMachine";

export class AdvancedBifastVerifier {
    constructor(
        private readonly elasticSvc: ElasticMetricClient,
        private readonly wagSvc: WagHelpdeskClient,
        private readonly incidentRepo: IncidentRepository,
        private readonly stateMachineTrackerRepo: InMemoryIncidentStateMachine,
        private readonly logger: Logger,
    ) {}
    async verfiy (source: string, entity: string, options?: {interval: number}): Promise<{decision: "WAIT" | "FALSE_POSITIVE" | "CONFIRMED_INCIDENT", metrics: MetricFetchResult}> {
        const metrics = await this.elasticSvc.fetch(source, entity, options);
        const hasComplaint = await this.wagSvc.hasComplaint(entity);
        const hasOpen = await this.incidentRepo.hasOpenIncident(source, entity);
        const criticalSource = metrics.signals
                .filter(s => s.trend?.level === "CRITICAL")
                .map(s => s.source)
        const decisionPolicy = AdvancedBifastPolicy.decide({
            overallLevel: metrics.overallLevel,
            hasComplaint,
            hasOpenIncident: hasOpen,
            criticalSource
        }, this.logger)
        if (decisionPolicy == "CONFIRMED_INCIDENT") {
            this.stateMachineTrackerRepo.transition(entity, criticalSource.join(", "), "CONFIRMED_INCIDENT", "")
        } else if (decisionPolicy == "FALSE_POSITIVE") {
            this.stateMachineTrackerRepo.transition(entity, criticalSource.join(", "), "FALSE_POSITIVE", "")
        } else {
            this.stateMachineTrackerRepo.transition(entity, criticalSource.join(", "), "WAIT", "total complaint: " + 2)
        }
        this.logger.info(decisionPolicy, metrics.signals.filter(s => s.trend?.level === "CRITICAL"))
        return {decision: decisionPolicy, metrics}
    }
}