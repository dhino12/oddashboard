// infrastructure/whatsapp/WuzApiWsClient.ts
import { io, Socket } from "socket.io-client";
import { MessageBus } from "../ws/MessageBus";

export type RawWhatsAppMessage = {
    id?: string;
    body: string;
    from: string;          // group / user jid
    participant?: string; // siapa yg chat di group
    timestamp?: number;
    raw?: unknown;
};

export function adaptWuzApiMessage(data: any): RawWhatsAppMessage {
    return {
        id: data.id,
        body: data.text,
        from: data.from,                // group jid
        participant: data.participant,  // sender jid
        timestamp: data.timestamp * 1000,
        raw: data,
    };
}

export class WuzApiWsClient {
    private socket: Socket;

    constructor(wsUrl: string) {
        this.socket = io(wsUrl, {
            transports: ["websocket"],
            reconnection: true,
        });
    }

    start() {
        this.socket.on("connect", () => {
            console.log("🔌 Connected to WA Ingress WS");
        });

        this.socket.on("message", (data) => {
            const raw = adaptWuzApiMessage(data);
            MessageBus.emit("whatsapp.message", raw);
        });
    }
}