// src/infrastructure/consumers/whatsapp/WhatsAppClient.ts
import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { EventEmitter } from "events";
import { initLogger } from "../../../config/logger";
import { Logger } from "winston";

export type RawWhatsAppMessage = {
    id?: string; // message id if available
    body: string;
    from: string;
    timestamp?: number; // epoch ms
    raw?: Message;
};

export class WhatsAppClient extends EventEmitter {
    private client?: Client;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 10;
    private readonly baseReconnectMs = 1000; // initial backoff
    private started = false;
    private logger: Logger

    constructor(
        private readonly clientId = "incident-bot",
        logger: Logger,
    ) {
        super();
        this.logger = logger
    }

    start() {
        if (this.started) return;
        this.started = true;

        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: this.clientId }),
            puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] },
        });

        this.client.on("qr", (qr: string) => {
            this.logger.info("WhatsApp QR code received — scan with WhatsApp mobile app.");
            qrcode.generate(qr, { small: true });
        });

        this.client.on("ready", () => {
            this.logger.info("WhatsApp client ready");
            this.reconnectAttempts = 0;
            this.emit("ready");
        });

        this.client.on("authenticated", () => {
            this.logger.info("WhatsApp authenticated");
        });

        this.client.on("auth_failure", (msg: any) => {
            this.logger.warn("WhatsApp auth failure", msg);
            // force restart which will prompt QR if needed
            this.scheduleReconnect(true);
        });

            this.client.on("disconnected", (reason: any) => {
            this.logger.warn("WhatsApp disconnected:", reason);
            this.scheduleReconnect(false);
            this.emit("disconnected", reason);
        });

        this.client.on("message", (message: Message) => {
            try {
                const raw: RawWhatsAppMessage = {
                    id: (message?.id as any)?.id || (message?.id as any)?._serialized || undefined,
                    body: message.body,
                    from: message.from,
                    timestamp: (message.timestamp ? message.timestamp * 1000 : Date.now()),
                    raw: message,
                };
                this.logger.info(`ℹ️  ${message.from} : ${message.body}`)
                this.emit("message", raw);
            } catch (err) {
                this.logger.error("Error mapping whatsapp message", err);
            }
        });

        this.client.initialize().catch((err) => {
            this.logger.error("WhatsApp client initialize error", err);
            this.scheduleReconnect(true);
        });
    }

    stop() {
        try {
            if (this.client) {
                // best-effort destroy
                // @ts-ignore
                this.client.destroy && this.client.destroy();
            }
        } catch (err) {
            this.logger.warn("error stopping whatsapp client", err);
        } finally {
            this.started = false;
        }
    }

    private scheduleReconnect(forceAuth = false) {
        this.reconnectAttempts++;
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            this.logger.error("max whatsapp reconnect attempts reached");
            return;
        }
        const delay = this.baseReconnectMs * Math.pow(2, this.reconnectAttempts);
        this.logger.info(`scheduling whatsapp reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(() => {
            try {
                // destroy and restart client
                // @ts-ignore
                this.client && this.client.destroy && this.client.destroy();
            } catch (err) {
                this.logger.warn("error destroying whatsapp client before reconnect", err);
            }
            this.start();
        }, delay);
    }
}
