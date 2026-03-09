import { WhatsAppEventPayload } from "./type"
import { publish } from "./websocket"

export function normalize(data: WhatsAppEventPayload) {
    return {
        id: data.event.Info.ID,
        body: data.event.Message?.conversation ?? data.event.Message?.extendedTextMessage?.text,
        from: data.event.Info.Chat,
        participant: data.event.Info.PushName,
        timestamp: data.event.Info.Timestamp,
        sender: data.event.Info.Sender, // group / private chat
        raw: data.event.RawMessage,
    }
}

export function handleWuzApiWebhook(req: any, res: any) {
    // WuzAPI kirim form-urlencoded
    let payload = req.body
    if (payload == undefined || payload?.jsonData == undefined) {
        return
    }
    console.log("📩 Incoming open_incident webhook")

    // Kadang data JSON string
    if (typeof payload?.jsonData === "string") {
        payload.data = JSON.parse(payload.jsonData)
    }

    if (payload.data.type != "Message") {
        console.log("MASUK IF Incoming open_incident");
        console.log("pesan bukan message");
        
        return res.sendStatus(200)
    }

    const normalized = normalize(payload.data)
    publish("whatsapp.message", normalized)

    res.sendStatus(200)
}