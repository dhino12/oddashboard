
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
        let noteMessage = `total complaint: ${hasTotalComplaint}`
        if (decisionPolicy == "CONFIRMED_INCIDENT") {
            noteMessage = `INCIDENT HAS BEEN CONFIRMED`
        } else if (decisionPolicy == "FALSE_POSITIVE") {
            noteMessage = ""
        } else {
            noteMessage = noteMessage
        }
        const current = this.stateMachineTrackerRepo.getCurrentState(entity)
        this.logger.info(decisionPolicy, metrics.signals.filter(s => s.trend?.level === "CRITICAL"))
        if (current === decisionPolicy && decisionPolicy !== "WAIT")  {
            return {decision: decisionPolicy, metrics}
        }
        if (decisionPolicy == "CONFIRMED_INCIDENT" && current == "WAIT") {
            this.stateMachineTrackerRepo.transition(entity, criticalSource.join(", "), "WAIT", `total complaint: ${hasTotalComplaint}`)
        }
        this.stateMachineTrackerRepo.transition(entity, criticalSource.join(", "), decisionPolicy, noteMessage)
        return {decision: decisionPolicy, metrics}
    }
}