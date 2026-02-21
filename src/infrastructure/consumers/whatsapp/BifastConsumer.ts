// src/infrastructure/consumers/whatsapp/BifastConsumer.ts
import { WhatsAppClient, RawWhatsAppMessage } from "./WhatsappClient";
import { detectGangguanWithEntities, parseBifastMessage } from "./MessageParser";
import { ProcessMonitoringEvent } from "../../../application/usecases/ProcessMonitoringEvent/ProcessMonitoringEvent";
import { uuid } from "../../../utils/UUID";
import { CloseRecoveryScheduler } from "../../scheduler/CloseRecoveryBiFastScheduler";
import { ENV } from "../../../config/env";
import { MonitoringStateStore } from "../../../application/ports/MonitoringStateStore";
import { BifastVerificationJob } from "../../scheduler/BifastVerificationJob";
import { InMemoryWagComplaintStore } from "../../persistence/memory/InMemoryWagComplaint";
import { detectGangguan } from "./ComplaintMessageParser";

export class BifastConsumer {
    constructor(
        private wa: WhatsAppClient, 
        private processor: ProcessMonitoringEvent,
        private closeRecoveryScheduler: CloseRecoveryScheduler,
        private closeBiFastVerifyScheduler: BifastVerificationJob,
        private stateStore: MonitoringStateStore,
        private wagCompaint: InMemoryWagComplaintStore,
    ) {}

    async start() {
        this.wa.on("message", async (msg: RawWhatsAppMessage) => {
        try {
            if (
                msg.from != ENV.LISTEN_GROUP_CHAT_TEST_BROADCAST &&
                msg.from != ENV.LISTEN_GROUP_CHAT_BIFAST_MONITORING
            ) return
            
            const parsed = parseBifastMessage(msg.body || "");
            if (msg.from == ENV.LISTEN_GROUP_CHAT_TEST_BROADCAST) {
                const parsedCompaint = detectGangguan(msg.body)
                if (parsedCompaint.complainerEntity == null && parsedCompaint.reportedBank == null ) return
                const prevState = await this.stateStore.get(
                    "BIFAST",
                    parsedCompaint.complainerEntity?.toUpperCase() ?? ""
                )
                if (prevState?.entity?.toUpperCase() == parsedCompaint.complainerEntity?.toUpperCase()) {
                    this.wagCompaint.record(
                        parsedCompaint.complainerEntity ?? "",
                        parsedCompaint.message ?? ""
                    )
                }
            }
            if (!parsed) return;

            // Build DTO for ProcessMonitoringEvent
            // Use whatsapp message id if present for idempotency, else generate uuid
            const eventId = msg.id || uuid();
            const dto = {
                id: eventId,
                source: "BIFAST" as const,
                entity: parsed.entity,
                status: parsed.status,
                occurredAt: msg.timestamp ?? Date.now(),
            };
            console.log(dto.status);
            
            if (dto.status === "CLOSED") {
                const prevState = await this.stateStore.get(
                    dto.source,
                    dto.entity
                );
                if (prevState?.lastStatus != dto.status) {
                    console.log('masuk if');
                    
                    this.closeRecoveryScheduler.start(dto.source, dto.entity);
                    this.closeBiFastVerifyScheduler.start(dto.source, dto.entity)
                }
            }
            if (dto.status === "OPEN") {
                this.closeRecoveryScheduler.stop(
                    dto.source,
                    dto.entity
                );
                this.closeBiFastVerifyScheduler.stop(dto.source, dto.entity)
            }
            await this.processor.execute(dto);
        } catch (err) {
            // swallow to avoid crashing the client; log instead
            // eslint-disable-next-line no-console
            console.error("BifastConsumer on message error", err);
        }
        });

        // also optionally start WA client here if not started externally
        this.wa.start();
    }

    stop() {
        try {
        this.wa.stop();
        } catch (err) {
        // ignore
        }
    }
}
