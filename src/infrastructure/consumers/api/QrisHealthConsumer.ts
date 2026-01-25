import { ProcessMonitoringEvent } from "../../../application/usecases/ProcessMonitoringEvent/ProcessMonitoringEvent";

export function createQrisHealthConsumer(processMonitoring: ProcessMonitoringEvent) {
    return {
        async onHealth(result: { ok: boolean }) {
            await processMonitoring.execute({
                source: "QRIS",
                entity: "QRIS",
                status: result.ok ? "SUCCESS" : "FAILURE",
                occurredAt: Date.now(),
            });
        },
        // helper to poll remote logs (fetch) can be inside or external scheduler
    };
}