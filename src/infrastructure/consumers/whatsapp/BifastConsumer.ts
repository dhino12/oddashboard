// src/infrastructure/consumers/whatsapp/BifastConsumer.ts
import { WhatsAppClient, RawWhatsAppMessage } from "./WhatsappClient";
import { parseBifastMessage } from "./MessageParser";
import { ProcessMonitoringEvent } from "../../../application/usecases/ProcessMonitoringEvent/ProcessMonitoringEvent";
import { uuid } from "../../../utils/UUID";
import { CloseRecoveryScheduler } from "../../scheduler/CloseRecoveryBiFastScheduler";
import { ENV } from "../../../config/env";

export class BifastConsumer {
    constructor(
        private wa: WhatsAppClient, 
        private processor: ProcessMonitoringEvent,
        private closeRecoveryScheduler: CloseRecoveryScheduler
    ) {}

    start() {
        this.wa.on("message", async (msg: RawWhatsAppMessage) => {
        try {
            if (
                msg.from != ENV.LISTEN_GROUP_CHAT_TEST_BROADCAST || 
                msg.from != ENV.LISTEN_GROUP_CHAT_BIFAST_MONITORING
            ) return
            // msg.body may contain other text; parse it
            const parsed = parseBifastMessage(msg.body || "");
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
            if (dto.status === "CLOSED") {
                this.closeRecoveryScheduler.start(
                    dto.source,
                    dto.entity
                );
            }
            if (dto.status === "OPEN") {
                this.closeRecoveryScheduler.stop(
                    dto.source,
                    dto.entity
                );
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
