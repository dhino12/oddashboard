import { Server } from "socket.io"
import {Server as HttpServer} from "http"
import { Logger } from "winston"
import axios from "axios"

let io: Server

export function initWS(server: HttpServer, logger: Logger) {
    io = new Server(server, {
        cors: { origin: "*" }
    })

    io.on("connection", (socket: any) => {
        console.log("🔌 Consumer connected:", socket.id, " - clientcount: " + io.engine.clientsCount)

        socket.on("whatsapp.send", async (data: any, callback: any) => {
        try {
            const response = await axios.post(
                "http://10.113.88.171:4444/chat/send/text",
                {
                    Phone: data.jid,
                    Body: data.text
                },
                {
                    headers: {
                        Token: "openincident"
                    }
                }
            )
            
            callback({ success: true, data: response.data })
        } catch (err: any) {
                callback({
                    success: false,
                    error: err.response?.data || err.message
                })
            }
        })
    })
}

export function publish(topic: string, payload: unknown) {
    if (!io) throw new Error("WS not initialized")
    io.emit(topic, payload)
}