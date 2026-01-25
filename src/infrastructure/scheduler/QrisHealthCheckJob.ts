// import fetch from "node-fetch";
import { createQrisHealthConsumer } from "../consumers/api/QrisHealthConsumer";

export function startQrisPolling(consumer: ReturnType<typeof createQrisHealthConsumer>) {
    setInterval(async () => {
        try {
        const res = await fetch("http://10.238.38.117/service/bifast/logs/");
        const json = await res.json();
        // adapt to your log format and call consumer.onHealth or processMonitoring
        const ok = Boolean(json?.ok);
        await consumer.onHealth({ ok });
        } catch (err) {
            console.error("qris poll error", err);
            await consumer.onHealth({ ok: false });
        }
    }, 30 * 1000); // every 30s, tune as needed
}
