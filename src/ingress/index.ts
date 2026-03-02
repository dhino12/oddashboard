// import express from "express"
// import http from "http"
// import { initWS } from "./websocket"
// import { handleWuzApiWebhook } from "./webhookParsing"

// const app = express()

// // WuzAPI pakai x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }))
// app.use(express.json())

// const server = http.createServer(app)

// initWS(server)

// app.post("/webhook/wuzapi", handleWuzApiWebhook)

// server.listen(5000, () => {
//     console.log("🚀 Ingress running on :5000")
// })