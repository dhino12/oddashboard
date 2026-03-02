import express from "express";
import { QrisController } from "../../interfaces/controllers/QrisController";
import { handleWuzApiWebhook } from "../ws/webhook";

export function registerRoutes(app: express.Express) {
    const router = express.Router();
    const qris = new QrisController();
    router.post("/qris/health", qris.reportHealth.bind(qris));
    router.get("/health", (req, res) => res.json({ ok: true }));
    router.post("/webhook/wuzapi", handleWuzApiWebhook)
    
    app.use("/api", router);
}
