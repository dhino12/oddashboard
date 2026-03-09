import { EventEmitter } from "events";
import { Logger } from "winston";
import { MessageBus } from "../ws/MessageBus";
import { io, Socket } from "socket.io-client";
import { setAxiosRequestOpenClose } from "../../../config/bifastlist";

export type RawWhatsAppMessage = {
    id?: string;
    body: string;
    from: string;
    participant: string | null | undefined;
    timestamp?: number;
    sender: string;
    raw?: any;
}; 

export class WhatsAppClientV2 extends EventEmitter {
    private socket: Socket
    private started: Boolean = false

    constructor(
        private readonly wsUrl = "",
        private readonly logger: Logger
    ) { 
        super()
        this.socket = io("http://localhost:3000", {
            transports: ["websocket"],
            reconnection: false,
            autoConnect: false
        })
    } 
    start() {
        if (this.started) return
        this.started = true 
        this.socket.connect()
        this.socket.on("connect", () => {
            console.log("🔌 Connected to ingres WA Client V2 " + this.socket.connected)
        })

        // 🔥 INI PENGGANTI BAILEYS LISTENER
        this.socket.on("whatsapp.message", async (msg: RawWhatsAppMessage) => {
            console.log('listener whatsapp');
            if (msg.from === "120363042758870105@g.us") {
                this.logger.info( `ℹ️ ${msg.from}: ${msg.body?.trim().replace("\n", "")}`)
            }
            if (msg.body?.toLowerCase().includes("/ping")) {
                this.logger.info("PING")
                await this.sendMessage(msg.from, "pong!");
            }
            if (msg.body?.toLowerCase().includes("open")) {
                setAxiosRequestOpenClose("OPEN")
            }
            if (msg.body?.toLowerCase().includes("close")) {
                setAxiosRequestOpenClose("CLOSE")
            }
            
            this.emit("message", msg)
        })
    }

    stop() {
        this.started = false;
        this.socket.disconnect()
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
        //             this.logger.info( ℹ️ ${raw.from}: ${raw.body.trim().replace("\n", "")})
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
        if (!this.started) {
            throw new Error("WebSocket not connected")
        }

        return new Promise((resolve, reject) => {
            console.log('message sender = ' + text + " " + jid);
            
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