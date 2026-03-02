import { EventEmitter } from "events";
import { Logger } from "winston";
import WebSocket from "ws";
import { MessageBus } from "../ws/MessageBus";
import { io, Socket } from "socket.io-client";

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
    private socket: Socket
    private connected: boolean = false;

    constructor(
        private readonly wsUrl = "",
        private readonly logger: Logger
    ) { 
        super()
        this.socket = io(wsUrl, {
            transports: ["websocket"],
            reconnection: true
        })
    }

    // adapterWuzApiMessage(payload: WuzApiMessagePayload) {
    //     const msg = {
    //         key: {
    //             id: payload.data.id,
    //             fromMe: false,
    //             remoteJid: payload.data.from,
    //             participant: payload.data.participant,
    //         },
    //         message: {
    //             conversation: payload.data.text,
    //             extendedTextMessage: {
    //                 text: ""
    //             }
    //         },
    //         messageTimestamp: payload.data.timestamp,
    //     };

    //     return msg;
    // }

    start() {
        this.socket.on("connect", () => {
            console.log("🔌 Connected to ingress")
        })

        // 🔥 INI PENGGANTI BAILEYS LISTENER
        this.socket.on("whatsapp.message", (msg) => {
            console.log('whatsapp.message', msg);
            
            this.emit("message", msg)
        })
    }

    // async start() {
    //     if (this.connected) return
    //     this.ws = new WebSocket(this.url);
    //     MessageBus.on("whatsapp.message", async (raw) => {
    //         console.log(raw);
    //     })
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
    // }

    async sendMessage(jid: string, text: string) {
        if (!this.connected) {
            throw new Error("WebSocket not connected")
        }

        return new Promise((resolve, reject) => {
            this.socket.emit("whatsapp.send", { jid, text }, (ack: any) => {
                if (ack?.success) {
                    resolve(ack)
                } else {
                    reject(new Error(ack?.error || "Send failed"))
                }
            })
        })
    }
}