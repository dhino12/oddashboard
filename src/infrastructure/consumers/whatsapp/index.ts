import qrcode from "qrcode-terminal";
import { Logger } from "winston";
import { WhatsAppClient } from "./WhatsappClient";

export function startWhatsApp(logger: Logger) {
    const wa = new WhatsAppClient("./baileys_auth", logger);

    wa.on("qr", (qr: string) => {
        logger.info("QR received");
        qrcode.generate(qr, { small: true });
    });

    wa.on("ready", () => {
        logger.info("✅ WhatsApp READY");
    });

    wa.on("disconnected", (reason) => {
        logger.warn("WhatsApp DISCONNECTED", { reason });
    });

    wa.on("message", (msg) => {
        logger.info("Incoming WA message", msg);

        // forward ke application layer
        // example: commandHandler.handle(msg)
    });

    wa.start().catch((err) => {
        logger.error("Failed to start WhatsApp", err);
    });
    return wa;
}