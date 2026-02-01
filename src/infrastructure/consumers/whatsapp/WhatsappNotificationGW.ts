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
                const message = `🚨 INCIDENT DETECTED\nSource : ${payload.source}\nEntity : ${payload.entity}\nReason : ${3}x flapping detected\nTime   : ${new Date().toISOString()}`
                await this.wa.sendMessage(this.targetWA, message)
            }
            if (typeof this.targetWA == "object") {
                for (const targetNumber of this.targetWA) {
                    const message = `🚨 INCIDENT DETECTED\nSource : ${payload.source}\nEntity : ${payload.entity}\nReason : ${3}x flapping detected\nTime   : ${new Date().toISOString()}`
                    await this.wa.sendMessage(targetNumber, message)
                }
            }
        } catch (err) {
            console.error("BifastConsumer notifyIncident error", err);
            throw err;
        }
    }
}