// src/infrastructure/consumers/whatsapp/BifastConsumer.ts
import { BifastMessageHandler } from "../../../application/usecases/BiFastMessageHandler/BiFastMessageHandler";
import { ENV } from "../../../config/env";
import { RawWhatsAppMessage } from "./WhatsappClient";
import { v4 as uuid } from "uuid";

export class BifastConsumer {
    constructor(
        private wa: any /* WhatsAppClient | WhatsAppClientV2 */,
        private handler: BifastMessageHandler
    ) {}

    start() {
        this.wa.on("message", async (msg: RawWhatsAppMessage) => {
            try {
                // minimal validation/filtering in consumer is OK
                if (
                    msg.from != ENV.LISTEN_GROUP_CHAT_TEST_BROADCAST &&
                    msg.from != ENV.LISTEN_GROUP_CHAT_BIFAST_MONITORING && 
                    msg.from != ENV.ALERT_WA_NUMBER &&
                    msg.from != ENV.LISTEN_GROUP_CHAT_BIFAST_HELPDESK
                ) return;
                await this.handler.handle({
                    id: msg.id ?? uuid(),
                    from: msg.from,
                    body: msg.body ?? "",
                    timestamp: msg.timestamp ?? Date.now(),
                });
            } catch (err) {
                console.error("BifastConsumer on message error", err);
            }
        });

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