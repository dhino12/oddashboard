import { publish } from "./websocket"

export function normalize(data: any) {
    return {
        id: data.id,
        body: data.text?.body ?? "",
        from: data.chatId,
        participant: data.senderId,
        timestamp: data.timestamp * 1000,
        source: "wuzapi"
    }
}

export function handleWuzApiWebhook(req: any, res: any) {
    console.log("📩 Incoming open_incident webhook")

    // WuzAPI kirim form-urlencoded
    let payload = req.body
    console.log(payload); 

    // Kadang data JSON string
    if (typeof payload.data === "string") {
        payload.data = JSON.parse(payload.data)
    }

    if (payload.event !== "Message") {
        return res.sendStatus(200)
    }

    const normalized = normalize(payload.data)

    // 🔥 INI BAGIAN WEBHOOK → WEBSOCKET
    publish("whatsapp.message", normalized)

    res.sendStatus(200)
}