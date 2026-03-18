
import { Logger } from "winston";
import { IncidentRepository } from "../../../domain/incident/IncidentRepository";
import { NauraGateway } from "../../ports/NauraGateway";
import { AdvancedBifastPolicy } from "../../../domain/policy/AdvancedBifastPolicy";
import { ElasticMetricClient, MetricFetchResult } from "../../../infrastructure/external/elastic/ElasticMetricClient";
import { WagHelpdeskClient } from "../../../infrastructure/external/elastic/WagHelpdeskClient";
import { InMemoryIncidentStateMachine } from "../../../infrastructure/persistence/memory/InMemoryIncidentStateMachine";
import { StateTrackerUseCase } from "../StateTrackerUseCase/StateTrackerUseCase";

export class AdvancedBifastVerifier {
    constructor(
        private readonly elasticSvc: ElasticMetricClient,
        private readonly wagSvc: WagHelpdeskClient,
        private readonly incidentRepo: IncidentRepository,
        private readonly stateTrackerUseCase: StateTrackerUseCase,
        private readonly logger: Logger,
    ) {}
    async verfiy (source: string, entity: string, options?: {interval: number, isOpen: boolean}): Promise<{decision: "WAIT" | "FALSE_POSITIVE" | "CONFIRMED_INCIDENT", metrics: MetricFetchResult}> {
        const metrics = await this.elasticSvc.fetch(source, entity, options);
        const hasComplaint = await this.wagSvc.hasComplaint(entity);
        const hasTotalComplaint = await this.wagSvc.hasTotalComplaint(entity);
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
        this.logger.info("[AdvancedBifastVerifier:verify]", {decisionPolicy})
        this.logger.info("[AdvancedBifastVerifier:verify]", {data_metrics: metrics.signals.filter(s => s.trend?.level === "CRITICAL").map(d => `${d.source} - ${d.trend?.trend}`)})
        this.stateTrackerUseCase.setTransition(entity, decisionPolicy, criticalSource, hasTotalComplaint)
        return {decision: decisionPolicy, metrics}
    }
}