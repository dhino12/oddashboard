// src/infrastructure/consumers/whatsapp/BifastConsumer.ts
import { WhatsAppClient, RawWhatsAppMessage } from "./WhatsappClient";
import { parseBifastMessage } from "./MessageParser";
import { ProcessMonitoringEvent } from "../../../application/usecases/ProcessMonitoringEvent/ProcessMonitoringEvent";
import { uuid } from "../../../utils/UUID";

export class BifastConsumer {
    constructor(private wa: WhatsAppClient, private processor: ProcessMonitoringEvent) {}

    start() {
        this.wa.on("message", async (msg: RawWhatsAppMessage) => {
        try {
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
