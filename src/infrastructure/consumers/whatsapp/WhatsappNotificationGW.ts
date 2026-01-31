import { NotificationGateway } from "../../../application/ports/NotificationGateway";
import { WhatsAppClient } from "./WhatsappClient";

export class WhatsAppNotificationGateway implements NotificationGateway {
    constructor(
        private wa: WhatsAppClient,
        private targetWA: string | []
    ) {}
    async notifyIncident(payload: { source: string; entity: string; message: string; }): Promise<void> {
        try {
            if (typeof this.targetWA == "string") {
                console.log(`sendMessage to ${this.targetWA}`);
                
                await this.wa.sendMessage(this.targetWA, `
                    🚨 INCIDENT DETECTED
                    Source : ${payload.source}
                    Entity : ${payload.entity}
                    Reason : ${3}x flapping detected
                    Time   : ${new Date().toISOString()}
                `)
            }
            if (typeof this.targetWA == "object") {
                for (const targetNumber of this.targetWA) {
                    await this.wa.sendMessage(targetNumber, `
                        🚨 INCIDENT DETECTED
                        Source : ${payload.source}
                        Entity : ${payload.entity}
                        Reason : ${3}x flapping detected
                        Time   : ${new Date().toISOString()}
                    `)
                }
            }
        } catch (err) {
            console.error("BifastConsumer notifyIncident error", err);
            throw err;
        }
    }
}