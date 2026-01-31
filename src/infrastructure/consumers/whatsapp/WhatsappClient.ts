import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    WASocket,
    proto,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    CacheStore,
    DEFAULT_CONNECTION_CONFIG,
    generateMessageIDV2
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { EventEmitter } from "events";
import { Logger } from "winston";
import NodeCache from "@cacheable/node-cache";
import pino from "pino";

export type RawWhatsAppMessage = {
    id?: string;
    body: string;
    from: string;
    timestamp?: number;
    raw?: proto.IWebMessageInfo;
};

export class WhatsAppClient extends EventEmitter {
    private socket?: WASocket;
    private started = false;
    private reconnectAttempts = 0;
    private connected = false;
    private reconnecting = false;


    private readonly maxReconnectAttempts = 10;
    private readonly baseReconnectMs = 1000;

    private msgRetryCounterCache = new NodeCache() as CacheStore;

    constructor(
        private readonly sessionPath = "./baileys_auth",
        private readonly logger: Logger
    ) {
        super();
    }

    async start() {
        const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        this.socket = makeWASocket({
            version,
            waWebSocketUrl: DEFAULT_CONNECTION_CONFIG.waWebSocketUrl,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys),
            },logger: pino({level: "fatal"}),
            msgRetryCounterCache: this.msgRetryCounterCache,
        });

        this.socket.ev.process(async (events) => {
            if (events["connection.update"]) {
                const { connection, lastDisconnect, qr } = events["connection.update"];
                const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;

                if (qr) this.emit("qr", qr);
                if (connection === "open") {
                    if (!this.connected) this.emit("ready");
                    this.connected = true;
                    this.reconnecting = false;
                    this.reconnectAttempts = 0;
                    return;
                }

                if (connection === "close") {
                    this.connected = false;
                    this.logger.error(`❌ Connection ${connection} - ${reason}`);
                    if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
                        this.logger.error("Session invalid — stop reconnect");
                        return;
                    }
                    if (reason === DisconnectReason.restartRequired || reason === 440) {
                        return
                    };

                    if (!this.reconnecting) {
                        this.reconnecting = true;
                        this.scheduleReconnect();
                    }
                }
            }

            if (events["creds.update"]) {
                this.logger.info("Credentials has been saved !");
                await saveCreds();
            }
            if (events["messages.upsert"]) {
                const upsert = events["messages.upsert"];
                if (upsert.type !== "notify") return;
                for (const msg of upsert.messages) {
                    if (!msg.message || msg.key.fromMe) continue;

                    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
                    if (!body) continue;
                    const raw: RawWhatsAppMessage = {
                        id: msg.key.id ?? "",
                        body,
                        from: msg.key.remoteJid!,
                        timestamp: Number(msg.messageTimestamp) * 1000,
                        raw: msg,
                    };
                    this.logger.info(`ℹ️ ${raw.from}: ${raw.body.trim().replace("\n", "")}`);
                    
                    if (body.toLowerCase().includes("ping")) {
                        await this.sendMessage(raw.from, "pong!");
                    }

                    this.emit("message", raw);
                }
            }
        });
    }

    async stop() {
        try {
            this.socket?.end(undefined);
        } catch (err) {
            this.logger.warn("Error stopping WhatsApp client", err);
        } finally {
            this.started = false;
        }
    }

    async sendMessage(jid: string, text: string) {
        if (!this.socket) throw new Error("WhatsApp socket not ready");
        const id = generateMessageIDV2(this.socket.user?.id)
        await this.socket.sendMessage(jid!, { text }, {messageId: id })
    }

    private restartImmediate() {
        try {
            this.socket?.end(undefined);
        } catch {}

        setTimeout(() => {
            this.start().catch((err) =>
                this.logger.error("Restart failed", err)
            );
        }, 500);
    }

    private scheduleReconnect() {
        this.reconnectAttempts++;

        if (this.reconnectAttempts > 5) {
            this.logger.error("Reconnect limit reached");
            return;
        }

        const delay = 2000;
        this.logger.info(`Reconnecting in ${delay}ms`);

        setTimeout(() => this.start(), delay);
    }

}
