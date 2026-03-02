import { Server } from "socket.io"
import {Server as HttpServer} from "http"
import { Logger } from "winston"

let io: Server

export function initWS(server: HttpServer, logger: Logger) {
    io = new Server(server, {
        cors: { origin: "*" }
    })

    io.on("connection", (socket) => {
        console.log("🔌 Consumer connected:", socket.id)
    })
}

export function publish(topic: string, payload: unknown) {
    if (!io) throw new Error("WS not initialized")
    io.emit(topic, payload)
}