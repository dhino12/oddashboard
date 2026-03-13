import { Logger } from "winston";
import { InMemoryWagComplaintStoreRepository } from "../../../infrastructure/persistence/memory/InMemoryWagComplaint";
import { BifastVerificationJob } from "../../../infrastructure/scheduler/BifastVerificationJob";
import { CloseRecoveryScheduler } from "../../../infrastructure/scheduler/CloseRecoveryBiFastScheduler";
import { MonitoringStateStore } from "../../ports/MonitoringStateStore";
import { ProcessMonitoringEvent } from "../ProcessMonitoringEvent/ProcessMonitoringEvent";
import { detectGangguan } from "../../../infrastructure/consumers/whatsapp/ComplaintMessageParser";
import { findBifastBankNameByAbbreviation } from "../../../config/bifastlist";
import { parseBifastMessage } from "../../../infrastructure/consumers/whatsapp/MessageParser";
import { SchedulerPort } from "../../ports/SchedulerPort";
import { ENV } from "../../../config/env";
import { InMemoryIncidentStateMachine } from "../../../infrastructure/persistence/memory/InMemoryIncidentStateMachine";

// src/application/usecases/BifastMessageHandler.ts
export type RawWAEnvelope = {
    id: string;
    from: string;
    body: string;
    timestamp: number;
};

export class BifastMessageHandler {
    constructor(
        private readonly processor: ProcessMonitoringEvent,
        private readonly closeRecoveryScheduler: SchedulerPort,
        private readonly closeBiFastVerifyScheduler: SchedulerPort,
        private readonly stateStore: MonitoringStateStore,
        private readonly wagComplaintRepo: InMemoryWagComplaintStoreRepository,
        private readonly incStateMachineRepo: InMemoryIncidentStateMachine,
        private readonly logger: Logger
    ) {}

    async handle(envelope: RawWAEnvelope): Promise<void> {
        const { id, from, body, timestamp } = envelope;

        if (body.includes("/state")) {
            const timeline = this.incStateMachineRepo.getTimeline("BSI")
            const message = this.incStateMachineRepo.formatMessage("BSI", timeline)
            console.log(message);
        }
        
        if (from === ENV.LISTEN_GROUP_CHAT_BIFAST_HELPDESK ||
            from === ENV.LISTEN_GROUP_CHAT_TEST_BROADCAST) {
            const parsedComplaint = detectGangguan(body);
            const complainEntity = parsedComplaint.complainerEntity?.toLowerCase();
            const detectMandiri = complainEntity === "mandiri"
                ? parsedComplaint.reportedBank
                : parsedComplaint.complainerEntity;

            if (detectMandiri) {
                const bankAbbr = findBifastBankNameByAbbreviation(detectMandiri?.toUpperCase() ?? "");
                const prevState = await this.stateStore.get("BIFAST", bankAbbr ?? "");
                console.log(detectMandiri);
                console.log(prevState);
                
                if (prevState && prevState.lastStatus === "CLOSED") {
                    await this.wagComplaintRepo.record(detectMandiri?.toUpperCase() ?? "", parsedComplaint.message ?? "");
                    this.logger.info("💾 Recorded complaint for " + detectMandiri);
                }
            }
        }

        const parsed = parseBifastMessage(body || "");
        if (!parsed) return;

        const dto = {
            id,
            source: "BIFAST" as const,
            entity: parsed.entity,
            status: parsed.status,
            occurredAt: timestamp,
        };

        const prevState = await this.stateStore.get(dto.source, dto.entity);
        if (dto.status === "CLOSED") {
            if (prevState?.lastStatus !== "CLOSED") {
                this.closeRecoveryScheduler.start(dto.source, dto.entity);
                this.closeBiFastVerifyScheduler.start(dto.source, dto.entity);
                this.logger.info(`Started schedulers for ${dto.source}:${dto.entity}`);
            } else {
                this.logger.info(`CLOSED received but prevState already CLOSED for ${dto.entity} — skip starting scheduler`);
            }
        }

        if (dto.status === "OPEN") {
            this.closeRecoveryScheduler.stop(dto.source, dto.entity);
            this.closeBiFastVerifyScheduler.stop(dto.source, dto.entity);
            this.logger.info(`Stopped schedulers for ${dto.source}:${dto.entity}`);
        }
        await this.processor.execute(dto);
    }
}