import { EventEmitter } from "events";
import { Logger } from "winston";
import WebSocket from "ws";
import { MessageBus } from "../ws/MessageBus";

export type RawWhatsAppMessage = {
    id?: string;
    body: string;
    from: string;
    timestamp?: number;
    participant: string | null | undefined,
    raw?: any;
};
type WuzApiMessagePayload = {
    event: string;
    data: {
        id: string;
        from: string;
        participant?: string;
        type: "text";
        text: string;
        timestamp: number;
    };
};

export class WhatsAppClientV2 extends EventEmitter {
    private ws ?: WebSocket
    private connected: boolean = false;

    constructor(
        private readonly url = "wss://10.113.88.171",
        private readonly logger: Logger
    ) {
        super();
    }

    adapterWuzApiMessage(payload: WuzApiMessagePayload) {
        const msg = {
            key: {
                id: payload.data.id,
                fromMe: false,
                remoteJid: payload.data.from,
                participant: payload.data.participant,
            },
            message: {
                conversation: payload.data.text,
                extendedTextMessage: {
                    text: ""
                }
            },
            messageTimestamp: payload.data.timestamp,
        };

        return msg;
    }

    async start() {
        if (this.connected) return
        this.ws = new WebSocket(this.url);
        MessageBus.on("whatsapp.message", async (raw) => {
            console.log(raw);
        })
        // this.ws.on("message", async (data) => {
        //     try {
        //         const payload = JSON.parse(data.toString()) as WuzApiMessagePayload;
        //         if (payload.event !== "message") return;
        //         const msg =this.adapterWuzApiMessage(payload);
        //         if (!msg.message || msg.key.fromMe) return;
        //         const body = msg.message.conversation ||
        //             msg.message?.extendedTextMessage?.text ||
        //             ""
        //         if (!body) return;
        //         const raw: RawWhatsAppMessage = {
        //             id: msg.key.id ?? "",
        //             body,
        //             from: msg.key.remoteJid!, // ID GROUP
        //             participant: msg.key.participant, // siapa yg chat
        //             timestamp: Number(msg.messageTimestamp) * 1000,
        //             raw: msg,
        //         }
        //         if (raw.from == "120363042758870105@g.us") {
        //             this.logger.info( `ℹ️ ${raw.from}: ${raw.body.trim().replace("\n", "")}`)
        //         }
        //         if (body.toLowerCase().includes("/ping")) {
        //             await this.sendMessage(raw.from, "pong!");
        //         }

        //         if (body.toLowerCase().includes("/getinfogroup")) {
        //             await this.send({
        //                 type: "GET_GROUP_INFO",
        //                 jid: raw.from
        //             });
        //         }

        //         this.emit("message", raw);
        //     } catch (error) {
                
        //     }
        // })
    }
    async sendMessage(jid: string, text: string) {
        await this.send({
            type: "SEND_MESSAGE",
            jid,
            text
        });
    }
    private send(payload: any) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket not connected");
        }

        this.ws.send(JSON.stringify(payload));
    }
}